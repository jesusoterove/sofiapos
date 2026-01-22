/**
 * Types for application updates.
 */
export type Platform = 'win32' | 'darwin' | 'linux'

export interface ApplicationVersion {
  id: number
  version: string
  platform: Platform
  release_date: string
  is_mandatory: boolean
  release_notes?: string
  download_url: string
  file_size?: number
  checksum?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

