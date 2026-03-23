export interface I18nTexts {
  i18n: {
    chooseLanguage: string;
    back: string;
  };
  mainMenu: {
    welcome: string;
    btnUndercover: string;
    btnLanguage: string;
    btnCancel: string;
    cancelAnswer: string;
    usePlayggForLatestMenu: string;
    privatePlayggHint: string;
    groupUsePlaygg: string;
    btnTruthOrDare: string;
  };
  errors: {
    generic: string;
  };
  common: {
    onlyGroups: string;
    btnStartGame: string;
    roomFull: (used: number, max: number) => string;
    roomClosedOrNotFound: string;
    linkExpiredGameStarted: string;
    roomLabel: (roomId: number) => string;
  };
  groupWelcome: {
    title: string;
    intro: string;
    separator: string;
    partners: string;
  };
  growth: {
    ctaText: string;
    ctaButton: string;
  };
  intro: {
    undercover: string;
    confess: string;
  };

  undercover: {
    joinSuccess: string;
    joinSuccessWithReturnLink: (groupLink: string) => string;
    countdown10s: string;
    gameStartCivilian: (word: string) => string;
    blankWord: string;
    blankCivilianMessage: string;
    nowSpeaking: (name: string) => string;
    speakButtonHint: string;
    btnEndSpeak: string;
    btnEndRound: string;
    btnEndGame: string;
    freeTalk: string;
    votePrompt: string;
    voteProgress: (voted: number, total: number) => string;
    voteChanged: (name: string) => string;
    eliminated: (name: string) => string;
    civiliansWin: string;
    undercoverWins: string;
    nextRound: string;
    nextRoundIn5s: string;
    joinStartText: (link: string, min: number, max: number, seconds: number) => string;
    linkExpiredGameStarted: string;
    linkExpiredRoomFull: (max: number) => string;
    startCancelled: string;
    startCancelledWithCount: (current: number, required: number) => string;
    startFailed: string;
    startFailedNoRights: string;
    startAnnounce: (count: number) => string;
    voteDone: (name: string) => string;
    notInThisGame: string;
    invalidVoteTarget: string;
    cannotVoteSelf: string;
    returnToGroup: string;
    btnPlayAgain: string;
    civiliansLabel: string;
    undercoverLabel: string;
    civiliansWinSubtitle: string;
    undercoverWinSubtitle: string;
    reportGameOver: string;
    reportSpyLabel: string;
    reportCivLabel: string;
    reportBlankWord: string;
    reportNone: string;
    reportWinLine: (winnerLabel: string) => string;
    noVotesRetry: string;
    tieNoElimination: (maxVotes: number) => string;
    tallyTitle: string;
    tallyLine: (name: string, count: number, voters: string) => string;
    noVotesInTally: string;
    roomFull: (used: number, max: number) => string;
    currentRoomPlayers: (roomId: number, count: number, names: string) => string;
    roundEnded: string;
    alreadyEnded: string;
    notYourTurn: string;
    gameForceEnded: string;
  };

  truthOrDare: {
    chooseTier: string;
    tierIcebreaker: string;
    tierAdvanced: string;
    tierSpicy: string;
    recruitText: (min: number, max: number, tierLabel: string) => string;
    recruitTextWithPlayers: (min: number, max: number, count: number, names: string, tierLabel: string) => string;
    btnJoin: string;
    btnStart: string;
    btnTruth: string;
    btnDare: string;
    btnSkip: string;
    btnNext: string;
    btnEndGame: string;
    yourTurn: (name: string) => string;
    truthLabel: string;
    dareLabel: string;
    questionFor: (name: string, label: string, question: string) => string;
    joined: string;
    alreadyJoined: string;
    alreadyRunning: string;
    alreadyStarted: string;
    sessionEnded: string;
    notYourTurn: string;
    notInGame: string;
    notEnough: (current: number, required: number) => string;
    full: string;
    gameStarted: (count: number, tierLabel: string) => string;
    gameEnded: string;
    timeoutSkipped: (name: string) => string;
  };

  anonymousChat: {
    menuButton: string;
    groupPrompt: string;
    btnStart: string;
    activated: (group: string) => string;
    activatedHint: string;
    sent: string;
    sendFailed: string;
    quit: string;
    quitHint: string;
    quitInGroup: string;
    tooLong: string;
    tooShort: string;
    textOnly: string;
    disabled: string;
    notInGroup: string;
    alsoSay: string;
    anonLabel: string;
    adminOff: string;
    adminOn: string;
    adminOnly: string;
  };
}
