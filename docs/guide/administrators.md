# 管理员与密码恢复

## 角色与会话

角色分为超级管理员（`super_admin`）和管理员（`admin`）：两者拥有相同的业务和站点配置权限，只有超级管理员可以管理后台管理员账号及角色。用户名本身不代表权限。

修改管理员密码或角色后，该账号所有已签发的登录会话（包括当前会话）都会失效，需要重新登录；只修改用户名、将密码留空或保持原角色不会撤销会话。删除管理员后，其旧会话也不能再获取管理员权限。所有管理员都能通过「个人资料」修改自己的用户名和密码，但普通管理员不能修改角色。不能删除当前登录账号，也不能删除或降级最后一个超级管理员。

## 初始化与升级

普通启动会迁移表结构、角色和站点初始数据，但不会创建任何管理员。已有账号（无论是否叫 `admin`）及其密码保持不变；改名、删除账号或删除全部账号后，重启不会补回默认账号。升级不会自动更换历史弱密码：如果旧部署仍在使用 `admin` / `admin`，请立即在后台或通过下述命令重置密码。

**角色首次迁移规则：** 对尚未设置角色的历史账号，用户名恰好为小写 `admin` 的账号迁移为超级管理员，其他账号迁移为普通管理员。每个账号只迁移一次；后续改名或重启不会改变角色，已有 `role=admin` 的账号即使用户名为 `admin` 也不会自动升级。若没有该历史用户名，不会任选账号授予特权，需要运维显式执行 `promote` 或 `create`。升级时先停止所有后端实例，完成迁移后再恢复流量，不要混用新旧版本。

首次安装的完整流程见 [快速开始](./quick-start.md#_3-创建管理员)。

## 离线 CLI（仅服务端）

持有服务器/数据库访问权限的运维人员可使用同一个后端二进制。**执行任一 CLI 命令前，停止所有连接同一数据库的后端实例；命令完成后再启动服务。** CLI 会迁移管理员表结构，不支持在线运行：

```text
jask admin create <username>
jask admin reset-password <username>
jask admin promote <username>
```

- 密码只从标准输入读取到 EOF：一行非空密码，最多 4096 字节，可带末尾 LF/CRLF；其他空格原样保留。建议使用密码管理器生成独立的强密码。
- `create` 显式创建新的**超级管理员**，用户名已存在时报错，不覆盖原密码或角色。
- `reset-password` 仅修改已有账号，保留原角色，用户名不存在时报错；密码与会话版本在同一条数据库更新中修改，立即撤销该账号全部旧会话。
- `promote` 将已有账号显式提升为超级管理员，不读取或修改密码；角色变化时撤销其旧会话，重复提升已是超级管理员的账号不再修改会话版本。用户名不存在时报错。
- 命令失败以非零状态退出，不输出密码、密码散列或数据库错误中的 SQL；不会把管理员密码写入配置文件。
- 配置来源与服务一致：`JOIASK_CONFIG`，默认为当前工作目录的 `./config/config.json`。SQLite 相对路径也依赖当前工作目录，务必使用同一数据库，推荐绝对路径。命令只初始化管理员表，不启动服务；恢复命令不依赖 Session 密钥，但普通服务启动仍必须先通过 Session 密钥校验。
- 没有公开的管理员注册/恢复接口。恢复权限由服务器和数据库访问权限保护，请限制这些权限。

## 容器重置密码

先停止全部后端实例，重用 [快速开始中隐藏输入的 Bash 命令](./quick-start.md#_3-创建管理员)，只将镜像及子命令一行改为：

```bash
            ghcr.io/xinrea/joiask:latest admin reset-password owner
```

### 容器无法启动时恢复

确认全部后端实例已停止。在宿主机的 Bash 中使用同版本镜像、相同配置和持久化数据库挂载，绕过 `start-joiask` 启动脚本（不启动前端、Caddy 或 HTTP 服务）：

```bash
(
    set +x
    unset joiask_password
    IFS= read -r -s -p 'New administrator password: ' joiask_password || exit 1
    printf '\n' >&2
    builtin printf '%s\n' "$joiask_password" |
        docker run --rm -i --workdir /work --entrypoint /work/jask \
            -v "$(pwd)/config.json:/work/config/config.json:ro" \
            -v "$(pwd)/data:/work/db" \
            ghcr.io/xinrea/joiask:latest admin reset-password owner
)
```

请按实际部署替换镜像版本和挂载目录；如果数据库中没有任何管理员，将 `reset-password` 改为 `create`。不要另挂一个空数据目录来「恢复」，那只会创建另一套数据库。命令成功后再启动服务。

### 没有超级管理员时提升现有账号

停止全部后端实例后执行，无需输入密码；如果忘记该账号密码，再单独执行 `reset-password`：

```bash
docker run --rm --workdir /work --entrypoint /work/jask \
    -v "$(pwd)/config.json:/work/config/config.json:ro" \
    -v "$(pwd)/data:/work/db" \
    ghcr.io/xinrea/joiask:latest admin promote owner
```

## 本机构建与运行

`go build -o jask ./cmd/cmd.go`，停止全部后端实例后在 Bash 中安全输入密码：

```bash
(
    set +x
    unset joiask_password
    IFS= read -r -s -p 'New administrator password: ' joiask_password || exit 1
    printf '\n' >&2
    builtin printf '%s\n' "$joiask_password" |
        JOIASK_CONFIG=/absolute/path/to/config.json ./jask admin create owner
)
```

不要将密码直接写入命令、日志、配置、脚本或版本库。以上示例将密码仅保存在短生命周期子 shell 的非导出变量中。
