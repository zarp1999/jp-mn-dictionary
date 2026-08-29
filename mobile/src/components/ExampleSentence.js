import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FuriganaText from './FuriganaText';
import { getFuriganaSegments, parseExample, splitDialogueLines } from '../utils/furigana';
import { useTheme } from '../theme/ThemeContext';

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.white,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
    },
    japanese: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    japaneseLine: {
      marginTop: 6,
    },
    translation: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
      marginTop: 6,
    },
    translationFollow: {
      marginTop: 2,
    },
  });
}

function JapaneseLine({ text, style, extraStyle }) {
  const [segments, setSegments] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSegments(null);
    setFailed(false);

    if (!text) {
      return () => {
        cancelled = true;
      };
    }

    getFuriganaSegments(text)
      .then((result) => {
        if (!cancelled) {
          setSegments(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn('Furigana generation failed', error);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (segments && !failed) {
    return <FuriganaText segments={segments} />;
  }

  return <Text style={[style, extraStyle]}>{text}</Text>;
}

export default function ExampleSentence({ text, japanese: japaneseProp, translation: translationProp }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const parsed = text ? parseExample(text) : { japanese: '', translation: null };
  const japanese = japaneseProp ?? parsed.japanese;
  const translation = translationProp !== undefined ? translationProp : parsed.translation;

  const japaneseLines = useMemo(() => splitDialogueLines(japanese), [japanese]);
  const translationLines = useMemo(
    () => splitDialogueLines(translation || ''),
    [translation],
  );

  return (
    <View style={styles.card}>
      {japaneseLines.map((line, index) => (
        <View key={`jp-${index}`} style={index > 0 ? styles.japaneseLine : null}>
          <JapaneseLine text={line} style={styles.japanese} />
        </View>
      ))}
      {translationLines.map((line, index) => (
        <Text
          key={`mn-${index}`}
          style={[styles.translation, index > 0 && styles.translationFollow]}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}
