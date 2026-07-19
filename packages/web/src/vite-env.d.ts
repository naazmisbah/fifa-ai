/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Matchday API. Unset in the static demo — the app then answers from @matchday/core locally. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
