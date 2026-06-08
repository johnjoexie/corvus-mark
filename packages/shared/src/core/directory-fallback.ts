import type { DirectoryPath } from '../schema/directory-profile'

export interface RulePack {
  schemaVersion: number
  id: string
  maxDepth: number
  maxNewFolders: number
  folderNameMaxLength: number
  autoSelectConfidenceThreshold: number
  newFolderConfidenceThreshold: number
  seedPaths: DirectoryPath[]
  hostRules: Record<string, DirectoryPath>
}

export interface FallbackInput {
  hostKey: string
  hostFrequency?: number
}

export interface FallbackClassification {
  targetPath: DirectoryPath
  confidence: number
  reason: string
}

export function buildDefaultRulePack(): RulePack {
  return {
    schemaVersion: 1,
    id: 'rule_default_v1',
    maxDepth: 3,
    maxNewFolders: 12,
    folderNameMaxLength: 40,
    autoSelectConfidenceThreshold: 0.75,
    newFolderConfidenceThreshold: 0.85,
    seedPaths: [
      ['Dev'],
      ['Dev', 'Frontend'],
      ['Dev', 'Backend'],
      ['Dev', 'DevOps'],
      ['Dev', 'AI/ML'],
      ['Dev', 'Languages'],
      ['Dev', 'Tools'],
      ['Reading'],
      ['Reading', 'Articles'],
      ['Reading', 'Docs'],
      ['Reading', 'Papers'],
      ['Media'],
      ['Media', 'Video'],
      ['Media', 'Music'],
      ['Media', 'Images'],
      ['Shopping'],
      ['News'],
      ['Social'],
      ['Finance'],
      ['Work'],
      ['Personal'],
      ['Reference'],
      ['Uncategorized'],
    ],
    hostRules: {
      'github.com': ['Dev'],
      'gitlab.com': ['Dev'],
      'stackoverflow.com': ['Dev'],
      'react.dev': ['Dev', 'Frontend'],
      'developer.mozilla.org': ['Dev', 'Frontend'],
      'arxiv.org': ['Reading', 'Papers'],
      'youtube.com': ['Media', 'Video'],
      'bilibili.com': ['Media', 'Video'],
      'medium.com': ['Reading', 'Articles'],
      'substack.com': ['Reading', 'Articles'],
      'taobao.com': ['Shopping'],
    },
  }
}

export function classifyByDefaultDirectory(
  input: FallbackInput,
  rulePack: RulePack,
): FallbackClassification {
  const host = input.hostKey.toLowerCase()
  const matchedPath =
    rulePack.hostRules[host] ??
    (host.endsWith('.gov') ? (['News'] satisfies DirectoryPath) : undefined)

  if (matchedPath) {
    return { targetPath: matchedPath, confidence: 0.9, reason: `matched host rule: ${host}` }
  }
  if ((input.hostFrequency ?? 0) >= 3) {
    return { targetPath: ['Reference'], confidence: 0.75, reason: 'repeated unmatched host' }
  }
  return { targetPath: ['Uncategorized'], confidence: 0.5, reason: 'no matching default rule' }
}
