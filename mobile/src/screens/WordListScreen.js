import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { JLPT_VOCAB_LEVELS, countWordsByJlpt } from '../utils/jlptVocab';

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
      paddingTop: 20,
      paddingBottom: 32,
    },
    sectionLabel: {
      fontSize: 12,
      color: colors.textTertiary,
      fontWeight: '500',
      letterSpacing: 0.5,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLabel: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    rowCount: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 8,
    },
    chevron: {
      fontSize: 18,
      color: colors.textTertiary,
    },
  });
}

export default function WordListScreen({ navigation }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const levels = useMemo(
    () =>
      JLPT_VOCAB_LEVELS.map((level) => ({
        level,
        count: countWordsByJlpt(level),
      })),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader title={t('wordListTitle')} compact />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t('jlpt')}</Text>
        <View style={styles.card}>
          {levels.map(({ level, count }, index) => (
            <TouchableOpacity
              key={level}
              style={[styles.row, index === levels.length - 1 && styles.rowLast]}
              onPress={() =>
                navigation.navigate('WordListByLevel', { level })
              }
              accessibilityLabel={t('wordListLevelA11y', level, count)}
            >
              <Text style={styles.rowLabel}>{t('wordListLevelLabel', level)}</Text>
              <Text style={styles.rowCount}>{t('wordListCount', count)}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
