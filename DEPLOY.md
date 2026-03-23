# PlayPlayGG — Railway 一键部署指南

> 按顺序执行，每完成一步打 ✅

---

## 第一步：准备工作（约 10 分钟）

### 1.1 创建 Telegram Bot（如已有则跳过）
- [ ] 打开 Telegram，搜索 @BotFather
- [ ] 发送 `/newbot`
- [ ] 输入 Bot 显示名称和 username
- [ ] 复制 **BOT_TOKEN**（格式：`123456:ABC-DEF...`）
- [ ] 发送 `/setprivacy` → 选择你的 bot → 选 `Enable`（保持默认即可）

### 1.2 生成安全密钥
- [ ] 生成 **WEBHOOK_SECRET**（用于验证 Telegram 请求）：
  ```bash
  # Mac/Linux
  openssl rand -hex 32
  # 或 Python
  python3 -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

---

## 第二步：Railway 部署（约 10 分钟）

### 2.1 创建项目
- [ ] 访问 https://railway.app/ 登录
- [ ] New Project → Deploy from GitHub repo
- [ ] 连接 GitHub 账号，选择 PlayPlayGG 仓库
- [ ] Railway 会自动检测 `Dockerfile` 和 `railway.toml`

### 2.2 添加 Redis
- [ ] 在项目中 → New → Database → Redis
- [ ] 点击 Redis 实例 → Variables → 记住 `REDIS_URL`
  （可以用 Railway 变量引用：`${{Redis.REDIS_URL}}`）

### 2.3 配置环境变量
- [ ] 点击 backend 服务 → Variables → 逐个添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `BOT_TOKEN` | 从 BotFather 复制 | **必填** |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | **必填**，Railway 自动引用 |
| `WEBHOOK_URL` | `https://你的服务名.up.railway.app` | **必填**，见 2.5 |
| `WEBHOOK_SECRET` | 上面生成的随机串 | **必填** |
| `PORT` | Railway 自动设置，不用管 | 不用填 |

### 2.4 部署
- [ ] 设置完环境变量 → Railway 自动触发部署
- [ ] 等待 Build + Deploy 完成（约 2-3 分钟）
- [ ] 查看 Deployments 日志，确认看到：
  ```
  Redis connected
  Webhook started
  ```

### 2.5 获取域名并更新 WEBHOOK_URL
- [ ] 点击服务 → Settings → Networking → Generate Domain
- [ ] 复制域名（例如 `playplaygg-production.up.railway.app`）
- [ ] 回到 Variables，设置 `WEBHOOK_URL` 为 `https://你的域名`
- [ ] Railway 自动重新部署

---

## 第三步：验证（约 5 分钟）

### 3.1 健康检查
- [ ] 浏览器访问 `https://你的域名/health`
- [ ] 应返回：`{"status":"ok","redis":"connected"}`

### 3.2 版本检查
- [ ] 访问 `https://你的域名/health/version`
- [ ] 应返回版本号 `1.6.1`

### 3.3 功能测试
- [ ] 私聊 Bot 发 `/start` → 看到欢迎消息
- [ ] 把 Bot 拉进测试群
- [ ] 群里发 `/play` → 出现 4 个按钮（语言、卧底、真心话、匿名大字报）
- [ ] 点「🎭 匿名大字报」→ 看到介绍 → 点按钮跳私聊 → 打字 → 群里出现彩色卡片
- [ ] 点「🕵️ 谁是卧底」→ 确认游戏流程正常

---

## 环境变量速查表

| 变量 | 必填 | 从哪里获取 |
|------|------|-----------| 
| `BOT_TOKEN` | ✅ | Telegram @BotFather |
| `REDIS_URL` | ✅ | Railway Redis（`${{Redis.REDIS_URL}}`） |
| `WEBHOOK_URL` | ✅ | Railway 部署域名（`https://xxx.up.railway.app`） |
| `WEBHOOK_SECRET` | ✅ | 自己生成的随机串 |
| `PORT` | ❌ | Railway 自动设置 |

> **注意**：不配置 `REDIS_URL` 时 bot 会退化为内存模式（重启丢状态），不推荐生产使用。

---

## 出问题排查

| 现象 | 原因 | 解决 |
|------|------|------|
| 部署失败，Build error | npm 依赖安装失败 | 检查 Railway 日志中的 npm 报错 |
| Bot 不响应 | WEBHOOK_URL 没设或设错 | 检查是否以 `https://` 开头，无末尾 `/` |
| 启动后立刻退出 | WEBHOOK_SECRET 为空 | 确认已设置 WEBHOOK_SECRET |
| `/health` 返回 `redis: unreachable` | Redis 没配或连不上 | 检查 REDIS_URL 是否正确引用 |
| 匿名大字报只有文字没有图片 | Canvas 渲染失败 | 检查日志中的 font 注册信息 |
| 群里按钮没反应 | Bot 没有发消息权限 | 在群设置中确认 bot 有发送消息权限 |

---

## 更新部署

代码更新后，push 到 GitHub → Railway 自动重新部署。

如需回滚：Railway Dashboard → Deployments → 点击之前的部署 → Rollback。

---

## 预估成本

| 项目 | 费用 |
|------|------|
| Railway（Backend + Redis） | $5-10/月 |
| **总计** | **$5-10/月** |

> PlayPlayGG 不需要数据库和 AI，只需 Redis。成本远低于 Blink.World。

---

*PlayPlayGG v1.6.1 Railway 部署指南 · 2026-03-23*
