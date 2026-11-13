# 快速开始

推荐使用 Docker 部署 JoiAsk。容器包含前端、管理后台、后端与 Caddy，只需对外开放一个端口。

## 1. 准备配置文件

创建一个配置文件 `config.json`，最简单的配置示例（使用 SQLite）：

```json
{
    "db_type": "sqlite",
    "sqlite": "/work/db/jask.db",
    "server": {
        "host": "0.0.0.0",
        "port": 8080
    },
    "security": {
        "session_secret": ""
    },
    "storage_type": "local"
}
```

**启动前必须填写 `security.session_secret`**：运行以下命令，将输出填入上面的空字符串位置，并妥善保存配置，不要提交到仓库。该要求适用于所有部署，无论是否启用 B 站验证。

```bash
openssl rand -hex 32
```

已有部署请保留有效的密钥，不要每次启动都重新生成。详细要求和轮换影响见 [Session 与 B 站验证安全配置](./configuration.md#session-与-b-站验证安全配置)。

## 2. 启动容器

```bash
docker run -d --restart always \
    --name joiask \
    -p 80:80 \
    -v $(pwd)/config.json:/work/config/config.json \
    -v $(pwd)/data:/work/db \
    -v $(pwd)/uploads:/work/frontend/public/upload-img \
    ghcr.io/xinrea/joiask:latest
```

数据库与上传目录必须持久化挂载，避免数据随容器删除而丢失。配置文件须提前创建为普通文件，不要将空目录挂载到配置路径。

## 3. 创建管理员

**新安装没有默认管理员或默认密码。** 管理员 CLI 是离线运维命令：先停止所有连接此数据库的后端实例，再使用同版本镜像操作。在宿主机的 **Bash** 中执行以下命令，输入不会回显，也不会把密码放进命令参数、环境变量或 shell 历史。不要开启 `set -x`，不要用明文密码替换变量。`owner` 是自选用户名，可自行更换：

```bash
docker stop joiask
(
    set +x
    unset joiask_password
    IFS= read -r -s -p 'New administrator password: ' joiask_password || exit 1
    printf '\n' >&2
    builtin printf '%s\n' "$joiask_password" |
        docker run --rm -i --workdir /work --entrypoint /work/jask \
            -v "$(pwd)/config.json:/work/config/config.json:ro" \
            -v "$(pwd)/data:/work/db" \
            ghcr.io/xinrea/joiask:latest admin create owner
)
# 确认上面的命令成功后：
docker start joiask
```

`docker run` 使用 `-i` 传递标准输入，**不要加 `-t`**。镜像中的后端二进制是 `/work/jask`，上述命令复用同一配置和持久化数据库挂载，绕过 `start-joiask`，不会启动前端、Caddy 或 HTTP 服务。

## 4. 访问服务

容器只暴露一个端口（80），内部 Caddy 自动处理路由：

- 前端提问箱：`http://localhost/`
- 管理后台：`http://localhost/admin`
- 后端 API：`http://localhost/api/`

用上一步创建的超级管理员账号登录后台。角色分为超级管理员（`super_admin`）和管理员（`admin`）：两者拥有相同的业务和站点配置权限，只有超级管理员可以管理后台管理员账号及角色。用户名本身不代表权限。

公网部署请继续阅读 [HTTPS 反向代理](./deployment.md#使用-nginx-反向代理-https) 与 [安全配置](./configuration.md#session-与-b-站验证安全配置)。

## 接下来

- [管理员与密码恢复](./administrators.md)：账号角色、会话撤销与离线恢复。
- [配置参考](./configuration.md)：MySQL、OSS 和生产环境配置。
- [部署与更新](./deployment.md)：Docker Compose、源码构建与版本升级。
- [投稿与邮箱](./usage.md)：格式标签、SMTP 和用户密码找回。
