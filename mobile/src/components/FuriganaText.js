import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const FURIGANA_LINE_HEIGHT = 11;

export default function FuriganaText({ segments, suffix, baseStyle, furiganaStyle, suffixStyle }) {
  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {segments.map((segment, index) => (
        <View key={index} style={styles.ruby}>
          {segment.furigana ? (
            <Text style={[styles.furigana, furiganaStyle]}>{segment.furigana}</Text>
          ) : (
            <View style={styles.furiganaSpacer} />
          )}
          <Text style={[styles.base, baseStyle]}>{segment.text}</Text>
        </View>
      ))}

      {suffix ? (
        <Text style={[styles.suffix, suffixStyle]}>{suffix}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  ruby: {
    alignItems: 'center',
    marginRight: 1,
  },
  furigana: {
    fontSize: 9,
    lineHeight: FURIGANA_LINE_HEIGHT,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  furiganaSpacer: {
    height: FURIGANA_LINE_HEIGHT,
  },
  base: {
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  suffix: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
});
