import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import ExampleSentence from '../components/ExampleSentence';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import {
  getGrammarById,
  getGrammarHeadwordLine,
} from '../utils/grammar';

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: 24,
      color: colors.textPrimary,
    },
    headerSpacer: {
      flex: 1,
    },
    heroCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 20,
      marginBottom: 12,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    pattern: {
      flex: 1,
      fontSize: 26,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 34,
      marginRight: 8,
    },
    badge: {
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginTop: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primaryText,
    },
    reading: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
      marginBottom: 12,
    },
    meaningCard: {
      backgroundColor: colors.primaryLight,
    },
    label: {
      fontSize: 11,
      color: colors.primaryText,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    cardLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.textPrimary,
      lineHeight: 24,
    },
    bodyFollow: {
      marginTop: 10,
    },
    meaningText: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.primaryText,
      lineHeight: 26,
    },
    meaningMn: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.primaryText,
      lineHeight: 24,
      marginTop: 10,
    },
    section: {
      marginBottom: 8,
    },
    sectionLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 10,
      marginLeft: 4,
      textTransform: 'uppercase',
    },
  });
}

export default function GrammarDetailScreen({ navigation, route }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const grammar = getGrammarById(route.params?.grammarId);

  if (!grammar) {
    return null;
  }

  const meaningJp = grammar.meaning_jp || '';
  const meaningMn = grammar.meaning_mn || '';
  const noteJp = grammar.note_jp || '';
  const noteMn = grammar.note_mn || '';
  const reading = getGrammarHeadwordLine(grammar);
  const examples = (grammar.examples || []).filter((example) => example.jp);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('back')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.pattern}>{grammar.pattern}</Text>
            {grammar.level !== 'other' ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{grammar.level}</Text>
              </View>
            ) : null}
          </View>
          {reading ? <Text style={styles.reading}>{reading}</Text> : null}
        </View>

        {grammar.connection ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('grammarConnection')}</Text>
            <Text style={styles.body}>{grammar.connection}</Text>
          </View>
        ) : null}

        {meaningJp || meaningMn ? (
          <View style={[styles.card, styles.meaningCard]}>
            <Text style={styles.label}>{t('grammarMeaning')}</Text>
            {meaningMn ? (
              <Text style={styles.meaningText}>{meaningMn}</Text>
            ) : null}
            {meaningJp ? (
              <Text style={meaningMn ? styles.meaningMn : styles.meaningText}>
                {meaningJp}
              </Text>
            ) : null}
          </View>
        ) : null}

        {noteJp || noteMn ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('grammarNote')}</Text>
            {noteJp ? (
              <Text style={styles.body}>{noteJp}</Text>
            ) : null}
            {noteMn ? (
              <Text style={[styles.body, noteJp ? styles.bodyFollow : null]}>
                {noteMn}
              </Text>
            ) : null}
          </View>
        ) : null}

        {examples.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('examples')}</Text>
            {examples.map((example, index) => (
              <ExampleSentence
                key={`${grammar.id}-${index}`}
                japanese={example.jp}
                translation={example.mn || example.en || ''}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
