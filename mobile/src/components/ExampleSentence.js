import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FuriganaText from './FuriganaText';
import { getFuriganaSegments, parseExample } from '../utils/furigana';
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
    translation: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
      marginTop: 6,
    },
  });
}

export default function ExampleSentence({ text }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { japanese, translation } = parseExample(text);
  const [segments, setSegments] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setSegments(null);
    setFailed(false);

    getFuriganaSegments(japanese)
      .then((result) => {
        if (!cancelled) {
          setSegments(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [japanese]);

  return (
    <View style={styles.card}>
      {segments && !failed ? (
        <FuriganaText segments={segments} />
      ) : (
        <Text style={styles.japanese}>{japanese}</Text>
      )}
      {translation ? (
        <Text style={styles.translation}>{translation}</Text>
      ) : null}
    </View>
  );
}
