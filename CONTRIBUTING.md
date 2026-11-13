# 开发环境的配置

## 基础

- Golang
- NodeJS / NPM
- Caddy

## 使用 Docker Compose（推荐）

项目提供了包含 Caddy、前端、管理后台和后端的开发环境。先从仓库根目录复制开发模板到已忽略的私有配置文件，再运行 `openssl rand -hex 32`，将输出填入 `config/config.json` 的 `security.session_secret`（模板中故意留空）：

```bash
cp config/config_dev.json config/config.json
openssl rand -hex 32
# 编辑 config/config.json，将命令输出填入 security.session_secret
```

复制和生成步骤仅用于首次设置；已有 `config/config.json` 时直接检查并保留其中有效的密钥，不要覆盖现有配置。Compose 通过 `JOIASK_CONFIG=/app/config/config.json` 读取该私有文件（仓库挂载到 `/app`）；模板的 SQLite 路径 `/data/joiask.db` 位于持久化的 `backend-data` 卷中。

密钥至少 32 字节，不能使用历史默认值或示例占位值；开发环境也不会回退到默认密钥。不要将密钥提交到仓库，也不要每次启动重新生成。模板中的 `bilibili_cookie_key` 是仅供开发使用的独立测试值，不要用于生产或与 Session 密钥共用。然后启动：

```bash
docker compose -f docker-compose.dev.yml up --build
```

启动后访问：

- 前端：`http://localhost/`
- 管理后台：`http://localhost/admin/`
- 后端 API：`http://localhost/api/`

前端和管理后台使用 Next.js Fast Refresh，后端使用 Air 监听 Go 源文件并自动重新构建。源码目录以 bind mount 挂载，修改后无需重建镜像。默认监听宿主机的 80 端口；如果端口被占用，可运行：

```bash
DEV_PORT=8088 docker compose -f docker-compose.dev.yml up --build
```

此时通过 `http://localhost:8088/` 访问。依赖文件发生变化时，使用 `docker compose -f docker-compose.dev.yml up --build` 重新构建对应开发镜像。

### 首次创建管理员

开发环境也不再自动创建 `admin/admin`。首次使用前，需要通过服务端 CLI 显式创建超级管理员；已有账号按角色迁移规则保留。密码只通过标准输入传入，安全输入方法及恢复说明见 [管理员初始化与密码恢复](docs/content/guide/administrators.mdx)。

执行命令前先停止所有连接同一数据库的后端实例。宿主机使用 `go run cmd/cmd.go admin create <username>`；Compose 开发环境先运行 `docker compose -f docker-compose.dev.yml stop backend`，再将密码通过管道传给 `docker compose -f docker-compose.dev.yml run --rm --no-deps -T backend go run cmd/cmd.go admin create <username>`。后者复用开发环境的配置与数据库卷。成功后运行 `docker compose -f docker-compose.dev.yml start backend`。不要混用生产镜像的 `/work/jask` 路径和开发容器的 `/app` 源码路径。

## 开发与调试

要注意本项目前后端分离存放在不同的仓库中，在 clone 时注意加上 `--recurse-submodules`。

```
git clone --recurse-submodules git@github.com:Xinrea/JoiAsk.git
```

### 1. 启动后端

直接运行 Go 时，首次设置先在仓库根目录执行 `cp config/config_dev.json config/config.json`，运行 `openssl rand -hex 32`，并将输出写入 `config/config.json` 的 `security.session_secret`。已有私有配置时不要覆盖，也不要重新生成有效的密钥。模板的 `bilibili_cookie_key` 仅供开发使用，不能用于生产。开发模板里的 SQLite 路径 `/data/joiask.db` 适用于 Compose 容器，宿主机直跑时请在私有配置中改为可写的本地路径（例如 `./ask.db`）。默认配置路径相对于启动时的工作目录，为 `./config/config.json`；若从其他目录启动，可使用 `JOIASK_CONFIG=/path/to/config.json` 指定同一私有配置。请勿直接运行未填写密钥的模板；密钥验证失败时，后端在数据库初始化前退出。

```bash
go run cmd/cmd.go
```

### 2. 启动前端 dev

```
cd frontend && npm run dev
```

### 3. 启动管理后台 dev

```
cd admin && npm run dev -- --port 3001
```

### 4. 启动本地服务器

> [!NOTE]
> 由于未 Release 打包前，前后端完全独立，在本地需要进行一定的 Path Routing 设置才能够正常访问，因此推荐使用 Caddy 来启用一个本地服务器。

开发配置 `Caddyfile.dev` 已提供在项目根目录，只需 `caddy run --config Caddyfile.dev` 即可启动本地服务器。

之后浏览器访问本地 localhost 即能够正常预览页面。

## Playwright 浏览器测试

测试使用真实的前台、管理后台和 Go API，覆盖登录与注销、投稿校验与草稿、格式预览、搜索和话题过滤、审核公开与撤回、拦截箱操作以及话题增删改。

需要 Node.js 22+、Go（版本见 `go.mod`），以及支持 SQLite CGO 构建的 C 编译器。在仓库根目录运行：

```bash
npm ci
npm --prefix frontend ci
npm --prefix admin ci
npx playwright install chromium
npm run test:e2e
```

Linux 首次运行可用 `npx playwright install --with-deps chromium` 一并安装浏览器系统依赖。测试会自动构建 Go 后端，通过离线 CLI 创建测试管理员，启动两个 Next.js 开发服务器和同源代理；不需要手动启动服务、配置 Caddy 或准备 `config/config.json`。

每次运行在系统临时目录中创建独立 SQLite 数据库、随机 Session 密钥和上传目录，正常退出或中断时清理，不读取或修改开发数据库。测试管理员凭据只用于该临时环境。各用例使用独立浏览器会话，测试数据在用例结束后清理；由于涉及全站设置，默认单 worker 执行，不要用 `--workers` 并行运行。

默认占用 `127.0.0.1:14820`～`14823`，依次用于同源代理、Go API、前台和管理后台。端口冲突时可用 `E2E_PORT=15820 npm run test:e2e` 整体调整四个端口。测试不会复用已经运行的服务器；同一工作目录运行测试时，请先停止前台和后台的 `next dev`，避免争用 `.next` 构建目录。

```bash
npm run test:e2e:typecheck          # 检查测试代码类型
npm run test:e2e -- --grep '匿名投稿' # 只运行指定流程
npm run test:e2e:ui                 # Playwright 交互界面
npm run test:e2e:report             # 查看上次 HTML 报告
```

失败时会保留截图、视频和 trace，保存在已忽略的 `test-results/` 与 `playwright-report/` 中。PR Check 会执行 Chromium 测试并上传报告，CI 失败用例重试一次。本套测试不依赖 B 站、SMTP 或 AI 审核等外部服务，也不验证这些服务的真实集成；开启投稿验证要求时，仅验证匿名用户的登录引导。

## 文档站

文档源码位于 `docs/`（Fumadocs + Next.js 静态导出），使用独立的依赖和锁文件，不影响应用构建：

```bash
npm --prefix docs ci
npm --prefix docs run dev
npm --prefix docs run build
npm --prefix docs run test
```

提交文档前运行构建和测试。文档站结构与写作约定见 [开发指南](docs/content/development.mdx#文档站)。
