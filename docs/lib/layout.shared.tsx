import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { repositoryURL, siteName } from './shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <img src="/favicon.png" alt="" width={24} height={24} className="rounded" />
          <span>{siteName}</span>
        </>
      )
    },
    links: [{ text: 'PowerLive', url: 'https://powerlive.io/', external: true }],
    githubUrl: repositoryURL
  }
}
