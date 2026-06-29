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

  const suffix = translation ? `: ${translation}` : null;

  if (segments && !failed) {
    return (
      <View style={styles.container}>
        <FuriganaText segments={segments} suffix={suffix} />
      </View>
    );
  }

  return (
    <Text style={styles.fallback}>
      {japanese}
      {suffix ?? ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  fallback: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
});
