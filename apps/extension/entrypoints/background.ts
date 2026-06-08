import {
  OpenAiCompatibleProvider,
  buildDefaultRulePack,
  buildOrganizePlan,
  classifyByDefaultDirectory,
  createCorvusId,
  flattenBookmarkTree,
  nowIso,
  rollbackMoveLog,
  sanitizeUrl,
  type MoveLog,
  type NormalizedBookmark,
  type OrganizePlan,
} from '@corvus-mark/shared'
import { browser } from 'wxt/browser'
import { applySelectedPlanItems } from '@corvus-mark/shared'
import { ChromiumBookmarkAdapter } from '../lib/chromium-bookmark-adapter'
import { StorageSecretStoreAdapter, maskSecret } from '../lib/secret-store-adapter'
import type { BackgroundRequest, BackgroundResponse, ProviderSettings } from '../lib/messages'

const SETTINGS_KEY = 'settings:provider'
const LAST_PLAN_KEY = 'runtime:lastPlan'
const LAST_MOVE_LOG_KEY = 'runtime:lastMoveLog'
const URL_SALT_KEY = 'policy:urlSalt'

const defaultSettings: Omit<ProviderSettings, 'apiKeyMasked'> = {
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
}

const secretStore = new StorageSecretStoreAdapter(browser.storage.local)
const bookmarkManager = new ChromiumBookmarkAdapter(browser)

async function getUrlSalt(): Promise<string> {
  const stored = await browser.storage.local.get(URL_SALT_KEY)
  if (typeof stored[URL_SALT_KEY] === 'string') return stored[URL_SALT_KEY]
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const salt = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  await browser.storage.local.set({ [URL_SALT_KEY]: salt })
  return salt
}

async function getProviderSettings(): Promise<ProviderSettings> {
  const stored = await browser.storage.local.get(SETTINGS_KEY)
  const settings = {
    ...defaultSettings,
    ...(typeof stored[SETTINGS_KEY] === 'object' ? stored[SETTINGS_KEY] : {}),
  } as Omit<ProviderSettings, 'apiKeyMasked'>
  return {
    ...settings,
    apiKeyMasked: maskSecret(await secretStore.getSecret(settings.provider)),
  }
}

