/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORAGE_MODE: 'inMemory' | 'classic';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
