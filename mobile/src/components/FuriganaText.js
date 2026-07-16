import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const FURIGANA_LINE_HEIGHT = 11;

function createStyles(colors) {
  return StyleSheet.create({
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
      color: colors.textTertiary,
      textAlign: 'center',
    },
    furiganaSpacer: {
      height: FURIGANA_LINE_HEIGHT,
    },
    base: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.textPrimary,
    },
    suffix: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
  });
}

export default function FuriganaText({ segments, suffix, baseStyle, furiganaStyle, suffixStyle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
