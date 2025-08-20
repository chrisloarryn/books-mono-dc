<template>
  <span class="img-wrapper">
    <img
      v-img-fallback
      v-bind="$attrs"
      :src="src"
      :alt="alt"
      :loading="lazy ? 'lazy' : 'eager'"
      :class="['img-el', { 'is-loaded': loaded }]"
      :aria-busy="!loaded"
      @load="onLoad"
      @error="onError"
    />
    <span v-if="!loaded" class="img-loader" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <span class="loader-text">Cargando…</span>
    </span>
  </span>
</template>

<script setup lang="ts">
// Forward attributes like class, width, height to the <img>
defineOptions({ inheritAttrs: false });

interface Props {
  src: string;
  alt?: string;
  lazy?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'Imagen',
  lazy: true,
});

const loaded = ref(false);

watch(() => props.src, () => {
  loaded.value = false;
});

function onLoad() {
  loaded.value = true;
}

function onError() {
  // Keep loader shown; the v-img-fallback directive will set a fallback src,
  // which will trigger a second load event and hide the loader.
}
</script>

<style scoped>
.img-wrapper {
  position: relative;
  display: inline-block;
  line-height: 0; /* remove inline gap */
  overflow: hidden; /* ensure loader matches image corners */
  border-radius: 8px; /* matches .cover default */
}

.img-el {
  display: block;
  opacity: 0;
  transition: opacity 180ms ease-in;
}

.img-el.is-loaded {
  opacity: 1;
}

.img-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.35);
  background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255,255,255,0.35);
  border-top-color: #2a75f3; /* brand color for visibility */
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loader-text {
  font-size: 12px;
  opacity: 0.95;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
