# Changelog v1.5.0 — 安全加固 + 类型安全 + 交互优化 + 测试框架

---

## P0 — 安全加固

### 1. Webhook Secret 强制检查 (`index.ts`)
- `WEBHOOK_SECRET` 为空时 `process.exit(1)` 拒绝启动
- 消除无 secret token 的 webhook 裸奔风险

### 2. `/health` Redis 连通性检测 (`index.ts`)
- `/health` 返回 JSON 结构体 `{ status, redis }`
- Redis 启用时执行 `ping()` 检测，不可达返回 503
- 支持 PaaS 健康检查 / 负载均衡器探活

### 3. `uc:active_chats` TTL 保护 (`redisRooms.ts`)
- Lua 创建房间脚本新增 ARGV[5] 传入 active_chats TTL (2h)
- polling 循环中续期 TTL，保持活跃 chat 集合存活
- 所有 chat 都 stale 时自动 `DEL` 清理空集合
- 彻底消除该 SET 永久驻留 Redis 的风险

---

## P1 — 类型安全 & i18n

### 4. i18n 可选字段 → 全部必填 (`i18n/types.ts`)
- 28 个 `?:` → `:` 必填
- 新增语言时编译器会强制要求补齐所有字段

### 5. 清除 i18n `??` 硬编码 fallback
- `engine.ts`：~15 处
- `handler.ts`：6 处
- `messages.ts`：6 处
- `index.ts`：1 处
- 所有用户可见文案现在 100% 来自 i18n 文件

### 6. 清理 ChatState 僵尸字段 (`state/types.ts`, `state.ts`)
- 删除从未使用的 `ChatGameType`、`ChatPhase` 类型
- 删除 `ChatState.currentGame`、`ChatState.phase` 字段
- `state/store.ts` 兼容新旧格式（`'data' || 'phase'` 检查）

### 7. `noImplicitAny: true` (`tsconfig.json`)
- 消除静默 `any` 推导，编译期捕获更多类型错误

---

## P1 — 交互优化

### 8. 投票超时动态化 (`types.ts`, `engine.ts`)
- 新增 `getVoteTimeout(aliveCount)` 函数
- 5–6 人：20s | 7–9 人：30s | 10–12 人：40s
- `startVoting` 和 `buildVoteText` 使用动态超时
- 投票面板显示实际超时秒数

---

## P2 — 代码质量

### 9. 日志消息统一英文 (`handler.ts`, `engine.ts`)
- 12 条中文 logger message → 英文关键词
- 便于生产环境 grep、告警、跨团队协作

### 10. Timer 管理收敛 — 新增 `timerKeys.ts`
- 集中管理所有 timer key / resolver key 的构造
- `timerKey(roomId, suffix)` 替代散落的字符串模板
- `resolverKey(chatId, roomId, phase)` 替代内联拼接
- `ALL_TIMER_SUFFIXES` / `ALL_RESOLVER_PHASES` 常量
- `phaseToTimerSuffix()` / `phaseToDeadlineType()` 映射
- 消除字符串 typo 导致 timer 泄漏的风险

### 11. 词库外置 JSON (`undercoverWords.ts`, `src/data/`)
- 317 个词对从 TypeScript 硬编码迁移到 JSON 文件
- `src/data/words_zh.json` (123 对)
- `src/data/words_en.json` (99 对)
- `src/data/words_ru.json` (95 对)
- 运营可直接编辑 JSON 文件增删词对，无需 TypeScript 知识
- `undercoverWords.ts` 从 405 行 → 27 行

### 12. 测试框架 (`vitest`, `tests/`)
- 新增 `vitest` 依赖 + `npm test` / `npm run test:watch` 脚本
- 7 个测试文件覆盖核心纯函数：
  - `winCondition.test.ts` — 平民胜/卧底胜/继续 的所有场景
  - `words.test.ts` — getSpyCount 边界、assignRolesAndWords 角色分配、suggestDifficulty
  - `shuffle.test.ts` — 不可变性、元素保持、实际打乱
  - `lruMap.test.ts` — 容量限制、LRU 淘汰顺序、get 刷新、边界
  - `questions.test.ts` — 去重、题库耗尽重置、三语三档全覆盖
  - `timerKeys.test.ts` — key 格式、映射一致性
  - `voteTimeout.test.ts` — 动态超时边界

### 13. 版本号 bump
- `package.json` 版本 `1.4.0` → `1.5.0`

---

## 改动文件清单

```
Modified (15 files):
  src/index.ts                            — webhook secret + /health + import getRedis
  src/config.ts                           — (no change, for reference)
  src/state.ts                            — 删除 currentGame/phase + re-export 清理
  src/state/types.ts                      — 删除 ChatGameType/ChatPhase
  src/state/store.ts                      — 兼容新旧 ChatState 格式
  src/i18n/types.ts                       — 28 个 ?: → : 必填
  src/games/undercover/types.ts           — 新增 getVoteTimeout()
  src/games/undercover/engine.ts          — 动态投票超时 + timerKeys + 清除 ?? fallback + 英文日志
  src/games/undercover/handler.ts         — timerKeys + 清除 ?? fallback + 英文日志
  src/games/undercover/messages.ts        — 清除 ?? fallback
  src/games/undercover/redisRooms.ts      — uc:active_chats TTL
  src/games/undercoverWords.ts            — 从 405 行硬编码 → JSON import
  tsconfig.json                           — noImplicitAny: true
  package.json                            — 版本 1.5.0 + vitest + test scripts

New (10 files):
  src/games/undercover/timerKeys.ts       — 集中 timer/resolver key 管理
  src/data/words_zh.json                  — 中文词库 (123 对)
  src/data/words_en.json                  — 英文词库 (99 对)
  src/data/words_ru.json                  — 俄文词库 (95 对)
  vitest.config.ts                        — 测试配置
  tests/winCondition.test.ts              — 胜负判定测试
  tests/words.test.ts                     — 角色分配/难度测试
  tests/shuffle.test.ts                   — 洗牌测试
  tests/lruMap.test.ts                    — LRU 缓存测试
  tests/questions.test.ts                 — ToD 题目去重测试
  tests/timerKeys.test.ts                 — timer key 格式测试
  tests/voteTimeout.test.ts              — 动态投票超时测试
  CHANGELOG_v1.5.0.md                     — 本文件
```

## 向后兼容性

- **Redis ChatState**：`state/store.ts` 兼容旧格式（有 `phase` 字段）和新格式（只有 `data`），无需迁移
- **Redis 房间数据**：无破坏性变更
- **命令接口**：/play, /start 不变
- **i18n**：三语文件已全部实现所有必填字段，无缺失
- **`uc:active_chats` TTL**：已有的 SET 会在下次 polling 循环时被设上 TTL
