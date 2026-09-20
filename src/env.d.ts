/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, unknown>
  export default component
}

/** build id of this bundle, see vite.config.ts */
declare const __BUILD_ID__: string
