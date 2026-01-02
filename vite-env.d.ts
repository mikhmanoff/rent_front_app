/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // добавь другие переменные если есть
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}