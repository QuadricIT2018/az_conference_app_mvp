/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EVENT_SLUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
