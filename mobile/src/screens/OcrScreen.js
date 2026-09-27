/**
 * 【画面】写真から検索（OCR）の画面
 *
 * 役割:
 *   - ボタン・写真プレビュー・認識した行・単語チップなど「見た目」と「タップ操作」を担当
 *   - 重い処理（OCR・形態素解析・辞書検索）は下の util / モジュールに任せる
 *
 * 流れ:
 *   1. 「カメラで撮る」または「写真を選ぶ」→ recognizeImageText
 *      （横書きは上→下、縦書きは右列→左列。ふりがなは落とす）
 *   2. 行をタップ → getLookupTerms（kuromojiTokenizer.js）で単語に分割
 *   3. 単語をタップ → searchWordsFast（dictionary.js）→ WordDetail 画面へ
 *
 * 関連ファイル:
 *   - ../utils/textRecognition.js … 写真選択・OCR（機能）
 *   - ../navigation/OcrStack.js … この画面と詳細画面の画面遷移
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import {
  isOcrAvailable,
  pickImageFromLibrary,
  pickImageFromCamera,
  recognizeImageText,
  PICK_RESULT,
  WRITING_MODE_PREFERENCE,
} from '../utils/textRecognition';
import { getLookupTerms } from '../utils/kuromojiTokenizer';
import { searchWordsFast } from '../utils/dictionary';

/** テーマ色から StyleSheet を作る（見た目の定義） */
function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 40,
    },
    btnRow: {
      flexDirection: 'row',
      gap: 10,
    },
    primaryBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    secondaryBtn: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.primary,
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryBtnText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
    modeRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },
    modeChip: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: colors.border,
      backgroundColor: colors.white,
      alignItems: 'center',
    },
    modeChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    modeChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modeChipTextActive: {
      color: colors.primaryText,
    },
    preview: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginTop: 16,
      backgroundColor: colors.white,
      resizeMode: 'contain',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 20,
    },
    termsStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
      marginBottom: 16,
    },
    statusText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    errorText: {
      fontSize: 14,
      color: colors.danger,
      marginTop: 16,
      textAlign: 'center',
      lineHeight: 20,
    },
    sectionLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 10,
      marginLeft: 4,
    },
    lineRow: {
      backgroundColor: colors.white,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      marginBottom: 8,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    lineRowActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    lineText: {
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 24,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
      marginBottom: 16,
    },
    chip: {
      backgroundColor: colors.white,
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipText: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    chipEmpty: {
      fontSize: 13,
      color: colors.textTertiary,
      marginTop: 10,
      marginBottom: 16,
    },
    termsPanel: {
      marginBottom: 8,
    },
  });
}

