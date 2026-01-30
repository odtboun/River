/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VERIFIER_PROGRAM_ID: string;
  readonly VITE_SOLANA_RPC_URL: string;
  readonly VITE_QUICKNODE_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}
