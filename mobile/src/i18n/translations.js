export const LOCALES = {
  ja: 'ja',
  mn: 'mn',
};

const ja = {
  appTitle: '日モ辞書',
  searchPlaceholder: '日本語・モンゴル語で検索…',
  searchEmptyTitle: '単語を入力して検索',
  searchEmptySub: '日本語でもモンゴル語でも検索できます',
  searchHistoryTitle: '検索履歴',
  searchHistoryClear: 'すべて消去',
  searchHistoryClearTitle: '検索履歴を消去',
  searchHistoryClearMessage: 'すべての検索履歴を削除しますか？',
  searchHistoryRemoveA11y: (word) => `${word}を履歴から削除`,
  searchHistoryItemA11y: (word) => `${word}を検索`,
  searchNotFound: (q) => `「${q}」は見つかりませんでした`,
  dictionaryPreparing: '辞書を準備しています…',
  dictionaryLoadFailed: '辞書の読み込みに失敗しました。再読み込みしてください。',
  searchFailed: '検索に失敗しました。もう一度お試しください。',
  switchToMongolian: 'アプリ言語: 日本語。タップでモンゴル語に切り替え',
  switchToJapanese: 'アプリ言語: モンゴル語。タップで日本語に切り替え',

  navSearch: '検索',
  navFavorites: 'お気に入り',
  navWordList: '単語リスト',
  navKanjiList: '漢字リスト',
  navGrammar: '文法',
  navSlang: 'スラング',
  navSettings: '設定',
  openMenu: 'メニューを開く',

  wordListTitle: '単語リスト',
  wordListLevelLabel: (level) => `JLPT ${level}`,
  wordListLevelA11y: (level, count) => `JLPT ${level}、${count}語`,
  wordListCount: (n) => `${n}語`,
  wordListEmpty: 'このレベルの単語はありません',

  kanjiListTitle: '漢字リスト',
  kanjiListLevelLabel: (level) => `JLPT ${level}`,
  kanjiListLevelA11y: (level, count) => `JLPT ${level}、${count}字`,
  kanjiListCount: (n) => `${n}字`,
  kanjiListEmpty: 'このレベルの漢字はありません',

  grammarTitle: '文法',
  grammarLevelLabel: (level) => (level === 'other' ? 'その他' : `JLPT ${level}`),
  grammarLevelA11y: (level, count) =>
    (level === 'other' ? `その他、${count}件` : `JLPT ${level}、${count}件`),
  grammarCount: (n) => `${n}件`,
  grammarEmpty: 'このレベルの文法はありません',
  grammarSearchPlaceholder: '文法を検索…',
  grammarSearchNotFound: (q) => `「${q}」は見つかりませんでした`,
  grammarConnection: '接続',
  grammarMeaning: '意味',
  grammarNote: '注意',
  grammarSource: '出典',
  grammarItemA11y: (pattern) => `${pattern}の詳細`,

  slangTitle: 'スラング',
  slangSearchPlaceholder: 'スラングを検索…',
  slangSearchNotFound: (q) => `「${q}」は見つかりませんでした`,
  slangEmpty: 'スラングはありません',
  slangCount: (n) => `${n}件`,
  slangItemA11y: (term) => `${term}の詳細`,
  slangOpenSource: '元記事を開く',
  slangAttribution: 'Scripting Japan（CC BY-NC-SA 4.0）',

  favoritesTitle: 'お気に入り',
  favoritesEmpty: 'お気に入りはまだありません',
  favoritesEmptySub: '単語や漢字の☆をタップして追加できます',
  favoritesCount: (n) => `${n}件`,
  epaperIntroTitle: '電子単語帳（e-Paper）とは',
  epaperIntroBody1: 'アプリで選んだ単語を、紙のような画面の小さな端末に送れます。',
  epaperIntroBody2: 'この端末を持っていない場合は、送信はできません。',
  epaperIntroHasDevice: '端末がある',
  epaperIntroBuy: '購入する',
  epaperIntroClose: '閉じる',
  epaperSend: 'e-Paperに送る',
  epaperSending: '送信中…',
  epaperSendTitle: 'e-Paperに送信',
  epaperSendMessage: (ssid, password, _host, count, max) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `単語: ${Math.min(count, max)}件` +
    (count > max ? `（お気に入り ${count}件中、先頭${max}件）` : ''),
  epaperSendConfirm: '送信',
  epaperSendSuccess: (n) => `${n}語を e-Paper に送信しました`,
  epaperSendSuccessTruncated: (sent, total, max) =>
    `${sent}語を送信しました（お気に入り${total}件中、上限${max}件）`,
  epaperSendFailed: '送信に失敗しました',
  epaperSendFailedNetwork:
    'e-Paper に接続できません。Wi-Fi が Wordbook_AP になっているか確認してください。',
  epaperSendFailedNoWords: '送れる単語がありません',
  epaperSendFailedNoKanji: '送れる漢字がありません',
  epaperSendRangeLabel: '送信範囲',
  epaperSendRangeChip: (from, to) => `${from}–${to}`,
  epaperSendRangeCount: (from, to, n) => `${from}–${to}（${n}）`,
  epaperSendListMessage: (ssid, password, _host, count, max) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `単語: ${Math.min(count, max)}語` +
    (count > max ? `（${count}語中、先頭${max}語）` : '') +
    `\n※端末の単語帳を置き換えます`,
  epaperSendListRangeMessage: (ssid, password, _host, from, to, count) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `単語: ${from}–${to}（${count}語）` +
    `\n※端末の単語帳を置き換えます`,
  epaperSendSuccessTruncatedList: (sent, total, max) =>
    `${sent}語を送信しました（${total}語中、上限${max}語）`,
  epaperSendKanjiMessage: (ssid, password, _host, count, max) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `漢字: ${Math.min(count, max)}字` +
    (count > max ? `（${count}字中、先頭${max}字）` : '') +
    `\n※端末の単語帳を置き換えます`,
  epaperSendKanjiRangeMessage: (ssid, password, _host, from, to, count) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `漢字: ${from}–${to}（${count}字）` +
    `\n※端末の単語帳を置き換えます`,
  epaperSendKanjiSuccess: (n) => `${n}字を e-Paper に送信しました`,
  epaperSendKanjiSuccessTruncated: (sent, total, max) =>
    `${sent}字を送信しました（${total}字中、上限${max}字）`,

  settingsTitle: '設定',
  settingsDictionaryInfo: '辞書情報',
  settingsDictionaryName: '辞書名',
  settingsDictionaryNameValue: '日モ辞書',
  settingsEntryCount: '収録数',
  settingsEntryCountValue: '213,397語',
  settingsSource: '出典',
  settingsSourceValue: '東北大学・栗林均',
  settingsAppearance: '表示',
  settingsTheme: 'テーマ',
  settingsLanguage: 'アプリ言語',
  themeLight: 'ライト',
  themeDark: 'ダーク',

  settingsData: 'データ',
  settingsFavoritesCount: 'お気に入り件数',
  settingsResetFavorites: 'お気に入りをリセット',
  settingsResetTitle: 'お気に入りをリセット',
  settingsResetMessage: 'すべてのお気に入りを削除しますか？',
  settingsEpaper: 'e-Paper',
  settingsEpaperShowIntro: '端末の説明を再表示',
  settingsEpaperShowIntroDone: '次回の送信時に説明を表示します',
  settingsEpaperShop: '購入ページ',
  settingsEpaperHost: '送信先IP',
  settingsEpaperHostHint: '通常は 192.168.4.1',
  settingsEpaperWifi: 'Wi-Fi名',
  settingsEpaperPassword: 'Wi-Fiパスワード',
  settingsEpaperTest: '接続テスト',
  settingsEpaperTestOk: 'e-Paper に接続できました',
  settingsEpaperTestFail: '接続できません。Wordbook_AP に接続しているか確認してください。',
  cancel: 'キャンセル',
  delete: '削除',
  save: '保存',

  mongolianTranslation: 'モンゴル語訳',
  mongolianMeanings: 'モンゴル語の意味',
  editMeaning: '編集',
  saveMeaning: '保存',
  resetMeaning: '元に戻す',
  meaningEditPlaceholder: '1行に1つの意味を入力',
  meaningEditHint: '改行で複数の意味を区切れます。',
  meaningEditWordTitle: 'モンゴル語訳を編集',
  meaningEditKanjiTitle: (char) => `「${char}」のモンゴル語意味を編集`,
  examples: '例文',
  conjugations: '活用形',
  conjGroup_affirmative: '肯定形',
  conjGroup_negative: '否定形',
  conjGroup_polite: '丁寧',
  conjGroup_politeNegative: '丁寧否定',
  conj_dictionary: '辞書形',
  conj_past: '過去',
  conj_te: 'テ形',
  conj_conditionalBa: '仮定形',
  conj_conditionalTara: 'たら形',
  conj_potential: '可能',
  conj_passive: '受身',
  conj_causative: '使役',
  conj_imperative: '命令',
  conj_volitional: '意向',
  kanji: '漢字',
  showMeaning: '意味を表示',
  onReadingShort: '音',
  kunReadingShort: '訓',
  kanjiDetailA11y: (char) => `${char}の詳細`,

  back: '戻る',
  addFavorite: 'お気に入りに追加',
  removeFavorite: 'お気に入りから削除',

  kanjiNotFound: '漢字が見つかりません',
  strokes: '画数',
  jlpt: 'JLPT',
  grade: '学年',
  radical: '部首',
  readings: '読み',
  onYomi: '音読み',
  kunYomi: '訓読み',
  similarKanji: '似ている漢字',
  gradeYear: (n) => `${n}年`,

  kanjiWordSearchSection: 'この漢字を含む語',
  kanjiWordSearchBtnPrefix: (char) => `${char}_`,
  kanjiWordSearchBtnMiddle: (char) => `_${char}_`,
  kanjiWordSearchBtnSuffix: (char) => `_${char}`,
  kanjiWordSearchBtnPrefixA11y: (char) => `${char}で始まる語を検索`,
  kanjiWordSearchBtnMiddleA11y: (char) => `${char}を含む語を検索`,
  kanjiWordSearchBtnSuffixA11y: (char) => `${char}で終わる語を検索`,
  kanjiWordSearchTitlePrefix: (char) => `${char}で始まる語`,
  kanjiWordSearchTitleMiddle: (char) => `${char}を含む語`,
  kanjiWordSearchTitleSuffix: (char) => `${char}で終わる語`,
  kanjiWordSearchEmpty: '該当する語がありません',
  kanjiWordSearchCount: (n) => `${n}件`,

  kanjiSearchTitle: '部首・画数で検索',
  openKanjiSearch: '部首・画数で漢字を探す',
  strokeAny: 'すべて',
  strokeCountOption: (n) => `${n}画`,
  kanjiSearchHint: '画数または部首を選ぶと、漢字の候補が表示されます。部首は複数選べます。',
  kanjiSearchEmpty: '条件に合う漢字がありません',
  kanjiSearchResultCount: (n) => `${n}件`,
  clearFilters: '条件をクリア',
  radicalChipA11y: (char) => `部首 ${char}`,
};

