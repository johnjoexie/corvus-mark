import type { BrowserBookmarkTreeNode } from '../ports'

export interface FlattenedBookmark {
  id: string
  parentId: string
  index?: number
  title: string
  url: string
  dateAdded?: number
  currentPath: string[]
}

export function flattenBookmarkTree(nodes: BrowserBookmarkTreeNode[]): FlattenedBookmark[] {
  const flattened: FlattenedBookmark[] = []

  function walk(node: BrowserBookmarkTreeNode, path: string[]): void {
    if (node.url) {
      if (!node.parentId) return
      flattened.push({
        id: node.id,
        parentId: node.parentId,
        index: node.index,
        title: node.title,
        url: node.url,
        dateAdded: node.dateAdded,
        currentPath: path,
      })
      return
    }

    const nextPath = node.title ? [...path, node.title] : path
    node.children?.forEach((child) => walk(child, nextPath))
  }

  nodes.forEach((node) => walk(node, []))
  return flattened
}
