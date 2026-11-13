import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'JoiAsk',
  description: '可自行部署的开源提问箱。收集观众提问，审核内容，留存值得回看的对话。',
  // The custom domain serves this project at /, not /JoiAsk/.
  base: '/',
  srcExclude: ['tests/**'],
  appearance: false,
  lastUpdated: true,
  sitemap: { hostname: 'https://ask.powerlive.io' },
  head: [
    ['link', { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600&display=swap' }]
  ],
  themeConfig: {
    logo: '/icon.svg',
    siteTitle: 'JoiAsk',
    nav: [
      { text: '使用文档', link: '/guide/quick-start', activeMatch: '/guide/' },
      { text: 'PowerLive', link: 'https://powerlive.io/' }
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/powerlive-io/JoiAsk' }],
    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '快速开始', link: '/guide/quick-start' },
          { text: '投稿与邮箱', link: '/guide/usage' },
          { text: '自定义外观', link: '/guide/custom-css' }
        ]
      },
      {
        text: '部署与维护',
        items: [
          { text: '数据库、存储与安全配置', link: '/guide/configuration' },
          { text: '管理员与密码恢复', link: '/guide/administrators' },
          { text: '部署与更新', link: '/guide/deployment' },
          { text: '上传文件安全', link: '/guide/upload-serving-security' },
          { text: '故障排查', link: '/guide/troubleshooting' }
        ]
      },
      {
        text: '参与项目',
        items: [
          { text: '开发指南', link: 'https://github.com/powerlive-io/JoiAsk/blob/main/CONTRIBUTING.md' },
          { text: '文档站维护', link: '/maintaining' }
        ]
      }
    ],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                noResultsText: '没有找到相关内容',
                resetButtonTitle: '清除搜索',
                displayDetails: '显示详细内容',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
              }
            }
          }
        }
      }
    },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新', formatOptions: { dateStyle: 'medium' } },
    editLink: {
      pattern: 'https://github.com/powerlive-io/JoiAsk/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    sidebarMenuLabel: '文档导航',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '切换主题',
    skipToContentLabel: '跳转到内容',
    footer: {
      message: 'JoiAsk · 开源提问箱 · <a href="https://powerlive.io/">PowerLive.io</a>',
      copyright: '使用 MIT 许可证发布'
    }
  }
})
