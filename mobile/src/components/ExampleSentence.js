import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import FuriganaText from './FuriganaText';
import { getFuriganaSegments, parseExample } from '../utils/furigana';

export default function ExampleSentence({ text }) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  japanese: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  translation: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
});
