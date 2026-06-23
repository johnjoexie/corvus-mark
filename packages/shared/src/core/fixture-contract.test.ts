import { describe, expect, it } from 'vitest'

import { buildClassificationBatches } from './classification-batches'
import { buildDefaultRulePack, classifyByDefaultDirectory } from './directory-fallback'
import type { NormalizedBookmark } from '../schema/bookmark'
import { guardOutboundItems } from '../schema/privacy'
import { sanitizeUrl } from '../schema/url'

import adversarialPrivacy from '../../../../requirements/08-project-skeleton/fixtures/adversarial-privacy.json'
import alreadyOrganized from '../../../../requirements/08-project-skeleton/fixtures/already-organized.json'
import deepNested from '../../../../requirements/08-project-skeleton/fixtures/deep-nested.json'
import dupUrls from '../../../../requirements/08-project-skeleton/fixtures/dup-urls.json'
import large5000 from '../../../../requirements/08-project-skeleton/fixtures/large-5000-synthetic.json'
import nonAsciiEmojiTitles from '../../../../requirements/08-project-skeleton/fixtures/non-ascii-emoji-titles.json'

interface FixtureBookmark {
  id: string
  title: string
  url: string
  currentPath: string[]
}

function expandLargeFixture(): FixtureBookmark[] {
  const { count, host, pathPrefix, titlePrefix, currentPath } = large5000.generator
  return Array.from({ length: count }, (_, index) => ({
    id: `large-${index + 1}`,
    title: `${titlePrefix} ${index + 1}`,
    url: `https://${host}/${pathPrefix}/${index + 1}?utm_source=newsletter&v=${index + 1}`,
    currentPath,
  }))
}

describe('required fixture contracts', () => {
  it('covers every required v0.1 fixture family', () => {
    expect(dupUrls.id).toBe('fixture_dup_urls')
    expect(adversarialPrivacy.id).toBe('fixture_adversarial_privacy')
    expect(deepNested.id).toBe('fixture_deep_nested')
    expect(alreadyOrganized.id).toBe('fixture_already_organized')
    expect(nonAsciiEmojiTitles.id).toBe('fixture_non_ascii_emoji_titles')
    expect(large5000.id).toBe('fixture_large_5000_synthetic')
    expect(expandLargeFixture()).toHaveLength(5000)
  })

  it('proves duplicate URL fixture preserves meaningful query identity but ignores tracking noise', async () => {
    const infos = await Promise.all(
      dupUrls.bookmarks.map((bookmark) => sanitizeUrl(bookmark.url, 'fixture-salt')),
    )
    const [withA, withB, withTrackingNoise] = infos

    expect(withA).toBeDefined()
    expect(withB).toBeDefined()
    expect(withTrackingNoise).toBeDefined()

    expect(withA!.sanitizedUrl).toBe('https://example.com/watch')
    expect(withB!.sanitizedUrl).toBe('https://example.com/watch')
    expect(withTrackingNoise!.sanitizedUrl).toBe('https://example.com/watch')
    expect(withA!.urlKeyHash).not.toBe(withB!.urlKeyHash)
    expect(withA!.urlKeyHash).toBe(withTrackingNoise!.urlKeyHash)
  })

  it('keeps adversarial privacy fixture fail-closed before outbound send', async () => {
    const sanitized = await Promise.all(
      adversarialPrivacy.bookmarks.map(async (bookmark) => ({
        bookmark,
        info: await sanitizeUrl(bookmark.url, 'fixture-salt'),
      })),
    )

    expect(sanitized.some(({ info }) => !info.isValid)).toBe(true)
    expect(() =>
      guardOutboundItems(
        sanitized
          .filter(({ info }) => info.isValid)
          .map(({ bookmark, info }) => ({
            ref: bookmark.id,
            title: bookmark.title,
            sanitizedUrl: info.sanitizedUrl,
            hostKey: info.hostKey,
            currentPath: bookmark.currentPath,
          })),
      ),
    ).toThrow(/privacy_violation/)
  })

  it('keeps non-ASCII titles classifiable through fallback taxonomy', async () => {
    const rulePack = buildDefaultRulePack()
    const classifications = await Promise.all(
      nonAsciiEmojiTitles.bookmarks.map(async (bookmark) => {
        const info = await sanitizeUrl(bookmark.url, 'fixture-salt')
        return classifyByDefaultDirectory({ hostKey: info.hostKey }, rulePack)
      }),
    )

    expect(classifications).toHaveLength(nonAsciiEmojiTitles.bookmarks.length)
    expect(classifications.every((classification) => classification.confidence >= 0.75)).toBe(true)
  })

  it('expands large synthetic fixture into <=80-item batches without losing items', async () => {
    const bookmarks: NormalizedBookmark[] = await Promise.all(
      expandLargeFixture().map(async (bookmark) => {
        const info = await sanitizeUrl(bookmark.url, 'fixture-salt')
        return {
          schemaVersion: 1,
          id: bookmark.id,
          browserId: bookmark.id,
          parentId: 'large-import',
          title: bookmark.title,
          rawUrl: bookmark.url,
          sanitizedUrl: info.sanitizedUrl,
          urlKeyHash: info.urlKeyHash,
          hostKey: info.hostKey,
          currentPath: bookmark.currentPath,
          isValidUrl: info.isValid,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }
      }),
    )

    const batches = buildClassificationBatches(bookmarks, 80)
    expect(batches).toHaveLength(63)
    expect(batches.every((batch) => batch.items.length <= 80)).toBe(true)
    expect(batches.flatMap((batch) => batch.items)).toHaveLength(5000)
  })
})
