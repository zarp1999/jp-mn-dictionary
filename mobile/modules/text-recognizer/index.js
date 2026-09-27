/**
 * 【機能・ネイティブ橋】text-recognizer モジュールの JS 側入口
 *
 * 役割:
 *   - iOS の TextRecognizerModule.swift（Apple Vision）を JS から呼ぶ
 *   - 画面でもない。OCR の「実体」への薄いラッパー
 *
 * Expo Go ではネイティブが入っていないため TextRecognizer は null になる。
 * 本番 / preview / development ビルドでのみ OCR が動く。
 *
 * 呼び出し元: src/utils/textRecognition.js
 */
import { requireOptionalNativeModule } from 'expo-modules-core';

// ネイティブモジュール名は Swift 側の Name("TextRecognizer") と一致させる
const TextRecognizer = requireOptionalNativeModule('TextRecognizer');

/** ネイティブ OCR がリンクされているか */
export function isTextRecognizerAvailable() {
  return TextRecognizer != null;
}

/** 端末が対応している認識言語の一覧（例: ja-JP, en-US） */
export async function getSupportedLanguages() {
  if (!TextRecognizer) {
    return [];
  }
  return TextRecognizer.getSupportedLanguages();
}

/**
 * 画像ファイルから文字を認識する。
 * @param {string} uri - file:// などのローカル URI
 * @param {object} [options] - languages など（Swift の RecognizeOptions）
 * @returns {Promise<object|null>} text / blocks / supportsJapanese など
 */
export async function recognize(uri, options = {}) {
  if (!TextRecognizer) {
    return null;
  }
  return TextRecognizer.recognize(uri, options);
}
