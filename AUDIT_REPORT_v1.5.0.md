# PlayPlayGG v1.5.0 — 审查报告（对照审查清单 v3）

> 审查对象：playplaygg-v1.5.0 全量源码
> 审查标准：Telegram Bot + Mini App 审查清单 v3
> 审查范围：13 章全量过检，不适用章节标注 N/A

---

## 一、安全与密钥审查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| config 密钥默认值为空 | ✅ | `config.ts` 所有密钥 `?? ''` |
| 不硬编码 API endpoint IP | ✅ | 无硬编码 IP |
| .env 在 .gitignore | ✅ | 已确认 |
| .env.example 只有占位符 | 🟠 | **缺少 `WEBHOOK_SECRET`**。`.env.example` 只列了 `BOT_TOKEN`、`REDIS_URL`、`WEBHOOK_URL`、`PORT`，但 webhook 模式下 `WEBHOOK_SECRET` 是必填的（v1.5.0 为空会拒绝启动），必须加上 |
| ADMIN_SECRET 空=拒绝 | N/A | 无 admin 接口 |
| 前端代码无后端密钥 | N/A | 无前端 |
| console.log 不输出敏感信息 | ✅ | 无 `console.log`，logger 只记录 `BOT_TOKEN is missing` 这类非敏感文案 |
| 日志不记录完整 token | ✅ | logger context 只含 `chatId`、`roomId`、`userId`、`err` |
| SQL 参数化 | N/A | 无数据库，不写 SQL |
| Webhook 验证 secret_token | ✅ | v1.5.0 强制检查，空值 `process.exit(1)` |

### 🟠 发现 1 个 HIGH 问题

**`.env.example` 缺少 `WEBHOOK_SECRET` 字段**

新人部署时不知道要配这个，webhook 模式会直接拒绝启动但没有上下文指引。

**修复**：在 `.env.example` 加上：
```
# Webhook 模式必填（用于验证 Telegram 请求真实性）
# WEBHOOK_SECRET=your_random_secret_string
```

---

## 二、多语言一致性审查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 每个用户可见字符串走 i18n | ✅ | v1.5.0 已将所有 `??` 硬编码 fallback 清除，i18n 字段全部必填 |
| 同一概念用同一翻译源 | ✅ | 全部走 `getTexts(lang).xxx`，无组件各自定义 |
| i18n key 双向对账 | ✅ | `types.ts` 全必填 → TypeScript 编译器强制对账 |
| Bot 语言检测一致 | 🟡 | **fallback 语言不一致**：`state.ts` 默认 `'ru'`，`welcomePinned.ts` 默认 `'ru'`，`i18n/index.ts` fallback 也是 `'ru'`。三处一致但是**硬编码在各自文件里**，如果将来改默认语言需要改 3 个地方 |
| 新增语言 checklist | 🟡 | 无文档。虽然 TypeScript 类型会强制补字段，但 `resolveLangFromTelegram()` 的 `map` 需要手动加新语言映射，`LanguageCode` 类型也要手动加 union member |

### 🟡 发现 2 个 MEDIUM 问题

**fallback 语言 `'ru'` 散落在 3 个文件中**

`state.ts:25`、`welcomePinned.ts:35`、`index.ts:65/88/111/313/334`。建议提取到 `config.ts` 或 `i18n/index.ts` 作为 `DEFAULT_LANG` 常量。

**新增语言无 checklist 文档**

虽然 TypeScript 编译器能抓住 i18n 字段缺失，但还有这些手动步骤：
1. `state/types.ts` 的 `LanguageCode` union 加新成员
2. `welcomePinned.ts` 的 `resolveLangFromTelegram()` map 加映射
3. `i18n/index.ts` 的 `TEXTS` record 加新语言
4. `state.ts` 的 `ALLOWED_LANGS` 数组加新成员
5. `src/data/` 加新语言 JSON 词库
6. ToD `questions.ts` 加新语言题库

建议写个 `docs/ADD_NEW_LANGUAGE.md`。

---

## 三、Bot ↔ Mini App 联动审查

**N/A** — 无 Mini App，无支付流程，无 referral 系统。

---

