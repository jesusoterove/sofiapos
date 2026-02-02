/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_UPDATE_SERVER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv & {
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
  }
}
