/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/solid" />

interface ImportMetaEnv {
  readonly VITE_CMS_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
