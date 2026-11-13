import { loader } from 'fumadocs-core/source'
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema'
import { defineDocs } from 'fumadocs-mdx/macro'

const docs = defineDocs({
  dir: 'content',
  docs: { schema: pageSchema, lastModified: true },
  meta: { schema: metaSchema }
})

// The custom domain serves the documentation at the site root, keeping the
// /guide/... URLs published by the previous site.
export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource()
})
