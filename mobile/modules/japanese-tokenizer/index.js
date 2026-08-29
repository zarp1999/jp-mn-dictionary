import { requireOptionalNativeModule } from 'expo-modules-core';

const JapaneseTokenizer = requireOptionalNativeModule('JapaneseTokenizer');

export function isNativeTokenizerAvailable() {
  return JapaneseTokenizer != null;
}

export async function tokenizeNative(text) {
  if (!JapaneseTokenizer) {
    return null;
  }
  return JapaneseTokenizer.tokenize(text);
}