async function normalizeBookmarks(): Promise<NormalizedBookmark[]> {
  const salt = await getUrlSalt()
  const tree = await bookmarkManager.getTree()
  const flattened = flattenBookmarkTree(tree)
  const normalized = await Promise.all(
    flattened.map(async (bookmark) => {
      const url = await sanitizeUrl(bookmark.url, salt)
      return {
        schemaVersion: 1,
        id: `bm_${bookmark.id}`,
        browserId: bookmark.id,
        parentId: bookmark.parentId,
        index: bookmark.index,
        title: bookmark.title,
        rawUrl: bookmark.url,
        sanitizedUrl: url.sanitizedUrl,
        urlKeyHash: url.urlKeyHash,
        hostKey: url.hostKey,
        currentPath: bookmark.currentPath,
        isValidUrl: url.isValid,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
    }),
  )
  return normalized.filter((bookmark) => bookmark.isValidUrl)
}

async function buildPreviewPlan(): Promise<{ plan: OrganizePlan; degraded: boolean }> {
  const settings = await getProviderSettings()
  const bookmarks = await normalizeBookmarks()
  const rulePack = buildDefaultRulePack()
  const refs = new Map<string, string>()
  bookmarks.forEach((bookmark, index) => refs.set(`b${index}`, bookmark.id))

  let assignments = bookmarks.map((bookmark, index) => {
    const fallback = classifyByDefaultDirectory({ hostKey: bookmark.hostKey }, rulePack)
    return {
      ref: `b${index}`,
      targetPath: fallback.targetPath,
      confidence: fallback.confidence,
      reason: fallback.reason,
      isNewFolder: false,
    }
  })
  let degraded = true

  const apiKey = await secretStore.getSecret(settings.provider)
  if (apiKey && bookmarks.length > 0) {
    const envelope = {
      schemaVersion: 1 as const,
      envelopeId: createCorvusId('evt'),
      runId: createCorvusId('run'),
      traceId: createCorvusId('trace'),
      createdAt: nowIso(),
      task: 'classify_bookmarks' as const,
      locale: 'en',
      directory: {
        mode: 'fallback' as const,
        allowedRoots: ['Bookmarks Bar', 'Other Bookmarks'],
        existingPaths: [],
        maxDepth: rulePack.maxDepth,
        maxNewFolders: rulePack.maxNewFolders,
      },
      items: bookmarks.slice(0, 80).map((bookmark, index) => ({
        ref: `b${index}`,
        title: bookmark.title,
        sanitizedUrl: bookmark.sanitizedUrl,
        hostKey: bookmark.hostKey,
        currentPath: bookmark.currentPath,
      })),
      budget: { maxItems: 80, maxOutputTokens: 4096 },
    }
    const provider = new OpenAiCompatibleProvider({
      baseUrl: settings.baseUrl,
      model: settings.model,
      apiKey,
    })
    const response = await provider.classifyBookmarks(envelope)
    assignments = response.assignments
    degraded = false
  }

  const plan = buildOrganizePlan({
    runId: createCorvusId('run'),
    traceId: createCorvusId('trace'),
    planId: createCorvusId('plan'),
    createdAt: nowIso(),
    bookmarks,
    assignments,
    refToBookmarkId: refs,
    autoSelectConfidenceThreshold: rulePack.autoSelectConfidenceThreshold,
    newFolderConfidenceThreshold: rulePack.newFolderConfidenceThreshold,
    maxDepth: rulePack.maxDepth,
    maxNewFolders: rulePack.maxNewFolders,
  })
  await browser.storage.local.set({ [LAST_PLAN_KEY]: plan })
  return { plan, degraded }
}

async function resolveTargetParentId(_item: OrganizePlan['items'][number]): Promise<string> {
  return '1'
}

async function handleMessage(request: BackgroundRequest): Promise<BackgroundResponse> {
  try {
    if (request.type === 'get-settings') {
      return { ok: true, settings: await getProviderSettings() }
    }
    if (request.type === 'save-settings') {
      await browser.storage.local.set({ [SETTINGS_KEY]: request.settings })
      if (request.apiKey) await secretStore.setSecret(request.settings.provider, request.apiKey)
      return { ok: true, settings: await getProviderSettings() }
    }
    if (request.type === 'preview-plan') {
      const result = await buildPreviewPlan()
      return { ok: true, ...result }
    }
    if (request.type === 'apply-plan') {
      const moveLog = await applySelectedPlanItems({
        plan: request.plan,
        bookmarkManager,
        moveLogStore: {
          saveMoveLog: async (value: MoveLog) => {
            await browser.storage.local.set({ [LAST_MOVE_LOG_KEY]: value })
          },
        },
        resolveTargetParentId,
        createdAt: nowIso(),
        moveLogId: createCorvusId('move'),
      })
      await browser.storage.local.set({ [LAST_MOVE_LOG_KEY]: moveLog })
      return { ok: true, moveLog }
    }
    if (request.type === 'rollback-last') {
      const stored = await browser.storage.local.get(LAST_MOVE_LOG_KEY)
      const moveLog = stored[LAST_MOVE_LOG_KEY] as MoveLog | undefined
      if (!moveLog) return { ok: false, error: 'No MoveLog available' }
      const rolledBack = await rollbackMoveLog({
        moveLog,
        bookmarkManager,
        moveLogStore: {
          saveMoveLog: async (value: MoveLog) => {
            await browser.storage.local.set({ [LAST_MOVE_LOG_KEY]: value })
          },
        },
      })
      return { ok: true, moveLog: rolledBack }
    }
    return { ok: false, error: 'Unknown request' }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// The background service worker is the SINGLE WRITER (see 03 §5.1): all bookmark mutations
// and StorageRoot writes go through here so the task lock and writes are effectively atomic.
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((request: BackgroundRequest) => handleMessage(request))
})
