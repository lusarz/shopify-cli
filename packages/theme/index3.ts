import {mountThemeFileSystem} from './src/cli/utilities/theme-fs.js'

const themeRoot = '/home/lukasz/shopify-lab/themes/astera'

const themeFileSystem = mountThemeFileSystem(themeRoot)

// `ready()` resolves once the initial glob scan (assets, config, layout, locales,
// sections, blocks, snippets, templates) has finished populating `files`.
await themeFileSystem.ready()

console.log('Total files found:', themeFileSystem.files.size)

const countByDirectory = [...themeFileSystem.files.keys()].reduce<Record<string, number>>((counts, fileKey) => {
  const [directory] = fileKey.split('/')
  const directoryName = directory ?? '(root)'
  counts[directoryName] = (counts[directoryName] ?? 0) + 1
  return counts
}, {})
console.log('Files per directory:', countByDirectory)

const layoutFile = await themeFileSystem.read('layout/theme.liquid')
console.log('layout/theme.liquid (first 200 chars):', String(layoutFile).slice(0, 200))

// Write + delete cycle on a throwaway snippet, so nothing in the real theme is modified.
const demoFileKey = 'snippets/index3-demo.liquid'
await themeFileSystem.write({
  key: demoFileKey,
  checksum: '',
  value: '{% comment %} index3.ts demo file {% endcomment %}',
})
console.log('Demo file written, present in files map:', themeFileSystem.files.has(demoFileKey))

await themeFileSystem.delete(demoFileKey)
console.log('Demo file deleted, present in files map:', themeFileSystem.files.has(demoFileKey))