## 四、API 健壮性审查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 函数定义完整性 | ✅ | 所有 import 已验证，无幻觉函数名 |
| 并发安全 — 投票 | ✅ | `castVote` 使用 Lua 脚本原子操作 |
| 并发安全 — 创建房间 | ✅ | `createRoom` 使用 Lua 脚本原子操作 |
| 并发安全 — roomQuota | ✅ | `tryAcquireRoom` / `releaseRoom` 使用 Lua 脚本 |
| 不在两个 await 间假设状态不变 | ✅ | 关键路径（投票、计票）都 re-read room |
| Redis key 有 TTL | 🟠 | **`uc:words:{lang}` 无 TTL** — 词库 hash 永久驻留 Redis |
| Redis key 命名规范 | ✅ | 统一 `{功能}:{标识}` 模式：`uc:rooms:`, `uc:words:`, `chat:state:`, `user:lang:`, `quota:chat:` |
| Pipeline 批量操作 | ✅ | `getAllRoomsByChat` 用 pipeline，`seedWordsToRedis` 用 pipeline |
| 副作用去重 | ✅ | `releaseRoom` 只在 `endGameCleanup` 中调用，无重复触发 |

### 🟠 发现 1 个 HIGH 问题

**`uc:words:{lang}` Redis Hash 无 TTL**

`wordStore.ts` 的 `seedWordsToRedis()`、`addWordPair()`、`disableWordPair()` 写入 `uc:words:{lang}` hash 后都没设 TTL。这个 key 会永久驻留 Redis。

词库数据本身是静态的（种子数据 + 运营增删），永久存在某种程度上合理，但违反了「所有 key 有 TTL」原则。如果 Redis 出问题需要重建，这些 key 无法自动恢复。

**建议**：给词库 hash 设一个长 TTL（如 30 天），`seedAllLanguages()` 在启动时会重新 seed，所以 TTL 过期后自动恢复。

```typescript
// wordStore.ts — seedWordsToRedis 末尾加
await redis.expire(key, 30 * 24 * 60 * 60); // 30 days
```

### 🟡 发现 1 个 MEDIUM 问题

**`roomQuota` 的 quota 值可能与实际不一致**

`tryAcquireRoom` INCR 后设 TTL 7 天，但 `releaseRoom` DECR 可能在 TTL 过期后执行（游戏结束晚于 quota key 过期），此时 DECR 会创建一个值为 -1 的新 key。不会导致功能错误（下次 tryAcquire 从 -1 开始 INCR 到 0 再到 1），但语义不干净。

**建议**：`releaseRoom` 的 Lua 脚本已经有 `if cur <= 0 then DEL` 的逻辑，这其实已经兜住了。标记为已知但低风险。

---

## 五、前端显示审查

**N/A** — 无前端 / Mini App。

---

## 六、算法 & 分数分布审查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 难度分布合理 | ✅ | `suggestDifficulty` 渐进式：easy → medium → hard |
| 词对质量 | ✅ | 三语词库覆盖 easy/medium/hard，有 blank word 变体 |
| 随机性设计 | ✅ | `crypto.randomInt` 无模偏差，50% 概率交换平民/卧底词 |
| 角色分配公平 | ✅ | Fisher-Yates shuffle + 前 N 个为 spy，数学上均匀 |

无问题。

---

## 七、AI Provider 切换审查

**N/A** — 无 AI 调用。

---

## 八、数据库迁移审查

**N/A** — 无数据库。

---

## 九、代码组织与模块边界审查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 单一职责 | ✅ | handler（路由）、engine（流程）、messages（格式化）、redisRooms（存储）、words（选词）、timerKeys（timer key 构造）各司其职 |
| 下划线函数不被外部 import | ✅ | grep 确认无跨模块 `_xxx` import |
| 副作用调用链唯一 | ✅ | `endGameCleanup` → `endRoom` + `releaseRoom`，只有一条链路 |
| 公有接口稳定 | ✅ | handler 只调 engine 的 exported 函数，不直接操作 room state |

### 🟡 发现 1 个 MEDIUM 问题

**`engine.ts` 仍然 re-export `shuffle`**

```typescript
// engine.ts line 138
export { shuffle } from '../../utils';
```

