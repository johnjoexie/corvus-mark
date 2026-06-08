import { describe, expect, it } from 'vitest'
import { directoryPathSchema, directoryProfileSchema } from './directory-profile'

const validDirectoryProfile = {
  schemaVersion: 1,
  id: 'dir_1',
  name: 'Default',
  locale: 'en',
  allowedRoots: ['Bookmarks Bar', 'Other Bookmarks'],
  seedPaths: [
    ['Dev'],
    ['Dev', 'Frontend'],
    ['Reading', 'Articles'],
    ['Uncategorized'],
  ],
  maxDepth: 3,
  maxNewFolders: 12,
  folderNameMaxLength: 40,
  autoSelectConfidenceThreshold: 0.75,
  newFolderConfidenceThreshold: 0.85,
}

describe('directoryPathSchema', () => {
  it('parses a non-empty directory path', () => {
    expect(directoryPathSchema.parse(['Dev', 'Frontend'])).toEqual(['Dev', 'Frontend'])
  })

  it('rejects an empty segment', () => {
    expect(directoryPathSchema.safeParse(['Dev', '']).success).toBe(false)
  })
})

describe('directoryProfileSchema', () => {
  it('parses a valid directory profile', () => {
    expect(directoryProfileSchema.parse(validDirectoryProfile).maxDepth).toBe(3)
  })

  it('rejects thresholds outside the confidence range', () => {
    expect(
      directoryProfileSchema.safeParse({
        ...validDirectoryProfile,
        autoSelectConfidenceThreshold: 1.5,
      }).success,
    ).toBe(false)
  })

  it('rejects seed paths deeper than maxDepth', () => {
    expect(
      directoryProfileSchema.safeParse({
        ...validDirectoryProfile,
        seedPaths: [['Dev', 'Frontend', 'React', 'Hooks']],
      }).success,
    ).toBe(false)
  })
})
