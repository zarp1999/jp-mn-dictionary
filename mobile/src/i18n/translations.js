export const LOCALES = {
  ja: 'ja',
  mn: 'mn',
};

const ja = {
  appTitle: '日モ辞典',
  searchPlaceholder: '日本語・モンゴル語で検索…',
  searchEmptyTitle: '単語を入力して検索',
  searchEmptySub: '日本語でもモンゴル語でも検索できます',
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

  favoritesTitle: 'お気に入り',
  favoritesEmpty: 'お気に入りはまだありません',
  favoritesEmptySub: '検索画面で☆をタップして追加できます',
  favoritesCount: (n) => `${n}件`,
  epaperSend: 'e-Paperに送る',
  epaperSending: '送信中…',
  epaperSendTitle: 'e-Paperに送信',
  epaperSendMessage: (ssid, password, host, count, max) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `送信先: ${host}\n` +
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
  epaperSendListMessage: (ssid, password, host, count, max) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `送信先: ${host}\n` +
    `単語: ${Math.min(count, max)}語` +
    (count > max ? `（${count}語中、先頭${max}語）` : '') +
    `\n※端末の単語帳を置き換えます`,
  epaperSendListRangeMessage: (ssid, password, host, from, to, count) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `送信先: ${host}\n` +
    `単語: ${from}–${to}（${count}語）` +
    `\n※端末の単語帳を置き換えます`,
  epaperSendSuccessTruncatedList: (sent, total, max) =>
    `${sent}語を送信しました（${total}語中、上限${max}語）`,
  epaperSendKanjiMessage: (ssid, password, host, count, max) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `送信先: ${host}\n` +
    `漢字: ${Math.min(count, max)}字` +
    (count > max ? `（${count}字中、先頭${max}字）` : '') +
    `\n※端末の単語帳を置き換えます`,
  epaperSendKanjiRangeMessage: (ssid, password, host, from, to, count) =>
    `1. スマホのWi-Fiで「${ssid}」に接続（パスワード: ${password}）\n` +
    `2. このアプリに戻り、送信します\n\n` +
    `送信先: ${host}\n` +
    `漢字: ${from}–${to}（${count}字）` +
    `\n※端末の単語帳を置き換えます`,
  epaperSendKanjiSuccess: (n) => `${n}字を e-Paper に送信しました`,
  epaperSendKanjiSuccessTruncated: (sent, total, max) =>
    `${sent}字を送信しました（${total}字中、上限${max}字）`,

  settingsTitle: '設定',
  settingsDictionaryInfo: '辞書情報',
  settingsDictionaryName: '辞書名',
  settingsDictionaryNameValue: '日モ辞典',
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
  examples: '例文',
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
  mongolianMeanings: 'モンゴル語の意味',
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
  searchEmptySub: 'Япон болон монгол хэлээр хайж болно',
  searchNotFound: (q) => `«${q}» олдсонгүй`,
  dictionaryPreparing: 'Толь бичиг бэлдэж байна…',
  dictionaryLoadFailed: 'Толь бичиг ачаалж чадсангүй. Дахин ачаална уу.',
  searchFailed: 'Хайлт амжилтгүй боллоо. Дахин оролдоно уу.',
  switchToMongolian: 'Аппын хэл: япон. Монгол руу солих',
  switchToJapanese: 'Аппын хэл: монгол. Япон руу солих',

  navSearch: 'Хайлт',
  navFavorites: 'Дуртай',
  navWordList: 'Үгийн жагсаалт',
  navKanjiList: 'Ханзын жагсаалт',
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

  favoritesTitle: 'Дуртай',
  favoritesEmpty: 'Дуртай үг байхгүй байна',
  favoritesEmptySub: 'Хайлтаас ☆ дарж нэмнэ үү',
  favoritesCount: (n) => `${n}`,
  epaperSend: 'e-Paper рүү илгээх',
  epaperSending: 'Илгээж байна…',
  epaperSendTitle: 'e-Paper рүү илгээх',
  epaperSendMessage: (ssid, password, host, count, max) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Апп руугаа буцаж илгээнэ үү\n\n` +
    `Хаяг: ${host}\n` +
    `Үг: ${Math.min(count, max)}` +
    (count > max ? ` (дуртай ${count}-аас эхний ${max})` : ''),
  epaperSendConfirm: 'Илгээх',
  epaperSendSuccess: (n) => `${n} үгийг e-Paper рүү илгээлээ`,
  epaperSendSuccessTruncated: (sent, total, max) =>
    `${sent} үг илгээлээ (дуртай ${total}-аас дээд ${max})`,
  epaperSendFailed: 'Илгээж чадсангүй',
  epaperSendFailedNetwork:
    'e-Paper-т холбогдож чадсангүй. Wi-Fi Wordbook_AP эсэхийг шалгана уу.',
  epaperSendFailedNoWords: 'Илгээх үг байхгүй',
  epaperSendFailedNoKanji: 'Илгээх ханз байхгүй',
  epaperSendRangeLabel: 'Илгээх хүрээ',
  epaperSendRangeChip: (from, to) => `${from}–${to}`,
  epaperSendRangeCount: (from, to, n) => `${from}–${to} (${n})`,
  epaperSendListMessage: (ssid, password, host, count, max) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Апп руугаа буцаж илгээнэ үү\n\n` +
    `Хаяг: ${host}\n` +
    `Үг: ${Math.min(count, max)}` +
    (count > max ? ` (${count}-аас эхний ${max})` : '') +
    `\n※Төхөөрөмжийн жагсаалтыг сольно`,
  epaperSendListRangeMessage: (ssid, password, host, from, to, count) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Апп руугаа буцаж илгээнэ үү\n\n` +
    `Хаяг: ${host}\n` +
    `Үг: ${from}–${to} (${count})` +
    `\n※Төхөөрөмжийн жагсаалтыг сольно`,
  epaperSendSuccessTruncatedList: (sent, total, max) =>
    `${sent} үг илгээлээ (${total}-аас дээд ${max})`,
  epaperSendKanjiMessage: (ssid, password, host, count, max) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Апп руугаа буцаж илгээнэ үү\n\n` +
    `Хаяг: ${host}\n` +
    `Ханз: ${Math.min(count, max)}` +
    (count > max ? ` (${count}-аас эхний ${max})` : '') +
    `\n※Төхөөрөмжийн жагсаалтыг сольно`,
  epaperSendKanjiRangeMessage: (ssid, password, host, from, to, count) =>
    `1. Утасны Wi-Fi-аас «${ssid}»-д холбогдоно уу (нууц үг: ${password})\n` +
    `2. Апп руугаа буцаж илгээнэ үү\n\n` +
    `Хаяг: ${host}\n` +
    `Ханз: ${from}–${to} (${count})` +
    `\n※Төхөөрөмжийн жагсаалтыг сольно`,
  epaperSendKanjiSuccess: (n) => `${n} ханзыг e-Paper рүү илгээлээ`,
  epaperSendKanjiSuccessTruncated: (sent, total, max) =>
    `${sent} ханз илгээлээ (${total}-аас дээд ${max})`,

  settingsTitle: 'Тохиргоо',
  settingsDictionaryInfo: 'Толь бичгийн мэдээлэл',
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
  settingsFavoritesCount: 'Дуртай үгийн тоо',
  settingsResetFavorites: 'Дуртайг цэвэрлэх',
  settingsResetTitle: 'Дуртайг цэвэрлэх',
  settingsResetMessage: 'Бүх дуртай үгийг устгах уу?',
  settingsEpaper: 'e-Paper',
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
  examples: 'Жишээ өгүүлбэр',
  kanji: 'Ханз',
  showMeaning: 'Утгыг харах',
  onReadingShort: 'Он',
  kunReadingShort: 'Кун',
  kanjiDetailA11y: (char) => `${char}-ийн дэлгэрэнгүй`,

  back: 'Буцах',
  addFavorite: 'Дуртайд нэмэх',
  removeFavorite: 'Дуртайгаас хасах',

  kanjiNotFound: 'Ханз олдсонгүй',
  strokes: 'Зураас',
  jlpt: 'JLPT',
  grade: 'Анги',
  radical: 'Үндэс',
  readings: 'Уншилт',
  onYomi: 'Онъёми',
  kunYomi: 'Кунъёми',
  mongolianMeanings: 'Монгол утга',
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
