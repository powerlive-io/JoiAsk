import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-sm font-medium text-fd-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">页面不存在</h1>
      <p className="text-fd-muted-foreground">你访问的页面可能已被移除或更名。</p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground hover:opacity-90"
      >
        返回文档首页
      </Link>
    </main>
  )
}
