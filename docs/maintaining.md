# 文档站维护

文档使用 VitePress，从 `docs/` 构建为纯静态网站，托管在 GitHub Pages，地址为 `https://ask.powerlive.io/`。这只是项目文档站，不运行 JoiAsk 后端，也不存储用户提问。

## 本地开发

需要 Node.js 22 或更新版本。在仓库根目录执行：

```bash
npm --prefix docs ci
npm --prefix docs run dev
```

构建、检查生成页面，再预览生产产物：

```bash
npm --prefix docs run build
npm --prefix docs run test
npm --prefix docs run preview
```

VitePress 构建会拒绝失效的 Markdown 内部页面链接；额外测试检查生成页面中的内部链接、锚点和静态资源，以及自定义域名文件。正文直接维护 Markdown，导航在 `.vitepress/config.mts` 中配置。首页组件和品牌样式位于 `.vitepress/theme/`，构建产物和依赖不提交到 Git。

VitePress 1.6 的默认依赖仍使用有已知开发服务器漏洞的 Vite 5，因此通过 `overrides` 固定到已修复的 Vite 6.4.6。升级 VitePress 时重新检查这个覆盖项，并运行构建、链接测试和浏览器预览。开发服务器只供本地使用，不应公开到互联网。

## GitHub Pages

仓库：`powerlive-io/JoiAsk`。

- 在仓库 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**。
- 自定义域名设置为 `ask.powerlive.io`。
- `.github/workflows/docs.yml` 在文档 PR 中构建并测试，不部署 PR 内容。
- 文档变更合入 `main` 后自动构建，并通过官方 Pages artifact / deploy actions 发布。也可在 `main` 上手动运行 Documentation 工作流。
- 部署任务使用 `github-pages` environment，以及最小的 `pages: write` / `id-token: write` 权限，不需要额外部署密钥。
- `docs/public/CNAME` 会复制到构建根目录；Actions 部署时，仓库 Pages 设置仍是域名绑定的来源，不能只依赖 CNAME 文件。

## Cloudflare DNS 与 HTTPS

`powerlive.io` 区域中的 DNS 记录：

| 类型 | 名称 | 目标 | 代理状态 |
| --- | --- | --- | --- |
| CNAME | `ask` | `powerlive-io.github.io` | DNS only |

目标是组织的 GitHub Pages 主机名，不带协议、仓库路径或尾部斜杠。保留 DNS only，让 GitHub 验证域名并签发 HTTPS 证书，不依赖 Cloudflare 代理 TLS。

首次配置时先在 GitHub Pages 中绑定域名，再创建 DNS 记录，避免未绑定的悬空记录。证书签发完成后，在 GitHub Pages 中打开 **Enforce HTTPS**。DNS 与证书签发可能不会立即完成，可在 Pages 设置中查看进度。

建议组织管理员在 GitHub 的组织设置中完成域名所有权验证；按 GitHub 提供的值添加对应 TXT 记录，不自行编造验证值。

如果停用该文档站，应先删除 Cloudflare 中的 `ask` 记录，再解除 Pages 域名或删除站点，避免域名接管风险。迁移域名时同步更新 Pages 设置、DNS、`public/CNAME`、`public/robots.txt` 与 `.vitepress/config.mts` 的 sitemap 主机名。

## 视觉与内容约定

沿用 [PowerLive](https://powerlive.io/) 的纸色背景、墨黑文字、橙红强调色、直角边框和 Inter / Outfit 字体；文档内页以阅读和检索为主。字体加载失败时回退到系统字体。

README 只保留项目介绍、文档入口和开发入口。部署、安全和运维细节集中在 `guide/`，避免维护多份互相偏离的说明。安全前提应留在相关命令附近，不要为了缩短页面删除停服、密钥或持久化提示。
