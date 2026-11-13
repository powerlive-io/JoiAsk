import type { MetadataRoute } from 'next'
import { siteURL } from '@/lib/shared'
import { source } from '@/lib/source'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map(page => ({
    url: `${siteURL}${page.url}`,
    lastModified: page.data.lastModified
  }))
}
