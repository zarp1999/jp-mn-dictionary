/**
 * 【機能】写真から検索まわりの処理（画面ではない）
 *
 * 役割:
 *   - アルバムから写真を選ぶ / カメラで撮影する
 *   - ネイティブ OCR（text-recognizer）を呼び出して文字を取り出す
 *   - 横書き / 縦書きの読み順とふりがな除去は textRecognitionLayout.js
 *
 * 画面（OcrScreen.js）から呼ばれる。UI の描画はしない。
 *
 * 関連:
 *   - modules/text-recognizer … iOS の Apple Vision を叩くネイティブ橋
 *   - utils/textRecognitionLayout.js … 読み順・ふりがな
 *   - screens/OcrScreen.js … この結果を表示する画面
 */
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { isTextRecognizerAvailable, recognize } from 'text-recognizer';
import {
  dropFuriganaBlocks,
  layoutRecognizedBlocks,
  layoutRecognizedBlocksWithFallback,
  WRITING_MODE_PREFERENCE,
} from './textRecognitionLayout';

export { dropFuriganaBlocks, layoutRecognizedBlocks, layoutRecognizedBlocksWithFallback };
export {
  WRITING_MODE,
  WRITING_MODE_PREFERENCE,
  detectWritingMode,
} from './textRecognitionLayout';

/** OCR に優先して渡す言語（日本語 → 英語） */
const OCR_LANGUAGES = ['ja-JP', 'en-US'];

/** pickImageFromLibrary / pickImageFromCamera の戻り値 status */
export const PICK_RESULT = {
  picked: 'picked', // 画像を取得した
  canceled: 'canceled', // キャンセル
  denied: 'denied', // 権限なし
};

function normalizePickResult(result) {
  if (result.canceled) {
    return { status: PICK_RESULT.canceled };
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    return { status: PICK_RESULT.canceled };
  }

  return {
    status: PICK_RESULT.picked,
    uri: asset.uri,
    width: asset.width ?? null,
    height: asset.height ?? null,
  };
}

/** 端末に OCR ネイティブモジュールが入っているか（Expo Go では false） */
export function isOcrAvailable() {
  return isTextRecognizerAvailable();
}

/**
 * アルバムから画像を1枚選ぶ。
 * @returns {{ status, uri?, width?, height? }}
 */
export async function pickImageFromLibrary() {
  // iOS の PHPicker は権限不要。Android は読み取り許可が必要。
  if (Platform.OS === 'android') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return { status: PICK_RESULT.denied };
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 1,
  });

  return normalizePickResult(result);
}

/**
 * カメラで画像を1枚撮る。
 * @returns {{ status, uri?, width?, height? }}
 */
export async function pickImageFromCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { status: PICK_RESULT.denied };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
  });

  return normalizePickResult(result);
}

/**
 * 画像 URI から文字を認識し、行テキストの配列などを返す。
 * @param {string} uri - ローカル画像の file URI
 * @param {{
 *   dropFurigana?: boolean,
 *   dropFuriganaForVertical?: boolean,
 *   writingModePreference?: 'auto' | 'horizontal' | 'vertical',
 * }} [options]
 * @returns {Promise<object|null>} lines / blocks など。モジュールが無い場合は null
 */
export async function recognizeImageText(uri, options = {}) {
  if (!isTextRecognizerAvailable()) {
    return null;
  }

  // ネイティブ（Swift / Apple Vision）を呼び出し
  const result = await recognize(uri, { languages: OCR_LANGUAGES });
  if (!result) {
    return null;
  }

  const blocks = Array.isArray(result.blocks) ? result.blocks : [];
  const layout = layoutRecognizedBlocksWithFallback(blocks, {
    dropFurigana: options.dropFurigana !== false,
    dropFuriganaForVertical: options.dropFuriganaForVertical === true,
    writingModePreference:
      options.writingModePreference ?? WRITING_MODE_PREFERENCE.auto,
  });
  const lines = layout.lines ?? [];

  return {
    blocks: layout.blocks, // 画面表示用（ふりがな除去・読み順のあと）
    allBlocks: blocks, // 除去前（デバッグ用）
    lines, // 行ごとの文字列（OcrScreen がリスト表示）
    text: lines.join('\n'),
    writingMode: layout.writingMode,
    usedRawFallback: layout.usedRawFallback === true,
    rawBlockCount: blocks.length,
    supportsJapanese: result.supportsJapanese !== false,
    imageWidth: result.imageWidth ?? null,
    imageHeight: result.imageHeight ?? null,
  };
}
