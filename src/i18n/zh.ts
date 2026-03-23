import type { I18nTexts } from './types';

export const zhTexts: I18nTexts = {
  i18n: {
    chooseLanguage: '请选择语言',
    back: '🔙 返回',
  },
  mainMenu: {
    welcome: '欢迎使用 @Blink_AIgames_bot，一起来玩！',
    btnUndercover: '谁是卧底',
    btnCancel: '取消',
    cancelAnswer: '好的，后台待命。发送 /play 开始游戏！',
    usePlayggForLatestMenu: '旧版菜单，请发送 /play。',
    privatePlayggHint: '🎮 请将我拉入群组，在群内发送 /play 开始游戏！',
    groupUsePlaygg: '👉 群里请用 /play 唤出菜单。',
    btnTruthOrDare: '🎯 真心话大冒险',
    btnLanguage: '🌐 语言',
  },
  errors: {
    generic: '⚠️ 出现错误，请稍后再试。',
  },
  common: {
    onlyGroups: '这个游戏只能在群里玩。',
    btnStartGame: '▶ 开始游戏',
    roomFull: (used: number, max: number) => `房间已满：${used}/${max}，请稍后再试。`,
    roomClosedOrNotFound: '房间已关闭或不存在。',
    linkExpiredGameStarted: '游戏已开始，链接失效。',
    roomLabel: (roomId: number) => `🎪 ${roomId}号房`,
  },
  groupWelcome: {
    title: '🎮 欢迎加入 @Blink_AIgames_bot',
    intro: '玩谁是卧底等群游戏。发送 /play 开始！',
    separator: '—————————————',
    partners: '合作伙伴：Blink — 更多社交与游戏！',
  },
  growth: {
    ctaText: '试试 Blink：更多社交与游戏！',
    ctaButton: '打开 Blink',
  },
  intro: {
    undercover:
      '🕵️ 谁是卧底\n' +
      '心跳加速的逻辑博弈，谁在说谎？\n' +
      '👥 5–12 人\n' +
      '🕹 流程：\n' +
      '  1. 点链接私聊 Bot 领词。卧底的词略有不同 🤫\n' +
      '  2. 轮流描述，每人 30 秒，别说出原词！\n' +
      '  3. 90 秒自由讨论，抓漏洞！\n' +
      '  4. 按钮投票 20 秒，投出嫌疑人。\n' +
      '❌ 无人投票则自动结束！\n' +
      '🎭 配置：5–6人→1卧底 | 7–9→2 | 10–12→3\n' +
      '🟢 平民胜：揪出所有卧底\n' +
      '🔴 卧底胜：卧底 ≥ 平民',
    confess:
      '🎭 匿名大字报\n' +
      '想说又不敢说？让颜色替你开口！\n\n' +
      '🕹 玩法：\n' +
      '  1. 点下方按钮，私聊 Bot 写你想说的话\n' +
      '  2. Bot 帮你匿名贴到群里，变成一张彩色大字报\n' +
      '  3. 同一个人在 10 分钟内颜色相同，之后自动换色\n' +
      '  4. 想发几条发几条，没有限制\n\n' +
      '🤫 没人知道你是谁。颜色就是你的身份。',
  },
  undercover: {
    joinSuccess: '已加入，等待开始。',
    joinSuccessWithReturnLink: (groupLink: string) =>
      `已加入，等待开始。\n返回群组 👉 <a href="${groupLink}">点击返回</a>`,
    countdown10s: '⏱ 10 秒后关闭报名',
    gameStartCivilian: (word: string) => `游戏开始！你的词：${word}`,
    blankWord: '(无词)',
    blankCivilianMessage: '游戏开始！本局你没有词（白板）。',
    nowSpeaking: (name: string) => `当前发言：📍 @${name}`,
    speakButtonHint: '👇 非本人不要点❗️',
    btnEndSpeak: '结束发言',
    btnEndRound: '结束回合',
    btnEndGame: '🛑 结束游戏',
    freeTalk: '🗣 自由讨论！',
    votePrompt: '投票选出嫌疑人：',
    voteProgress: (voted: number, total: number) => `📊 ${voted}/${total} 已投票`,
    voteChanged: (name: string) => `已改投 ${name}`,
    eliminated: (name: string) => `💀 ${name} 被淘汰！`,
    civiliansWin: '🏆 平民胜利！所有卧底已被淘汰。',
    undercoverWins: '🏆 卧底胜利！卧底 ≥ 平民。',
    nextRound: '下一轮',
    joinStartText: (link: string, min: number, max: number, seconds: number) =>
      `🎭 谁是卧底开始报名！\n点击加入：\n${link}\n\n${min}–${max}人，${seconds}秒倒计时。`,
    linkExpiredGameStarted: '游戏已开始，链接失效。',
    linkExpiredRoomFull: (max: number) => `房间已满（最多${max}人），链接失效。`,
    startCancelled: '人数不足，快邀请朋友！',
    startCancelledWithCount: (current: number, required: number) =>
      `人数不足（${current}/${required}），快邀请朋友！`,
    startFailed: '启动异常，请重试。',
    startFailedNoRights: '启动失败：请确保 Bot 有发言权限。',
    startAnnounce: (count: number) => `谁是卧底开始！${count}人。`,
    voteDone: (name: string) => `投票给了 ${name}`,
    notInThisGame: '你不在本局游戏中。',
    noVotesRetry: '无人投票，本局结束。',
    tieNoElimination: (maxVotes: number) => `⚖️ 平票（${maxVotes}票）！无人淘汰，继续。`,
    nextRoundIn5s: '⏱ 5秒后下一轮。',
    tallyTitle: '🗳 投票结算：',
    tallyLine: (name: string, count: number, voters: string) => `${name}  ${count}票 <<< ${voters}`,
    noVotesInTally: '（无人投票）',
    roomFull: (used: number, max: number) => `房间已满：${used}/${max}，请稍后再试。`,
    currentRoomPlayers: (roomId: number, count: number, names: string) => `🎪 ${roomId}号房：${count} — ${names}`,
    roundEnded: '该局已结束。',
    alreadyEnded: '已结束。',
    notYourTurn: '非本人不可点击！',
    gameForceEnded: '游戏已强制结束。',
    invalidVoteTarget: '无效的投票目标。',
    cannotVoteSelf: '不能投自己！',
    returnToGroup: '返回群组',
    btnPlayAgain: '🔄 再来一局',
    civiliansLabel: '平民阵营',
    undercoverLabel: '卧底阵营',
    civiliansWinSubtitle: '卧底无处遁形！',
    undercoverWinSubtitle: '平民已无力回天...',
    reportGameOver: '🚩 游戏结束！',
    reportSpyLabel: '🕵️‍♂️ 卧底',
    reportCivLabel: '👨‍🌾 平民',
    reportBlankWord: '🚫 白板',
    reportNone: '（无）',
    reportWinLine: (winnerLabel: string) => `🏆 [ ${winnerLabel} ] 完胜！`,
  },
  truthOrDare: {
    chooseTier: '🎯 <b>真心话大冒险</b>\n\n选择模式：',
    tierIcebreaker: '❄️ 轻松局',
    tierAdvanced: '🔮 真话局',
    tierSpicy: '🌙 夜间局 (18+)',
    recruitText: (min: number, max: number, tierLabel: string) =>
      `🎯 <b>真心话大冒险</b>  ${tierLabel}\n\n点击加入，${min}–${max} 人即可开始！`,
    recruitTextWithPlayers: (min: number, max: number, count: number, names: string, tierLabel: string) =>
      `🎯 <b>真心话大冒险</b>  ${tierLabel}\n\n已加入 ${count} 人：${names}\n\n${min}–${max} 人，点击加入！`,
    btnJoin: '✋ 加入',
    btnStart: '▶ 开始游戏',
    btnTruth: '💬 真心话',
    btnDare: '🔥 大冒险',
    btnSkip: '⏭ 跳过',
    btnNext: '👉 下一位',
    btnEndGame: '🛑 结束游戏',
    yourTurn: (name: string) => `轮到 <b>${name}</b>，请选择：`,
    truthLabel: '💬 真心话',
    dareLabel: '🔥 大冒险',
    questionFor: (name: string, label: string, question: string) =>
      `${label} → <b>${name}</b>\n\n${question}`,
    joined: '已加入！',
    alreadyJoined: '你已经加入了',
    alreadyRunning: '已有一局正在进行，请先结束当前游戏。',
    alreadyStarted: '游戏已经开始了',
    sessionEnded: '游戏已结束',
    notYourTurn: '现在不是你的回合',
    notInGame: '你不在本局游戏中',
    notEnough: (current: number, required: number) => `人数不足（${current}/${required}）`,
    full: '人数已满',
    gameStarted: (count: number, tierLabel: string) => `🎯 真心话大冒险开始！${count} 人参加。模式：${tierLabel}`,
    gameEnded: '🎯 真心话大冒险结束，下次再玩！',
    timeoutSkipped: (name: string) => `⏱ ${name} 超时，自动跳过`,
  },
  anonymousChat: {
    menuButton: '🎭 匿名大字报',
    groupPrompt: '🎭 匿名大字报来了！\n点击下方按钮，私聊我写你想说的话 👇\n你的身份将用颜色代替，无人知道你是谁。',
    btnStart: '🎭 我要说',
    activated: (group: string) => `🎭 大字报模式！目标群：<b>${group}</b>`,
    activatedHint: '直接打字发送，我会帮你匿名贴到群里。\n再发一条就继续贴，发 /quit 退出。',
    sent: '✅ 已贴出',
    sendFailed: '发送失败，请稍后再试',
    quit: '🎭 大字报模式已退出。',
    quitHint: '想再说？去群里点「🎭 我要说」按钮。',
    quitInGroup: '请在和我的私聊中发 /quit 退出大字报模式',
    tooLong: '太长了，大字报要精炼！',
    tooShort: '至少写点什么吧',
    textOnly: '🎭 大字报只支持文字哦',
    disabled: '🔒 本群已关闭匿名大字报',
    notInGroup: '你不在那个群里',
    alsoSay: '🎭 我也要说',
    anonLabel: '匿名',
    adminOff: '🔒 匿名大字报已关闭',
    adminOn: '🎭 匿名大字报已开启',
    adminOnly: '仅管理员可操作',
  },
};
