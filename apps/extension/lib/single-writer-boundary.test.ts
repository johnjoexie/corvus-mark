import { describe, expect, it } from 'vitest'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const MUTATION_PATTERNS = [
  /\b(?:browser|chrome)\.bookmarks\.(?:create|move|remove|removeTree)\b/,
  /\bbookmarks\.(?:create|move|remove|removeTree)\b/,
]

const ALLOWED_MUTATION_FILES = new Set(['apps/extension/lib/chromium-bookmark-adapter.ts'])

describe('single-writer boundary', () => {
  it('keeps bookmark mutations routed through the background adapter boundary', async () => {
    const files = await listSourceFiles(join(process.cwd(), 'apps/extension'))
    const offenders: string[] = []

    for (const file of files) {
      const relativePath = relative(process.cwd(), file)
      if (ALLOWED_MUTATION_FILES.has(relativePath)) continue

      const source = await readFile(file, 'utf8')
      if (MUTATION_PATTERNS.some((pattern) => pattern.test(source))) {
        offenders.push(relativePath)
      }
    }

    expect(offenders).toEqual([])
  })
})

async function listSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name)
      if (entry.isDirectory()) return listSourceFiles(path)
      if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) return [path]
      return []
    }),
  )
  return nested.flat()
}
