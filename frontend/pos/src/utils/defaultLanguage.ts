/**
 * Apply default_language from settings (IndexedDB) when user has not set a preference.
 * Call on app load and after initial sync so both returning and first-time users get the server default.
 */
import { openDatabase } from '../db'
import i18n from '../i18n'

const VALID_LANGUAGES = ['en', 'es']

export async function applyDefaultLanguageFromStore(): Promise<void> {
  if (typeof window === 'undefined') return
  if (localStorage.getItem('i18nextLng')) return // User already has a language preference
  try {
    const db = await openDatabase()
    const record = await db.get('settings', 'default_language') as { key: string; value: string } | undefined
    const raw = record?.value
    const lang = typeof raw === 'string' ? raw.trim().toLowerCase() : null
    if (lang && VALID_LANGUAGES.includes(lang)) {
      i18n.changeLanguage(lang)
    }
  } catch {
    // Ignore: DB may not exist yet (before registration/sync)
  }
}
