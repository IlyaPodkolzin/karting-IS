/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_YANDEX_MAP_API_KEY: string
  // Add any other env variables you use
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}