这是遗留的 backward compat，但没有任何文件从 `engine` import `shuffle`（都直接从 `utils` import）。建议删除这行，减少模块耦合。

---

## 十、Telegram Bot 特有问题审查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Webhook secret_token | ✅ | 已强制 |
| callback_data ≤ 64 字节 | ✅ | 最长 `tod_choose_-5285652205_999_truth_1234567890` = 43 字节，远低于限制 |
| webhook 响应 < 10s | ✅ | `runAfterCb` + `setImmediate` 模式确保 callback 立即返回，重活异步做 |
| 群聊并发控制 | 🟡 | **投票有原子 Lua，但"开始游戏"操作没有原子锁**。两人同时点「开始游戏」理论上可能创建两个房间。`roomQuota` 的 Lua 脚本在 Redis 模式下保证原子性（✅），但内存模式下无锁（单线程 Node.js 下安全，但值得标注） |

### 🟡 发现 1 个 MEDIUM 问题

**`start_undercover` 和 `start_tod` 的幂等性依赖 quota 检查**

当前流程：点击按钮 → `tryAcquireRoom` → `createRoom`。如果两人同时点击，Redis Lua 的原子性确保只有一人成功。但在内存模式下（本地开发），Node.js 的单线程模型保护了这一点。标记为设计已知，无需修复。

---

## 十一、内容生成与翻译审查

**N/A** — 无 AI 内容生成，无翻译系统。

---

## 十二、发版前终极检查

| 检查项 | 状态 |
|--------|------|
| config 无硬编码密钥 | ✅ |
| .env 不在 git 中 | ✅ |
| 无 console.log 敏感信息 | ✅ |
| 动态 SQL 有白名单 | N/A |
| 编译通过 | 🟡 `noImplicitAny: true` 后需跑 `tsc --noEmit` 确认（本环境无法装依赖验证） |
| 所有函数有定义 | ✅ import 逐一验证 |
| 跨模块 import 名称匹配 | ✅ |
| 原子性 | ✅ castVote / createRoom / tryAcquireRoom 均 Lua |
| Redis key 有 TTL | 🟠 `uc:words:*` 缺 TTL |
| 所有语言测核心流程 | 🟡 无自动化 e2e 测试，需手动验证 |
| 错误状态有友好提示 | ✅ `bot.catch` + `errors.generic` |
| TODO/FIXME 清零 | ✅ |

---

## 十三、AI 辅助开发审查要点

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 函数名幻觉 | ✅ | 所有 import 已逐一验证，无不存在的函数 |
| 跨文件一致性 | ✅ | engine 和 handler 的函数签名一致 |
| 重复逻辑 | ✅ | `endGameCleanup` 只有一个入口 |
| 遗留 stub | ✅ | grep TODO/FIXME/HACK 全零 |
| Unicode 陷阱 | ✅ | 日志已清除 em dash，i18n 文件的 Unicode 是有意的用户文案 |

---

## 总结

### 按严重性分级

| 级别 | 数量 | 问题 |
|------|------|------|
| 🔴 CRITICAL | 0 | — |
| 🟠 HIGH | 2 | `.env.example` 缺 `WEBHOOK_SECRET`；`uc:words:*` 无 TTL |
| 🟡 MEDIUM | 4 | fallback 语言散落 3 处；新增语言无 checklist；`shuffle` 冗余 re-export；`tsc --noEmit` 待验证 |
| 🟢 LOW | 0 | — |

### 修复优先级建议

1. **立即修**（5 分钟）：`.env.example` 加 `WEBHOOK_SECRET`
2. **本版本修**（10 分钟）：`wordStore.ts` seed 后加 30 天 TTL
3. **下版本做**：提取 `DEFAULT_LANG` 常量；写 `ADD_NEW_LANGUAGE.md`；删除 `shuffle` re-export；跑 `tsc --noEmit` 修报错

### 整体评价

v1.5.0 在安全、并发、i18n 类型安全方面做得扎实。没有 CRITICAL 级问题。两个 HIGH 问题都是配置/运维层面的遗漏，不是代码逻辑缺陷，修复成本极低。代码模块边界清晰，timer 管理已收敛，测试覆盖了核心纯函数。相比 v1.4.0 有质的提升。
