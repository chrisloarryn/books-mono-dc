/**
 * Nuxt plugin registering v-img-fallback directive.
 *
 * - Accepts optional binding value as custom fallback URL/Data URI.
 * - Applies fallback when src is empty or load fails.
 * - Cleans up event listeners on unmount; prevents infinite loops.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const DEFAULT_FALLBACK = '/default-cover.svg';

  function apply(el: HTMLImageElement, fallback?: string) {
    const fallbackUrl = fallback || DEFAULT_FALLBACK;

    // If src is empty or blank, set fallback immediately
    const current = el.getAttribute('src');
    if (!current || current.trim() === '') {
      (el as any).__imgFallbackApplied = true;
      el.src = fallbackUrl;
    }

    const onError = () => {
      if ((el as any).__imgFallbackApplied) return;
      (el as any).__imgFallbackApplied = true;
      el.src = fallbackUrl;
    };

    el.addEventListener('error', onError);
    (el as any).__imgFallbackCleanup = () => el.removeEventListener('error', onError);
  }

  nuxtApp.vueApp.directive('img-fallback', {
    mounted(el: Element, binding: { value?: string }) {
      if (el instanceof HTMLImageElement) apply(el, binding?.value);
    },
    updated(el: Element, binding: { value?: string }) {
      if (el instanceof HTMLImageElement) apply(el, binding?.value);
    },
    unmounted(el: any) {
      if (el.__imgFallbackCleanup) el.__imgFallbackCleanup();
    },
  });
});
