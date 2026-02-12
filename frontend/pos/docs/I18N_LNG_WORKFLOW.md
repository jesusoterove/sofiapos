# i18nextLng key – application workflow

## Rule

**`i18nextLng` must only be written when the user explicitly chooses a language (e.g. during registration). On application start we only read it; nothing must overwrite it.**

- Once the user selects a language during registration, that value is stored and must not be overwritten on later app starts.
- The only way to change it afterward is an explicit user action (e.g. re-registering and choosing a different language).
- The app does not yet expose any other UI to change the language; registration is the only place that sets it.

---

## Application start (read-only)

1. **main.tsx**
   - Imports run in order. No code runs here that touches `i18nextLng` (no restore/write from progress on start).

2. **import './i18n'**
   - **i18n/index.ts** runs:
     - i18n is initialized **without** a fixed `lng` so the detector decides the initial language.
     - **LanguageDetector** is used with:
       - **order:** `['localStorage', 'navigator', 'htmlTag']` → read sources in that order.
       - **caches: []** → detector **never writes** to localStorage. So it only **reads** `i18nextLng` and never overwrites it on start.
     - Initial language = first value found: localStorage (`i18nextLng`) if set, else navigator, else htmlTag; otherwise fallback is `fallbackLng: 'en'`.
   - **Result:** On start we only **read** `i18nextLng`; nothing writes to it.

3. **App mounts**
   - No effect runs that calls `changeLanguage(...)` or writes `i18nextLng`. No “restore from progress” or similar that could overwrite the key.
   - **applyDefaultLanguageFromStore** runs only when `!localStorage.getItem('i18nextLng')`. It calls `i18n.changeLanguage(lang)` for the session only; with `caches: []` the detector does not write, so it does **not** set or overwrite `i18nextLng`.

---

## When the value is set (user action only)

1. **Registration – Welcome step**
   - User chooses a language (e.g. Spanish).
   - **WelcomeStep** calls **setPersistedLanguage(lang)** (from `@/i18n`), which:
     - Calls `localStorage.setItem('i18nextLng', lang)`.
     - Calls `i18n.changeLanguage(lang)`.
   - This is the **only** code path that writes to `i18nextLng`. Registration progress also stores `selectedLanguage` for in-session use; the canonical value for the next app start is `i18nextLng`.
   - **Result:** `i18nextLng` is written only when the user selects a language during registration (or re-registration).

2. **Re-registration**
   - If the user goes through registration again and picks a different language, the same helper runs and updates `i18nextLng`. That is the only intended way to change the key after the first registration.

3. **No other writers**
   - LanguageDetector has **caches: []**, so it never writes to `i18nextLng`.
   - No “restore from progress” or “apply default from server” logic runs on start in a way that overwrites an existing `i18nextLng`.

---

## Summary

| Phase              | Action on `i18nextLng` |
|--------------------|------------------------|
| App start          | **Read only** (i18n init via detector with `caches: []`). |
| User selects lang  | **Write** via single helper: `changeLanguage` + `localStorage.setItem('i18nextLng', lang)`. |
| Re-registration    | **Write** again only when user chooses a new language (same helper). |

So: **on start we only read; we write only when the user explicitly requests a language change (currently only during registration).**