const mn = {
  appTitle: 'НИЧИМО толь',
  searchPlaceholder: 'Япон / Монгол хэлээр хайх…',
  searchEmptyTitle: 'Үг оруулаад хайна уу',
  searchEmptySub: 'Япон болон монгол хэлээр хайх боломжтой',
  searchHistoryTitle: 'Хайлтын түүх',
  searchHistoryClear: 'Бүгдийг устгах',
  searchHistoryClearTitle: 'Хайлтын түүх устгах',
  searchHistoryClearMessage: 'Хайлтын түүхийг бүгдийг устгах уу?',
  searchHistoryRemoveA11y: (word) => `${word}-г түүхээс устгах`,
  searchHistoryItemA11y: (word) => `${word}-г хайх`,
  searchNotFound: (q) => `«${q}» олдсонгүй`,
  dictionaryPreparing: 'Толь бичгийг ачаалж байна…',
  dictionaryLoadFailed: 'Толь бичиг ачаалж чадсангүй. Дахин ачаална уу.',
  searchFailed: 'Хайлт амжилтгүй боллоо. Дахин оролдоно уу.',
  switchToMongolian: 'Аппын хэл: япон. Монгол руу солих',
  switchToJapanese: 'Аппын хэл: монгол. Япон руу солих',

  navSearch: 'Хайлт',
  navFavorites: 'Хадгалсан үгс',
  navWordList: 'Үгийн жагсаалт',
  navKanjiList: 'Ханзын жагсаалт',
  navGrammar: 'Дүрэм',
  navSlang: 'Хар яриагын үгс',
  navSettings: 'Тохиргоо',
  openMenu: 'Цэс нээх',

  wordListTitle: 'Үгийн жагсаалт',
  wordListLevelLabel: (level) => `JLPT ${level}`,
  wordListLevelA11y: (level, count) => `JLPT ${level}, ${count} үг`,
  wordListCount: (n) => `${n}`,
  wordListEmpty: 'Энэ түвшний үг байхгүй',

  kanjiListTitle: 'Ханзын жагсаалт',
  kanjiListLevelLabel: (level) => `JLPT ${level}`,
  kanjiListLevelA11y: (level, count) => `JLPT ${level}, ${count} ханз`,
  kanjiListCount: (n) => `${n}`,
  kanjiListEmpty: 'Энэ түвшний ханз байхгүй',

  grammarTitle: 'Дүрэм',
  grammarLevelLabel: (level) => (level === 'other' ? 'Бусад' : `JLPT ${level}`),
  grammarLevelA11y: (level, count) =>
    (level === 'other' ? `Бусад, ${count}` : `JLPT ${level}, ${count}`),
  grammarCount: (n) => `${n}`,
  grammarEmpty: 'Энэ түвшний Дүрэм байхгүй',
  grammarSearchPlaceholder: 'Дүрэм хайх…',
  grammarSearchNotFound: (q) => `«${q}» олдсонгүй`,
  grammarConnection: 'Холболт',
  grammarMeaning: 'Утга',
  grammarNote: 'Анхаар',
  grammarSource: 'Эх сурвалж',
  grammarItemA11y: (pattern) => `${pattern}-ийн дэлгэрэнгүй`,

  slangTitle: 'Хар яриагын үгс',
  slangSearchPlaceholder: 'Хар яриагын үг хайх…',
  slangSearchNotFound: (q) => `«${q}» олдсонгүй`,
  slangEmpty: 'Хар яриагын үг байхгүй',
  slangCount: (n) => `${n}`,
  slangItemA11y: (term) => `${term}-ийн дэлгэрэнгүй`,
  slangOpenSource: 'Эх өгүүллийг нээх',
  slangAttribution: 'Scripting Japan (CC BY-NC-SA 4.0)',

  favoritesTitle: 'Хадгалсан үгс',
  favoritesEmpty: 'Хадгалсан үгс байхгүй байна',
  favoritesEmptySub: 'Үг эсвэл ханзын ☆-г дарж нэмнэ үү',
  favoritesCount: (n) => `${n}`,
  epaperIntroTitle: 'Цахим үгийн дэвтэр (e-Paper) гэж юу вэ',
  epaperIntroBody1: 'Апп дээр сонгосон үгээ цаасан дэлгэцтэй жижиг төхөөрөмж рүү илгээнэ.',
  epaperIntroBody2: 'Төхөөрөмж байхгүй бол илгээх боломжгүй.',
  epaperIntroHasDevice: 'Төхөөрөмжтэй',
  epaperIntroBuy: 'Худалдан авах',
  epaperIntroClose: 'Хаах',
  epaperSend: 'e-Paper рүү илгээх',
  epaperSending: 'Илгээж байна…',
  epaperSendTitle: 'e-Paper рүү илгээх',
  epaperSendMessage: (ssid, password, _host, count, max) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Энэ апп руу буцаж ирээд Илгээх товчийг дарна уу\n\n` +
    `Үг: ${Math.min(count, max)}` +
    (count > max ? ` (хадгалсан үгсээс ${count}-аас эхний ${max})` : ''),
  epaperSendConfirm: 'Илгээх',
  epaperSendSuccess: (n) => `${n} үгийг e-Paper рүү илгээлээ`,
  epaperSendSuccessTruncated: (sent, total, max) =>
    `${sent} үг илгээлээ (хадгалсан үгсээс ${total}-аас дээд ${max})`,
  epaperSendFailed: 'Илгээж чадсангүй',
  epaperSendFailedNetwork:
    'e-Paper-т холбогдож чадсангүй. Wi-Fi Wordbook_AP эсэхийг шалгана уу.',
  epaperSendFailedNoWords: 'Илгээх үг байхгүй',
  epaperSendFailedNoKanji: 'Илгээх ханз байхгүй',
  epaperSendRangeLabel: 'Илгээх хүрээ',
  epaperSendRangeChip: (from, to) => `${from}–${to}`,
  epaperSendRangeCount: (from, to, n) => `${from}–${to} (${n})`,
  epaperSendListMessage: (ssid, password, _host, count, max) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Энэ апп руу буцаж ирээд Илгээх товчийг дарна уу\n\n` +
    `Үг: ${Math.min(count, max)}` +
    (count > max ? ` (${count}-аас эхний ${max})` : '') +
    `\n※Төхөөрөмжийн жагсаалтыг сольно`,
  epaperSendListRangeMessage: (ssid, password, _host, from, to, count) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Энэ апп руу буцаж ирээд Илгээх товчийг дарна уу\n\n` +
    `Үг: ${from}–${to} (${count})` +
    `\n※Төхөөрөмжийн жагсаалтыг сольно`,
  epaperSendSuccessTruncatedList: (sent, total, max) =>
    `${sent} үг илгээлээ (${total}-аас дээд ${max})`,
  epaperSendKanjiMessage: (ssid, password, _host, count, max) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Энэ апп руу буцаж ирээд Илгээх товчийг дарна уу\n\n` +
    `Ханз: ${Math.min(count, max)}` +
    (count > max ? ` (${count}-аас эхний ${max})` : '') +
    `\n※Төхөөрөмжийн жагсаалтыг сольно`,
  epaperSendKanjiRangeMessage: (ssid, password, _host, from, to, count) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Энэ апп руу буцаж ирээд Илгээх товчийг дарна уу\n\n` +
    `Ханз: ${from}–${to} (${count})` +
    `\n※Төхөөрөмжийн жагсаалтыг сольно`,
  epaperSendKanjiSuccess: (n) => `${n} ханзыг e-Paper рүү илгээлээ`,
  epaperSendKanjiSuccessTruncated: (sent, total, max) =>
    `${sent} ханз илгээлээ (${total}-аас дээд ${max})`,

  settingsTitle: 'Тохиргоо',
  settingsDictionaryInfo: 'Толь бичгийн тухай',
  settingsDictionaryName: 'Нэр',
  settingsDictionaryNameValue: 'НИЧИМО толь бичиг',
  settingsEntryCount: 'Үгийн тоо',
  settingsEntryCountValue: '213,397',
  settingsSource: 'Эх сурвалж',
  settingsSourceValue: 'Тохоку их сургууль · Курибаяши Хитоши',
  settingsAppearance: 'Харагдац',
  settingsTheme: 'Загвар',
  settingsLanguage: 'Аппын хэл',
  themeLight: 'Гэрэл',
  themeDark: 'Харанхуй',

  settingsData: 'Өгөгдөл',
  settingsFavoritesCount: 'Хадгалсан үгийн тоо',
  settingsResetFavorites: 'Хадгалсан үгсыг цэвэрлэх',
  settingsResetTitle: 'Хадгалсан үгсыг цэвэрлэх',
  settingsResetMessage: 'Бүх хадгалсан үгсыг устгах уу?',
  settingsEpaper: 'e-Paper',
  settingsEpaperShowIntro: 'Төхөөрөмжийн тайлбарыг дахин харах',
  settingsEpaperShowIntroDone: 'Дараагийн илгээлтэд тайлбар гарна',
  settingsEpaperShop: 'Худалдан авах хуудас',
  settingsEpaperHost: 'IP хаяг',
  settingsEpaperHostHint: 'Ихэвчлэн 192.168.4.1',
  settingsEpaperWifi: 'Wi-Fi нэр',
  settingsEpaperPassword: 'Wi-Fi нууц үг',
  settingsEpaperTest: 'Холболт шалгах',
  settingsEpaperTestOk: 'e-Paper-т холбогдлоо',
  settingsEpaperTestFail: 'Холбогдож чадсангүй. Wordbook_AP-д холбогдсон эсэхийг шалгана уу.',
  cancel: 'Цуцлах',
  delete: 'Устгах',
  save: 'Хадгалах',

  mongolianTranslation: 'Монгол орчуулга',
  mongolianMeanings: 'Монгол утга',
  editMeaning: 'Засах',
  saveMeaning: 'Хадгалах',
  resetMeaning: 'Анхны байдал',
  meaningEditPlaceholder: 'Нэг мөрөнд нэг утга',
  meaningEditHint: 'Шинэ мөр шилжүүлснээр олон утгыг тусгаарлах боломжтой.',
  meaningEditWordTitle: 'Монгол утгыг засах',
  meaningEditKanjiTitle: (char) => `«${char}»-ийн монгол утгыг засах`,
  examples: 'Жишээ өгүүлбэр',
  conjugations: 'Хувилал',
  conjGroup_affirmative: 'Батлах хэлбэр',
  conjGroup_negative: 'Үгүйсгэх хэлбэр',
  conjGroup_polite: 'Эелдэг хэлбэр',
  conjGroup_politeNegative: 'Эелдэг үгүйсгэх хэлбэр',
  conj_dictionary: 'Үндсэн хэлбэр',
  conj_past: 'Өнгөрсөн хэлбэр',
  conj_te: 'Тэ хэлбэр',
  conj_conditionalBa: 'Нөхцөл (ба) хэлбэр',
  conj_conditionalTara: 'Нөхцөл (тара) хэлбэр',
  conj_potential: 'Боломжит хэлбэр',
  conj_passive: 'Идэвхгүй хэлбэр',
  conj_causative: 'Үйлдүүлэх хэлбэр',
  conj_imperative: 'Захирах хэлбэр',
  conj_volitional: 'Хүсэл зоригийн хэлбэр',
  kanji: 'Ханз',
  showMeaning: 'Утгыг харах',
  onReadingShort: 'Он',
  kunReadingShort: 'Кун',
  kanjiDetailA11y: (char) => `${char}-ийн дэлгэрэнгүй`,

  back: 'Буцах',
  addFavorite: 'Хадгалсан үгсэд нэмэх',
  removeFavorite: 'Хадгалсан үгсээс хасах',

  kanjiNotFound: 'Ханз олдсонгүй',
  strokes: 'Зураасны тоо',
  jlpt: 'JLPT',
  grade: 'Анги',
  radical: 'Үндэс',
  readings: 'Уншилт',
  onYomi: 'Онъёми',
  kunYomi: 'Кунъёми',
  similarKanji: 'Төстэй ханз',
  gradeYear: (n) => `${n}-р анги`,

  kanjiWordSearchSection: 'Энэ ханз агуулсан үг',
  kanjiWordSearchBtnPrefix: (char) => `${char}_`,
  kanjiWordSearchBtnMiddle: (char) => `_${char}_`,
  kanjiWordSearchBtnSuffix: (char) => `_${char}`,
  kanjiWordSearchBtnPrefixA11y: (char) => `${char}-ээр эхэлсэн үг хайх`,
  kanjiWordSearchBtnMiddleA11y: (char) => `${char} агуулсан үг хайх`,
  kanjiWordSearchBtnSuffixA11y: (char) => `${char}-ээр төгссөн үг хайх`,
  kanjiWordSearchTitlePrefix: (char) => `${char}-ээр эхэлсэн үг`,
  kanjiWordSearchTitleMiddle: (char) => `${char} агуулсан үг`,
  kanjiWordSearchTitleSuffix: (char) => `${char}-ээр төгссөн үг`,
  kanjiWordSearchEmpty: 'Тохирох үг олдсонгүй',
  kanjiWordSearchCount: (n) => `${n}`,

  kanjiSearchTitle: 'Үндэс · зураасаар хайх',
  openKanjiSearch: 'Үндэс · зураасаар ханз хайх',
  strokeAny: 'Бүгд',
  strokeCountOption: (n) => `${n} зураас`,
  kanjiSearchHint: 'Зураас эсвэл үндсийг сонгоход ханзын жагсаалт гарна. Үндсийг олон сонгож болно.',
  kanjiSearchEmpty: 'Тохирох ханз олдсонгүй',
  kanjiSearchResultCount: (n) => `${n}`,
  clearFilters: 'Шүүлт цэвэрлэх',
  radicalChipA11y: (char) => `Үндэс ${char}`,
};

export const translations = { ja, mn };
