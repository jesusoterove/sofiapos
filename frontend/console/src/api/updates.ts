/**
 * Application updates API client.
 */
import apiClient from './client'
import type { Platform } from '@/types/updates'

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

export interface ApplicationVersionCreate {
  version: string
  platform: Platform
  release_date?: string
  is_mandatory?: boolean
  release_notes?: string
  download_url: string
  file_size?: number
  checksum?: string
  is_active?: boolean
}

export interface ApplicationVersionUpdate {
  version?: string
  platform?: Platform
  release_date?: string
  is_mandatory?: boolean
  release_notes?: string
  download_url?: string
  file_size?: number
  checksum?: string
  is_active?: boolean
}

export interface UpdateNotificationRequest {
  version_id: number
  notify_all?: boolean
  cash_register_ids?: number[]
}

/**
 * List all application versions.
 */
export async function listApplicationVersions(): Promise<ApplicationVersion[]> {
  const response = await apiClient.get<ApplicationVersion[]>('/api/v1/updates/admin/versions')
  return response.data
}

/**
 * Get a specific application version by ID.
 */
export async function getApplicationVersion(id: number): Promise<ApplicationVersion> {
  const response = await apiClient.get<ApplicationVersion>(`/api/v1/updates/admin/versions/${id}`)
  return response.data
}

/**
 * Create a new application version.
 */
export async function createApplicationVersion(data: ApplicationVersionCreate): Promise<ApplicationVersion> {
  const response = await apiClient.post<ApplicationVersion>('/api/v1/updates/admin/versions', data)
  return response.data
}

/**
 * Update an existing application version.
 */
export async function updateApplicationVersion(
  id: number,
  data: ApplicationVersionUpdate
): Promise<ApplicationVersion> {
  const response = await apiClient.put<ApplicationVersion>(`/api/v1/updates/admin/versions/${id}`, data)
  return response.data
}

/**
 * Send update notification to POS clients.
 */
export async function notifyUpdate(data: UpdateNotificationRequest): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>('/api/v1/updates/notify', data)
  return response.data
}

