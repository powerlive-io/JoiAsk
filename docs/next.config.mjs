import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  // GitHub Pages only serves files; every route is pre-rendered into out/.
  output: 'export',
  // The image optimizer needs a server; MDX images are served as-is.
  images: { unoptimized: true },
  reactStrictMode: true,
  // docs/ is nested in the application repository, which has its own lockfiles.
  turbopack: { root: import.meta.dirname }
}

export default withMDX(config)
