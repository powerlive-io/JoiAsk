# 数据库、存储与安全配置

通过 `JOIASK_CONFIG=/path/to/config.json` 指定配置文件；未设置时读取当前工作目录下的 `./config/config.json`。

## 数据库配置

以下完整示例的 `security.session_secret` 留空，首次运行前必须用 `openssl rand -hex 32` 的输出填写；已有部署保留有效密钥。

### 使用 SQLite（推荐新手）

SQLite 是单文件数据库，无需额外安装数据库服务。这也是 SQLite + 本地存储的最小完整配置。

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

挂载数据目录：

```bash
-v $(pwd)/data:/work/db
```

### 使用 MySQL

```json
{
    "db_type": "mysql",
    "mysql": {
        "host": "192.168.1.100",
        "port": 3306,
        "user": "root",
        "pass": "your_password",
        "name": "jask"
    },
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

## Session 与 B 站验证安全配置

**所有部署（包括未启用 B 站验证的部署和本地开发）都必须配置 `security.session_secret`。** 使用下面的命令生成随机值，将输出的 64 个十六进制字符填入配置文件；不要直接使用示例中的空字符串，也不要将真实密钥提交到仓库：

```bash
openssl rand -hex 32
```

`session_secret` 去除首尾空白后必须至少 32 字节；校验通过后仍使用配置的原始字节签名，不会修改已有有效密钥。缺失、空字符串、纯空白，以及历史默认值 `WhyJoiIsSoCute`、旧示例值 `replace-with-a-long-random-secret`、旧开发值 `dev-only-session-secret-change-in-production`（包括这些值前后带空白的写法）都会被拒绝。后端会在初始化数据库之前报错退出，不会回退到任何默认密钥。

以下是安全配置片段，需合并到完整配置中。启用 B 站关注验证时，另行运行一次上述命令生成独立的 `bilibili_cookie_key`，不要与 Session 密钥共用：

```json
{
    "security": {
        "session_secret": "",
        "bilibili_cookie_key": "replace-with-an-independent-long-random-key",
        "secure_cookie": true
    }
}
```

- 将 Session 密钥保存在持久化的私有配置中，重启、重新构建和更新镜像时保持不变；同一部署的多个实例使用同一密钥。不要在每次启动时重新生成。
- 更换 Session 密钥会让所有用户（包括管理员）的现有登录会话失效，需要重新登录；尚未完成注册的用户也必须重新开始注册流程。仅更换此密钥不需要迁移业务数据；没有接受旧密钥的宽限期。
- HTTPS 部署应将 `secure_cookie` 设为 `true`；本地 HTTP 开发保持 `false`。
- `bilibili_cookie_key` 仅用于 B 站 Cookie 加密，与 Session 签名密钥相互独立。本次 Session 配置升级不要更换已有的 `bilibili_cookie_key`，以免影响已保存 Cookie 的解密。
- 未配置 `bilibili_cookie_key` 时，已有用户仍可登录，但不能配置验证账号或发起新注册验证。
- 可通过现有的 `JOIASK_CONFIG=/path/to/config.json` 指定配置文件；未设置时读取当前工作目录下的 `./config/config.json`。Session 密钥从该配置文件读取，没有单独的环境变量覆盖项。

## 图片存储配置

以下仅为存储配置片段，需合并到已配置 `security.session_secret` 的完整配置中。

上传文件的安全响应头、历史本地/OSS 文件排查及 CDN 配置要求见 [上传文件部署安全说明](./upload-serving-security.md)。本地 Caddy/Next 的防护不覆盖直接从 OSS/CDN 返回的文件。

### 本地存储（推荐）

图片存储在容器的 `/work/frontend/public/upload-img/` 目录。

```json
{
    "storage_type": "local"
}
```

挂载存储目录：

```bash
-v $(pwd)/uploads:/work/frontend/public/upload-img
```

### OSS 存储（阿里云）

使用阿里云 OSS 存储图片，适合大规模部署。

```json
{
    "storage_type": "oss",
    "oss": {
        "address": "https://your-domain.com",
        "endpoint": "oss-cn-beijing.aliyuncs.com",
        "access_key": "your_access_key",
        "secret_key": "your_secret_key",
        "bucket": "your-bucket-name"
    }
}
```

## 生产环境完整配置（MySQL + OSS）

此示例假定通过 HTTPS 访问，因此启用 `secure_cookie`。`security.session_secret` 故意留空，首次部署前运行 `openssl rand -hex 32` 并填入输出；已有部署保留其有效密钥。未填写时后端不会启动。

```json
{
    "db_type": "mysql",
    "mysql": {
        "host": "192.168.1.100",
        "port": 3306,
        "user": "joiask",
        "pass": "secure_password",
        "name": "joiask"
    },
    "server": {
        "host": "0.0.0.0",
        "port": 8080
    },
    "security": {
        "session_secret": "",
        "secure_cookie": true
    },
    "storage_type": "oss",
    "oss": {
        "address": "https://cdn.example.com",
        "endpoint": "oss-cn-beijing.aliyuncs.com",
        "access_key": "your_access_key",
        "secret_key": "your_secret_key",
        "bucket": "joiask-images"
    }
}
```
