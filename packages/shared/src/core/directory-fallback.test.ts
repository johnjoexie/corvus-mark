import { describe, expect, it } from 'vitest'
import { buildDefaultRulePack, classifyByDefaultDirectory } from './directory-fallback'

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
})
