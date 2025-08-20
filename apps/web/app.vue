<template>
  <div>
    <header class="header">
      <div class="container header__inner">
        <NuxtLink class="brand" to="/">Book Reviews</NuxtLink>
        <NuxtLink class="library-button" to="/library">Mi biblioteca</NuxtLink>
      </div>
    </header>
    <main class="container main">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped lang="scss">
.header {
  position: sticky;
  top: 0;
  background: #121212;
  color: #fff;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  z-index: 10;
  .header__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    color: #fff;
    font-weight: 700;
    text-decoration: none;
  }
  .library-button {
    background: #2a75f3;
    color: #fff;
    padding: 8px 14px;
    border-radius: 6px;
    text-decoration: none;
  }
}
.container {
  width: min(960px, 92%);
  margin: 0 auto;
}
.main {
  padding: 24px 0 40px;
}
</style>
