import type { BookmarkManagerPort, BrowserBookmarkTreeNode } from '@corvus-mark/shared'

interface BookmarkApiNode {
  id: string
  parentId?: string
  index?: number
  title: string
  url?: string
  dateAdded?: number
  children?: BookmarkApiNode[]
}

interface BookmarkApi {
  getTree(): Promise<BookmarkApiNode[]>
  create(input: { parentId: string; title: string }): Promise<BookmarkApiNode>
  move(id: string, target: { parentId: string }): Promise<BookmarkApiNode>
}

interface BrowserApi {
  bookmarks: BookmarkApi
}

function toPortNode(node: BookmarkApiNode): BrowserBookmarkTreeNode {
  return {
    id: node.id,
    parentId: node.parentId,
    index: node.index,
    title: node.title,
    url: node.url,
    dateAdded: node.dateAdded,
    children: node.children?.map(toPortNode),
  }
}

export class ChromiumBookmarkAdapter implements BookmarkManagerPort {
  constructor(private readonly browserApi: BrowserApi) {}

  async getTree(): Promise<BrowserBookmarkTreeNode[]> {
    return (await this.browserApi.bookmarks.getTree()).map(toPortNode)
  }

  async createFolder(parentId: string, title: string): Promise<BrowserBookmarkTreeNode> {
    return toPortNode(await this.browserApi.bookmarks.create({ parentId, title }))
  }

  async moveBookmark(id: string, target: { parentId: string }): Promise<BrowserBookmarkTreeNode> {
    return toPortNode(await this.browserApi.bookmarks.move(id, { parentId: target.parentId }))
  }
}