export default function OcrScreen({ navigation }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // --- 画面の状態（UI が参照するデータ） ---
  const [imageUri, setImageUri] = useState(null); // 選んだ写真のパス
  const [lines, setLines] = useState([]); // OCR で読み取った行テキストの配列
  const [activeLine, setActiveLine] = useState(null); // タップ中の行のインデックス
  const [terms, setTerms] = useState([]); // その行から切り出した単語（チップ）
  const [isRecognizing, setIsRecognizing] = useState(false); // OCR 処理中
  const [isLookingUp, setIsLookingUp] = useState(false); // 形態素解析中
  const [error, setError] = useState(null);
  const [writingModePref, setWritingModePref] = useState(
    WRITING_MODE_PREFERENCE.auto,
  );
  const skipModeRerunRef = useRef(false);

  // ネイティブ OCR が使えるか（Expo Go では false）
  const available = isOcrAvailable();

  const runOcrOnUri = useCallback(async (uri, { failedKey } = {}) => {
    setLines([]);
    setActiveLine(null);
    setTerms([]);
    setIsRecognizing(true);
    setError(null);

    try {
      const result = await recognizeImageText(uri, {
        writingModePreference: writingModePref,
      });
      if (!result) {
        setError(t('ocrUnavailable'));
        return;
      }
      if (!result.supportsJapanese) {
        setError(t('ocrJapaneseUnsupported'));
      }
      if (result.lines.length === 0 && result.rawBlockCount > 0) {
        setError(t('ocrLayoutEmpty'));
      }
      setLines(result.lines);
    } catch (e) {
      setError(t(failedKey || 'ocrRecognizeFailed'));
    } finally {
      setIsRecognizing(false);
    }
  }, [t, writingModePref]);

  const runOcrOnPickedImage = useCallback(async (picked, { deniedKey, failedKey }) => {
    if (picked.status === PICK_RESULT.denied) {
      setError(t(deniedKey));
      return;
    }
    if (picked.status !== PICK_RESULT.picked) {
      return;
    }

    skipModeRerunRef.current = true;
    setImageUri(picked.uri);
    await runOcrOnUri(picked.uri, { failedKey });
  }, [runOcrOnUri, t]);

  useEffect(() => {
    if (!imageUri || skipModeRerunRef.current) {
      skipModeRerunRef.current = false;
      return;
    }
    runOcrOnUri(imageUri);
  }, [writingModePref, imageUri, runOcrOnUri]);

  /** カメラで撮影 → OCR */
  const handleTakePhoto = useCallback(async () => {
    setError(null);

    let picked;
    try {
      picked = await pickImageFromCamera();
    } catch (e) {
      setError(t('ocrCameraFailed'));
      return;
    }

    await runOcrOnPickedImage(picked, {
      deniedKey: 'ocrCameraPermissionDenied',
      failedKey: 'ocrRecognizeFailed',
    });
  }, [runOcrOnPickedImage, t]);

  /** アルバムから選択 → OCR */
  const handlePickImage = useCallback(async () => {
    setError(null);

    let picked;
    try {
      picked = await pickImageFromLibrary();
    } catch (e) {
      setError(t('ocrPickFailed'));
      return;
    }

    await runOcrOnPickedImage(picked, {
      deniedKey: 'ocrPermissionDenied',
      failedKey: 'ocrRecognizeFailed',
    });
  }, [runOcrOnPickedImage, t]);

  /**
   * 認識した「行」をタップしたとき
   * その行の日本語を形態素解析し、辞書に引ける単語チップを表示する
   */
  const handlePressLine = useCallback(async (line, index) => {
    // 同じ行をもう一度タップしたら閉じる
    if (activeLine === index) {
      setActiveLine(null);
      setTerms([]);
      return;
    }

    setActiveLine(index);
    setTerms([]);
    setIsLookingUp(true);

    try {
      const lookupTerms = await getLookupTerms(line);
      setTerms([...new Set(lookupTerms)]);
    } catch (e) {
      setTerms([]);
    } finally {
      setIsLookingUp(false);
    }
  }, [activeLine]);

  /**
   * 単語チップをタップしたとき
   * 既存の辞書検索で最初のヒットを取り、単語詳細画面へ遷移する
   */
  const handlePressTerm = useCallback(async (term) => {
    try {
      const results = await searchWordsFast(term, 'jp-mn', 10);
      if (results?.length) {
        navigation.navigate('WordDetail', { word: results[0] });
        return;
      }
      setError(t('searchNotFound', term));
    } catch (e) {
      setError(t('searchFailed'));
    }
  }, [navigation, t]);

  // --- ここから下が JSX（実際に描画する UI） ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader title={t('ocrTitle')} compact />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* OCR が使える端末だけカメラ / アルバムボタンを出す */}
        {available ? (
          <>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleTakePhoto}
                accessibilityRole="button"
                accessibilityLabel={t('ocrTakePhoto')}
              >
                <Text style={styles.primaryBtnText}>{t('ocrTakePhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handlePickImage}
                accessibilityRole="button"
                accessibilityLabel={t('ocrPickImage')}
              >
                <Text style={styles.secondaryBtnText}>{t('ocrPickImage')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modeRow}>
              {[
                WRITING_MODE_PREFERENCE.auto,
                WRITING_MODE_PREFERENCE.horizontal,
                WRITING_MODE_PREFERENCE.vertical,
              ].map((mode) => {
                const active = writingModePref === mode;
                const labelKey =
                  mode === WRITING_MODE_PREFERENCE.auto
                    ? 'ocrWritingModeAuto'
                    : mode === WRITING_MODE_PREFERENCE.horizontal
                      ? 'ocrWritingModeHorizontal'
                      : 'ocrWritingModeVertical';
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeChip, active && styles.modeChipActive]}
                    onPress={() => setWritingModePref(mode)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t(labelKey)}
                  >
                    <Text
                      style={[
                        styles.modeChipText,
                        active && styles.modeChipTextActive,
                      ]}
                    >
                      {t(labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.errorText}>{t('ocrUnavailable')}</Text>
        )}

        {/* 選んだ写真のプレビュー */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : null}

        {isRecognizing ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>{t('ocrRecognizing')}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isRecognizing && imageUri && lines.length === 0 && !error ? (
          <Text style={styles.errorText}>{t('ocrNoTextFound')}</Text>
        ) : null}

        {/* 読み取った行の一覧。タップすると下に単語チップが出る */}
        {lines.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{t('ocrRecognizedText')}</Text>
            {lines.map((line, index) => (
              <View key={`${index}-${line}`}>
                <TouchableOpacity
                  style={[
                    styles.lineRow,
                    activeLine === index && styles.lineRowActive,
                  ]}
                  onPress={() => handlePressLine(line, index)}
                  accessibilityRole="button"
                  accessibilityLabel={t('ocrLineA11y', line)}
                >
                  <Text style={styles.lineText}>{line}</Text>
                </TouchableOpacity>

                {activeLine === index ? (
                  <View style={styles.termsPanel}>
                    {isLookingUp ? (
                      <View style={styles.termsStatusRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    ) : terms.length > 0 ? (
                      <View style={styles.chipRow}>
                        {terms.map((term) => (
                          <TouchableOpacity
                            key={term}
                            style={styles.chip}
                            onPress={() => handlePressTerm(term)}
                            accessibilityRole="button"
                            accessibilityLabel={t('ocrTermA11y', term)}
                          >
                            <Text style={styles.chipText}>{term}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.chipEmpty}>{t('ocrNoWordsInLine')}</Text>
                    )}
                  </View>
                ) : null}
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
