# Changelog v1.4.0 — P0 Bugfix + P1 体验优化 + P2 代码质量

---

## P0 — Bugfix

### 1. ToD 题目去重 (`questions.ts`)
- `pickQuestion()` 新增 `usedSet` 参数，session 级去重
- 题库耗尽自动重置；`Math.random` → `crypto.randomInt`

### 2. ToD 多 session (`handler.ts`, `types.ts`)
- 同一群最多 3 局并行；所有 callback/timer 按 sessionId 隔离

### 3. 统一 shuffle (`utils.ts`)
- `Math.random` → `crypto.randomInt`

### 4. 删除死代码
- `votingEmojis.ts`、`undercover/rooms.ts` — 零引用

### 5. 修复 intro 时间不一致
- 发言 40s→30s、讨论 120s→90s，与代码常量对齐

---

## P1 — 体验优化

### 6. 投票进度实时反馈 (`engine.ts`, `handler.ts`)
- 投票面板实时 edit 显示 "📊 3/5 已投票"
- 提取 `buildVoteKeyboard()` / `buildVoteText()` 公共函数

### 7. 支持改票
- 玩家可点击不同目标改票，提示 "已改投 xxx"
- 新增 i18n 字段 `voteProgress`、`voteChanged`

### 8. 修复 intro — "Emoji投票" → "按钮投票"
- zh/en/ru 三语同步

### 9. 清理 i18n deprecated 字段
- 移除 15+ 个从未在代码中使用的字段（speakingOrder, votingEnded, countdown20s 等）

---

## P2 — 代码质量

### 10. 删除未使用的脚手架 (`core/`)
- 删除 `GameEngine.ts` — 从未被任何游戏继承使用的抽象基类
- 删除 `RoomRepository.ts` — 从未被实现的接口
- `BaseRoom` 类型内联到 `InMemoryRoomManager.ts`

### 11. InMemoryRoomManager 内存泄漏修复
- `endRoom()` 只设 `active=false`，从不清理数组 → 长期运行内存增长
- 新增 `compactChat()`：dead room 积累超过阈值时自动清理
- `createRoom()` 前自动触发 compaction

### 12. `getAllRoomsByChat` Redis pipeline 优化 (`redisRooms.ts`)
- 原实现：N 个 chat → N 次顺序 `HGETALL` await
- 现实现：pipeline 批量发送，单次 round-trip
- stale chat 清理改为 fire-and-forget `SREM`

### 13. 清除 `as any` 类型转换 (`index.ts`)
- `/start` handler 中的 `(ctx as any).startPayload` 改为纯文本解析

### 14. README 重写
- 旧 README 列出了 archived 中不存在的游戏（狼人杀、地堡等）
- 新 README 反映实际可用游戏、环境变量、项目结构

### 15. 版本号 bump
- `package.json` 版本 `1.3.2` → `1.4.0`

---

## 改动文件清单

```
Modified (14 files):
  src/utils.ts                            — crypto shuffle
  src/index.ts                            — 清除 as any
  src/games/core/InMemoryRoomManager.ts   — 内联 BaseRoom + compaction
  src/games/truthordare/types.ts          — 多 session + usedQuestions
  src/games/truthordare/handler.ts        — 重写，多 session 架构
  src/games/truthordare/questions.ts      — 去重 + crypto
  src/games/undercover/types.ts           — 新增 votingMessageId
  src/games/undercover/engine.ts          — 投票面板构建提取 + messageId
  src/games/undercover/handler.ts         — 投票 edit + 改票
  src/games/undercover/redisRooms.ts      — pipeline 优化
  src/i18n/types.ts                       — 清理 + 新字段
  src/i18n/zh.ts / en.ts / ru.ts          — 文案修复 + 新字段

  README.md                               — 重写
  package.json                            — 版本 bump

Deleted (4 files):
  src/games/core/GameEngine.ts            — 未使用的抽象基类
  src/games/core/RoomRepository.ts        — 未实现的接口
  src/games/votingEmojis.ts               — 零引用
  src/games/undercover/rooms.ts           — 已被 redisRooms.ts 替代
```

## 向后兼容性

- **旧 ToD callback 失效**：含 sessionId 的新 regex，旧按钮不匹配
- **Undercover 无破坏性变更**：votingMessageId 为空时跳过 edit
- 命令接口（/play, /start）不变
