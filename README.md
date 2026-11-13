<p align="center">
  <img src="docs/public/favicon.png" alt="JoiAsk logo" width="128" height="128" />
</p>

<h1 align="center">JoiAsk 提问箱</h1>

<p align="center">
  可自行部署的开源提问箱，方便收集和展示观众提问。<br />
  支持话题分类、图文投稿、内容审核与卡片归档。
</p>

<p align="center">
  <a href="https://ask.powerlive.io/">使用文档</a> ·
  <a href="https://ask.vjoi.cn/">在线示例</a>
</p>

> [!IMPORTANT]
> **JoiAsk 属于 PowerLive 项目组。**
>
> 欢迎访问 **[PowerLive 官网 →](https://powerlive.io/)**，了解更多项目。

## 界面预览

<p align="center">
  <img src="docs/public/screenshot.png" alt="JoiAsk 提问箱界面预览" width="960" />
</p>

## 快速开始

推荐使用 Docker 部署，镜像为 `ghcr.io/powerlive-io/joiask:latest`。按 **[快速开始指南](docs/content/guide/quick-start.mdx)** 完成以下步骤：

1. 准备 `config.json`，生成并填写独立的 `security.session_secret`。
2. 挂载配置、数据库和上传目录，启动容器。
3. 停止后端后，通过离线 CLI 创建超级管理员，再恢复服务。
4. 访问提问箱 `/` 和管理后台 `/admin`。

> **新安装没有默认管理员或默认密码。** Session 密钥为必填项；已有部署应保留有效密钥。

完整部署命令和安全注意事项见快速开始指南。

## 文档导航

| 需要做什么 | 文档 |
| --- | --- |
| 首次部署 | [快速开始](docs/content/guide/quick-start.mdx) |
| 配置数据库、图片存储和安全选项 | [配置参考](docs/content/guide/configuration.mdx) |
| 管理账号、重置管理员密码 | [管理员与密码恢复](docs/content/guide/administrators.mdx) |
| 使用 Compose、配置 HTTPS 或更新镜像 | [部署与更新](docs/content/guide/deployment.mdx) |
| 使用格式标签、邮箱绑定和密码找回 | [投稿与邮箱](docs/content/guide/usage.mdx) |
| 自定义前台外观 | [自定义 CSS](docs/content/guide/custom-css.mdx) |
| 了解上传文件的安全配置 | [上传文件安全](docs/content/guide/upload-serving-security.mdx) |
| 排查运行问题 | [故障排查](docs/content/guide/troubleshooting.mdx) |

## 参与开发

- [开发环境与贡献指南](CONTRIBUTING.md)
- [开发指南](docs/content/development.mdx)
- [提交问题或建议](https://github.com/powerlive-io/JoiAsk/issues)

## 许可证

[MIT](LICENSE)
