import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const dist = fileURLToPath(new URL('../out/', import.meta.url))

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(entry => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? filesIn(target) : [target]
  }))
  return files.flat()
}

const files = await filesIn(dist)
const pages = files.filter(file => file.endsWith('.html'))
const html = new Map(await Promise.all(pages.map(async file => [file, await readFile(file, 'utf8')])))

test('build includes every documentation page and the docs home page', () => {
  const expected = [
    'index', '404', 'development',
    'guide/quick-start', 'guide/administrators', 'guide/configuration',
    'guide/deployment', 'guide/usage', 'guide/custom-css',
    'guide/upload-serving-security', 'guide/troubleshooting'
  ]
  for (const page of expected) {
    assert.ok(html.has(path.join(dist, `${page}.html`)), `Missing ${page}`)
  }
  assert.match(html.get(path.join(dist, 'index.html')), /JoiAsk 文档/)
  assert.match(html.get(path.join(dist, 'guide/quick-start.html')), /新安装没有默认管理员或默认密码/)
})

test('generated internal links, fragments and resources resolve', async () => {
  let checked = 0
  for (const [file, source] of html) {
    const pageURL = new URL(path.relative(dist, file), 'https://ask.powerlive.io/')
    // Inspect emitted markup, not source MDX: this also covers home page links and navigation.
    for (const match of source.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const value = match[1].replaceAll('&amp;', '&')
      const url = new URL(value, pageURL)
      if (url.origin !== pageURL.origin) continue
      const pathname = decodeURIComponent(url.pathname)
      let target = path.join(dist, pathname)
      if (pathname.endsWith('/')) target = path.join(target, 'index.html')
      else if (!path.extname(pathname)) target += '.html'
      assert.ok(files.includes(target), `${path.relative(dist, file)}: missing ${value}`)
      assert.ok((await stat(target)).isFile())
      if (url.hash && html.has(target)) {
        const ids = [...html.get(target).matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
        assert.ok(ids.includes(decodeURIComponent(url.hash.slice(1))), `${path.relative(dist, file)}: missing anchor ${value}`)
      }
      checked++
    }
  }
  assert.ok(checked > 100, 'Expected to validate links across the full site')
})

test('custom domain, crawler configuration and sitemap agree', async () => {
  assert.equal((await readFile(path.join(dist, 'CNAME'), 'utf8')).trim(), 'ask.powerlive.io')
  assert.match(await readFile(path.join(dist, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/ask\.powerlive\.io\/sitemap\.xml/)
  const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8')
  assert.match(sitemap, /https:\/\/ask\.powerlive\.io\/guide\/quick-start</)
  assert.doesNotMatch(sitemap, /github\.io|localhost/)
})

test('literal legacy markup is preserved rather than interpreted as an MDX expression', () => {
  assert.match(html.get(path.join(dist, 'guide/usage.html')), /\{\{隐藏内容\}\}/)
})

test('static search index is exported with the Chinese page content', async () => {
  const index = await readFile(path.join(dist, 'api/search'), 'utf8')
  assert.doesNotThrow(() => JSON.parse(index))
  assert.match(index, /新安装没有默认管理员/)
})
