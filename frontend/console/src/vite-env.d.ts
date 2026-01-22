/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv & {
    readonly PROD: boolean
    readonly DEV: boolean
    readonly MODE: string
  }
}
