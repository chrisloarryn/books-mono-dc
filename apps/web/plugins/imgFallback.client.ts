/**
 * Deprecated duplicate plugin kept for backward-compatibility.
 *
 * Use plugins/img-fallback.client.ts instead. This plugin intentionally does nothing
 * to avoid double-registration of the directive.
 */
export default defineNuxtPlugin(() => {
  if (process.dev) {
    console.warn('[deprecation] plugins/imgFallback.client.ts is deprecated. Use plugins/img-fallback.client.ts');
  }
});
