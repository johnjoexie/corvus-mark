import type { AiRequestEnvelope, AiResponseEnvelope } from '../schema/ai-envelope'

export interface BrowserBookmarkTreeNode {
  id: string
  parentId?: string
  index?: number
  title: string
  url?: string
  dateAdded?: number
  children?: BrowserBookmarkTreeNode[]
}

export interface BookmarkMoveTarget {
  parentId: string
}

export interface BookmarkManagerPort {
  getTree(): Promise<BrowserBookmarkTreeNode[]>
  createFolder(parentId: string, title: string): Promise<BrowserBookmarkTreeNode>
  moveBookmark(id: string, target: BookmarkMoveTarget): Promise<BrowserBookmarkTreeNode>
}

export interface LlmProviderPort {
  classifyBookmarks(envelope: AiRequestEnvelope): Promise<AiResponseEnvelope>
}

export interface SecretStorePort {
  getSecret(key: string): Promise<string | undefined>
  setSecret(key: string, value: string): Promise<void>
  deleteSecret(key: string): Promise<void>
}
