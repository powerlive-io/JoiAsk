import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
  PageLastUpdate
} from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMDXComponents } from '@/components/mdx'
import { repositoryURL } from '@/lib/shared'
import { source } from '@/lib/source'

interface Props {
  params: Promise<{ slug?: string[] }>
}

export default async function Page({ params }: Props) {
  const page = source.getPage((await params).slug)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        {/* Relative .mdx links resolve to page URLs; tests/site.test.mjs catches any that do not. */}
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
      <div className="flex flex-row flex-wrap items-center justify-between gap-4 border-t pt-6">
        <EditOnGitHub href={`${repositoryURL}/edit/main/docs/content/${page.path}`} />
        {page.data.lastModified && <PageLastUpdate date={page.data.lastModified} />}
      </div>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = source.getPage((await params).slug)
  if (!page) notFound()

  return { title: page.data.title, description: page.data.description }
}
