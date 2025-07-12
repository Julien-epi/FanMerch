/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PINATA_JWT?: string
  // add more env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 