# Analysis: Why selected language is overwritten to English after app reopen

## Observed behavior
1. User selects Spanish during registration → `i18nextLng` is set to `'es'` and language works.
2. User closes the app and reopens it.
3. Language appears in English and `i18nextLng` is now `'en'`.

## Root cause

### 1. Init order and `lng` option
- **main.tsx** imports `'./i18n'` before rendering, so **i18n.init()** runs at app startup.
- **i18n/index.ts** calls `i18n.init({ lng: defaultLanguage, ... })`. In production, `defaultLanguage` is `'en'`.
- So at init time the **initial language is explicitly set to `'en'`**.

### 2. LanguageDetector and cache
- **LanguageDetector** is used with `detection.order: ['localStorage', 'navigator', 'htmlTag']` and `caches: ['localStorage']`.
- With `caches: ['localStorage']`, the detector **writes the current language** to `localStorage` (key `i18nextLng`) when it caches.
- When init runs with **`lng: 'en'`**, i18next sets the current language to `'en'` first. The detector then runs and, in many implementations, **caches this current language** (`'en'`) to `localStorage`, **overwriting** the existing `'es'` that the user had set in the previous session.
- So the overwrite happens during **i18n.init()** on the next app load: the `lng` option forces `'en'`, and the detector persists that to `localStorage`, replacing `'es'`.

### 3. Why registration progress doesn’t help (until we fix it)
- The selected language **is** stored in registration progress as `selectedLanguage` (e.g. `'es'`) when the user clicks Next on the Welcome step.
- That only affects **in-memory state** and **progress localStorage** (`pos_registration_progress`). It does **not** stop i18n.init() from running with `lng: 'en'` and the detector from caching `'en'` to `i18nextLng`.
- So on reopen, **i18n init + detector** run first and overwrite `i18nextLng` to `'en'` before any component can restore `selectedLanguage`.

## Summary
The value is overwritten because:
1. **i18n.init()** sets the initial language to **`'en'`** (production default).
2. **LanguageDetector** with **`caches: ['localStorage']`** then **writes that current language** (`'en'`) to `localStorage` (`i18nextLng`), overwriting the user’s previous choice (`'es'`).

## Fix (applied)
1. **Do not set `lng` in i18n.init()** when using the detector. Omit `lng` so the **detector is the only source** of the initial language. It will read `localStorage` first and keep `'es'`; when `localStorage` is empty, it will use navigator/htmlTag, and `fallbackLng: 'en'` still applies.
2. **Restore language from registration progress on load**: when the app mounts, if there is registration progress with `selectedLanguage`, call `i18n.changeLanguage(selectedLanguage)` so that during registration the chosen language is reapplied even if something else had changed it.
