# 部署与更新

首次部署请先完成 [快速开始](./quick-start.md)，包括填写 Session 密钥和创建管理员。本页介绍可选部署方式、HTTPS 与升级流程。

## 从源码构建

在仓库根目录执行：

```bash
docker build -t joiask .
```

构建完成后运行：

```bash
docker run -d --restart always \
    --name joiask \
    -p 80:80 \
    -v $(pwd)/config.json:/work/config/config.json \
    -v $(pwd)/data:/work/db \
    -v $(pwd)/uploads:/work/frontend/public/upload-img \
    joiask
```

使用本地构建镜像进行管理员初始化时，也应将 CLI 示例中的镜像名换为 `joiask`，保持后端与 CLI 版本一致。

## Docker Compose（可选）

先按 [快速开始](./quick-start.md) 准备并填写 `config.json`（包括必填的 `security.session_secret`），再创建 `docker-compose.yml`：

```yaml
services:
  joiask:
    image: ghcr.io/xinrea/joiask:latest
    container_name: joiask
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./config.json:/work/config/config.json
      - ./data:/work/db
      - ./uploads:/work/frontend/public/upload-img
```

启动：

```bash
docker compose up -d
```

首次创建管理员仍需先停止后端，使用同版本镜像、同一配置与数据库挂载执行离线 CLI，见 [快速开始](./quick-start.md#_3-创建管理员)。

## 使用 Nginx 反向代理（HTTPS）

如果需要使用 HTTPS，可以在宿主机上配置 Nginx 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name ask.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

替换示例域名与证书路径，并在配置中将 `security.secure_cookie` 设为 `true`。上例沿用容器宿主机的 80 端口；如果 Nginx 也监听 80，应改用其他容器映射端口并同步修改 `proxy_pass`。只通过反向代理访问时，建议将容器端口绑定到 `127.0.0.1`。

## 更新容器

更新前备份数据库、配置文件与上传目录。

**先更新配置，再切换到新镜像。** 新版不会为缺失或无效的 Session 密钥提供默认值，直接升级会导致后端在数据库初始化前退出。容器启动脚本会随之停止前端和 Caddy；配合 `restart: always` / `--restart always` 会反复重启，整个站点将不可用，直到修正配置。

1. 检查当前实际挂载的 `config.json`。若 `security.session_secret` 缺失或无效，先运行 `openssl rand -hex 32`，将输出填入该字段并持久保存；已有有效密钥无需更换。不要修改已有的 `bilibili_cookie_key`。
2. 旧版本已支持配置 `security.session_secret`，可先重启旧版本使新密钥生效，再更新镜像。密钥切换时所有用户都需重新登录，未完成注册的用户需重新开始；没有旧密钥宽限期，也无需为此迁移业务数据。
3. 确认配置已就绪后，执行下列容器更新步骤。后续更新继续使用同一密钥，不要随镜像更新轮换。

管理员会话版本字段会在后端启动时自动迁移。升级到支持会话版本校验的版本时，不带版本字段的历史管理员 cookie 会失效，管理员需重新登录；无需更换 Session 密钥，普通用户会话不受此项变更影响。多实例部署应在恢复流量前完成所有实例升级，避免旧实例继续接受已撤销的会话。

角色首次迁移及历史账号权限处理见 [管理员与密码恢复](./administrators.md#初始化与升级)。升级时先停止所有后端实例，完成迁移后再恢复流量，不要混用新旧版本。

```bash
# 停止并删除旧容器
docker stop joiask && docker rm joiask

# 拉取最新镜像
docker pull ghcr.io/xinrea/joiask:latest

# 启动新容器
docker run -d --restart always \
    --name joiask \
    -p 80:80 \
    -v $(pwd)/config.json:/work/config/config.json \
    -v $(pwd)/data:/work/db \
    -v $(pwd)/uploads:/work/frontend/public/upload-img \
    ghcr.io/xinrea/joiask:latest
```

使用 Compose 管理的部署，请使用 `docker compose pull` 和 `docker compose up -d` 更新，不要再额外执行上述 `docker run` 创建同名容器。多实例部署仍须先停止全部旧后端。
