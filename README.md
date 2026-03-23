# PlayPlayGG — Telegram 群组游戏机器人

基于 Telegraf + TypeScript 的 Telegram 群组游戏 Bot。

## 当前可用玩法

| 玩法 | 人数 | 说明 |
|------|------|------|
| 🕵️ 谁是卧底 | 5–12 | 发词→轮流描述→自由讨论→投票淘汰 |
| 🎯 真心话大冒险 | 2–20 | 三档模式（破冰/进阶/激情），支持多局并行 |
| 🎭 匿名大字报 | 不限 | 私聊 Bot 写话→匿名贴到群里→颜色代替身份→10 分钟换色 |

## 快速开始

```bash
cp .env.example .env   # 填入 BOT_TOKEN
npm install
npm run dev            # 开发模式（Polling + 内存，无需 Redis）
```

群组内发送 `/play` 打开游戏菜单。

## 生产部署

```bash
# 设置环境变量
BOT_TOKEN=xxx
REDIS_URL=redis://localhost:6379
WEBHOOK_URL=https://your-domain.com
WEBHOOK_SECRET=your_random_secret

# Docker
docker build -t playplaygg .
docker run -e BOT_TOKEN -e REDIS_URL -e WEBHOOK_URL -e WEBHOOK_SECRET playplaygg
```

**注意**：匿名大字报的图片渲染需要字体文件，见 `assets/fonts/README.md`。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `BOT_TOKEN` | 是 | Telegram Bot Token |
| `REDIS_URL` | 否 | 配置后启用 Redis；不配则内存模式 |
| `WEBHOOK_URL` | 否 | 配置后启用 Webhook；不配则 Polling |
| `WEBHOOK_SECRET` | Webhook 模式必填 | Telegram webhook 验证密钥 |
| `PORT` | 否 | HTTP 端口，默认 3000 |

## 项目结构

```
src/
  index.ts                 — 入口、菜单、命令注册
  config.ts                — 环境变量
  state.ts                 — 全局状态（语言、计时器）
  i18n/                    — 三语文案（zh/en/ru）
  games/
    undercover/            — 谁是卧底（handler/engine/words/redisRooms）
    truthordare/           — 真心话大冒险（handler/questions）
    confess/               — 匿名大字报（handler/renderer/colors）
    core/                  — 通用房间管理
  state/                   — Redis 客户端、状态存储
tests/                     — vitest 单元测试
assets/fonts/              — 卡片渲染字体
src/data/                  — 卧底词库 JSON
```

## 开发

```bash
npm test              # 跑测试
npm run test:watch    # 测试监听模式
npm run build         # TypeScript 编译
```
# play
# play
