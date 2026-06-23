import type { BookmarkManagerPort, BrowserBookmarkTreeNode } from '../ports'

function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase()
}

function findChildFolder(parent: BrowserBookmarkTreeNode, title: string): BrowserBookmarkTreeNode | undefined {
  const normalizedTitle = normalizeTitle(title)
  return (parent.children ?? []).find(
    (child) => !child.url && normalizeTitle(child.title) === normalizedTitle,
  )
}

export async function resolveTargetParentId(
  bookmarkManager: BookmarkManagerPort,
  targetPath: string[],
): Promise<string> {
  const [rootTitle, ...childTitles] = targetPath.map((part) => part.trim()).filter(Boolean)
  if (!rootTitle) throw new Error('targetPath must include a root folder')

  const roots = await bookmarkManager.getTree()
  let current = roots.find((node) => !node.url && normalizeTitle(node.title) === normalizeTitle(rootTitle))
  if (!current) throw new Error(`target root not found: ${rootTitle}`)

  for (const title of childTitles) {
    const existing = findChildFolder(current, title)
    if (existing) {
      current = existing
      continue
    }

    current = await bookmarkManager.createFolder(current.id, title)
  }

  return current.id
}
