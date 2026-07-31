import {
  getThemeStore,
  getDevelopmentTheme,
  setDevelopmentTheme,
  removeDevelopmentTheme,
  useThemeStoreContext,
} from './src/cli/services/local-storage.js'

// `useThemeStoreContext` scopes `getThemeStore()` to a store for the duration of the
// callback, without touching your real persisted `themeStore` config on disk.
await useThemeStoreContext('demo-store.myshopify.com', async () => {
  console.log('Theme store (from context):', getThemeStore())

  console.log('Development theme before set:', getDevelopmentTheme() ?? '(not set)')

  setDevelopmentTheme('123456789')
  console.log('Development theme after set:', getDevelopmentTheme())

  removeDevelopmentTheme()
  console.log('Development theme after remove:', getDevelopmentTheme() ?? '(not set)')
})
