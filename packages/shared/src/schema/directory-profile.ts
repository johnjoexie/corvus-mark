import { z } from 'zod'

export const directoryPathSchema = z.array(z.string().min(1).max(40)).min(1)

export const directoryProfileSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    id: z.string().min(1),
    name: z.string().min(1),
    locale: z.string().min(1),
    allowedRoots: z.array(z.string().min(1)).min(1),
    seedPaths: z.array(directoryPathSchema),
    maxDepth: z.number().int().positive(),
    maxNewFolders: z.number().int().nonnegative(),
    folderNameMaxLength: z.number().int().positive(),
    autoSelectConfidenceThreshold: z.number().min(0).max(1),
    newFolderConfidenceThreshold: z.number().min(0).max(1),
  })
  .refine((profile) => profile.seedPaths.every((path) => path.length <= profile.maxDepth), {
    message: 'seedPaths must not exceed maxDepth',
    path: ['seedPaths'],
  })

export type DirectoryPath = z.infer<typeof directoryPathSchema>
export type DirectoryProfile = z.infer<typeof directoryProfileSchema>
