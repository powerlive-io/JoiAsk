'use client'
import SearchDialog from '@/components/search'
import { RootProvider } from 'fumadocs-ui/provider/next'
import type { ReactNode } from 'react'

const translations = {
  'Search(search trigger)': '搜索文档',
  'Open Search(search trigger)(aria-label)': '搜索文档',
  'Search(search dialog)': '搜索文档',
  'Close Search(search dialog)(aria-label)': '关闭搜索',
  'No results found(search dialog)': '没有找到相关内容',
  'Search failed(search dialog)': '搜索失败',
  'Search failed, showing results for {query}(search dialog)': '搜索失败，显示 {query} 的结果',
  'On this page(table of contents)': '本页目录',
  'No Headings(table of contents)': '本页没有标题',
  'Table of Contents(inline table of contents)': '本页目录',
  'Previous Page(pagination)': '上一篇',
  'Next Page(pagination)': '下一篇',
  'Last updated on(page footer)': '最后更新',
  'Edit on GitHub(edit page)': '在 GitHub 上编辑此页',
  'Open Sidebar(aria-label)': '打开文档导航',
  'Open Sidebar(sidebar)(aria-label)': '打开文档导航',
  'Close Sidebar(aria-label)': '关闭文档导航',
  'Close Sidebar(sidebar)(aria-label)': '关闭文档导航',
  'Collapse Sidebar(sidebar)(aria-label)': '收起文档导航',
  'Show Sidebar(sidebar)': '显示文档导航',
  'Hide Sidebar(sidebar)': '隐藏文档导航',
  'Skip to Content(skip link)': '跳转到内容',
  'Copy Text(code block)(aria-label)': '复制代码',
  'Copied Text(code block)(aria-label)': '已复制',
  'Copy Anchor Link(heading anchor)(aria-label)': '复制标题链接',
  'Copied Anchor Link(heading anchor)(aria-label)': '已复制标题链接',
  'Page Not Found(404 not found page)': '页面不存在',
  'Back to Home(404 not found page)': '返回首页',
  'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 not found page)':
    '你访问的页面可能已被移除、更名或暂时不可用。'
}

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      i18n={{ locale: 'zh-CN', translations }}
    >
      {children}
    </RootProvider>
  )
}
