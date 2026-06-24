import { describe, expect, it } from 'vitest'
import {
  buildDefaultRulePack,
  classifyByDefaultDirectory,
  deriveAllowedTargetRoots,
} from './directory-fallback'
import { sanitizeUrl } from '../schema/url'

describe('classifyByDefaultDirectory', () => {
  it('classifies known hosts into seed taxonomy paths', () => {
    const rulePack = buildDefaultRulePack()

    expect(classifyByDefaultDirectory({ hostKey: 'react.dev' }, rulePack).targetPath).toEqual([
      'Dev',
      'Frontend',
    ])
  })

  it('falls back unmatched repeated hosts to Reference', () => {
    const rulePack = buildDefaultRulePack()

    expect(
      classifyByDefaultDirectory({ hostKey: 'example.com', hostFrequency: 3 }, rulePack).targetPath,
    ).toEqual(['Reference'])
  })

  it('falls back unmatched sparse hosts to Uncategorized', () => {
    const rulePack = buildDefaultRulePack()

    expect(classifyByDefaultDirectory({ hostKey: 'example.com' }, rulePack).targetPath).toEqual([
      'Uncategorized',
    ])
  })

  it('classifies every bookmark in the small programmer fixture without inventing folders', async () => {
    const rulePack = buildDefaultRulePack()
    const fixture = await import('../../../../requirements/08-project-skeleton/fixtures/small-100-programmer.json')
    const seedKeys = new Set(rulePack.seedPaths.map((path) => path.join('/')))

    const classifications = await Promise.all(
      fixture.default.bookmarks.map(async (bookmark) => {
        const sanitized = await sanitizeUrl(bookmark.url, 'test_salt')
        return classifyByDefaultDirectory({ hostKey: sanitized.hostKey }, rulePack)
      }),
    )

    expect(classifications).toHaveLength(fixture.default.bookmarks.length)
    expect(classifications.every((classification) => seedKeys.has(classification.targetPath.join('/')))).toBe(
      true,
    )
    expect(
      classifications.filter((classification) => !seedKeys.has(classification.targetPath.join('/'))),
    ).toHaveLength(0)
    expect(rulePack.maxNewFolders).toBeLessThanOrEqual(12)
  })

  it('derives allowed target roots from the seed taxonomy', () => {
    const rulePack = buildDefaultRulePack()

    expect(deriveAllowedTargetRoots(rulePack)).toEqual([
      'Dev',
      'Reading',
      'Media',
      'Shopping',
      'News',
      'Social',
      'Finance',
      'Work',
      'Personal',
      'Reference',
      'Uncategorized',
    ])
  })
})
