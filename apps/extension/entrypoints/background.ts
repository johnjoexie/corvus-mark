import {
  OpenAiCompatibleProvider,
  buildDefaultRulePack,
  buildOrganizePlan,
  classifyByDefaultDirectory,
  createCorvusId,
  flattenBookmarkTree,
  nowIso,
  recordTraceEvent,
  resolveTargetParentId as resolveTargetFolderParentId,
  rollbackMoveLog,
  sanitizeUrl,
  type MoveLog,
  type NormalizedBookmark,
  type OrganizePlan,
  type TraceEvent,
} from '@corvus-mark/shared'
import { browser } from 'wxt/browser'
import { applySelectedPlanItems } from '@corvus-mark/shared'
import { ChromiumBookmarkAdapter } from '../lib/chromium-bookmark-adapter'
import { StorageSecretStoreAdapter, maskSecret } from '../lib/secret-store-adapter'
import type { BackgroundRequest, BackgroundResponse, ProviderSettings } from '../lib/messages'

const SETTINGS_KEY = 'settings:provider'
const LAST_PLAN_KEY = 'runtime:lastPlan'
const LAST_MOVE_LOG_KEY = 'runtime:lastMoveLog'
const TRACE_EVENTS_KEY = 'runtime:traceEvents'
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

async function appendTraceEvent(event: TraceEvent): Promise<void> {
  const stored = await browser.storage.local.get(TRACE_EVENTS_KEY)
  const current = Array.isArray(stored[TRACE_EVENTS_KEY]) ? stored[TRACE_EVENTS_KEY] : []
  await browser.storage.local.set({ [TRACE_EVENTS_KEY]: [...current, event].slice(-500) })
}

async function recordRuntimeTrace(input: {
  traceId: string
  runId: string
  phase: TraceEvent['phase']
  level: TraceEvent['level']
  message: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  await recordTraceEvent({
    store: { appendTraceEvent },
    eventId: createCorvusId('evt'),
    traceId: input.traceId,
    runId: input.runId,
    phase: input.phase,
    level: input.level,
    message: input.message,
    createdAt: nowIso(),
    metadata: input.metadata,
  })
}

async function buildPreviewPlan(): Promise<{ plan: OrganizePlan; degraded: boolean }> {
  const settings = await getProviderSettings()
  const bookmarks = await normalizeBookmarks()
  const rulePack = buildDefaultRulePack()
  const runId = createCorvusId('run')
  const traceId = createCorvusId('trace')
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
      runId,
      traceId,
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
    runId,
    traceId,
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
  await recordRuntimeTrace({
    traceId,
    runId,
    phase: 'preview',
    level: 'info',
    message: degraded ? 'preview built with offline fallback' : 'preview built with provider',
    metadata: {
      itemCount: plan.items.length,
      moveItems: plan.stats.moveItems,
      blockedItems: plan.stats.blockedItems,
      degraded,
    },
  })
  return { plan, degraded }
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
        resolveTargetParentId: (item) => resolveTargetFolderParentId(bookmarkManager, item.targetPath),
        createdAt: nowIso(),
        moveLogId: createCorvusId('move'),
      })
      await browser.storage.local.set({ [LAST_MOVE_LOG_KEY]: moveLog })
      await recordRuntimeTrace({
        traceId: request.plan.traceId,
        runId: request.plan.runId,
        phase: 'apply',
        level: moveLog.status === 'partial_failed' ? 'warning' : 'info',
        message: `apply ${moveLog.status}`,
        metadata: {
          status: moveLog.status,
          itemCount: moveLog.items.length,
          successItems: moveLog.items.filter((item) => item.status === 'success').length,
          skippedItems: moveLog.items.filter((item) => item.status.startsWith('skipped_')).length,
          failedItems: moveLog.items.filter((item) => item.status === 'failed').length,
        },
      })
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
      await recordRuntimeTrace({
        traceId: rolledBack.traceId,
        runId: rolledBack.runId,
        phase: 'rollback',
        level: 'info',
        message: `rollback ${rolledBack.status}`,
        metadata: {
          status: rolledBack.status,
          itemCount: rolledBack.items.length,
          rolledBackItems: rolledBack.items.filter((item) => item.status === 'rolled_back').length,
          skippedItems: rolledBack.items.filter((item) => item.status === 'rollback_skipped').length,
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
