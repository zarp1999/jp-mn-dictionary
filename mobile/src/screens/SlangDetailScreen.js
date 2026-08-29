import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import ExampleSentence from '../components/ExampleSentence';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { formatSlangTags, getSlangById } from '../utils/slang';

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
    term: {
      fontSize: 26,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 34,
    },
    reading: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    tags: {
      marginTop: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tag: {
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primaryText,
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
    sourceLink: {
      marginTop: 10,
      fontSize: 15,
      fontWeight: '500',
      color: colors.primaryText,
    },
  });
}

export default function SlangDetailScreen({ navigation, route }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slang = getSlangById(route.params?.slangId);

  const handleOpenSource = useCallback(() => {
    const url = slang?.source_url;
    if (!url) {
      return;
    }
    Linking.openURL(url).catch((error) => {
      console.warn('Failed to open slang source', error);
    });
  }, [slang]);

  if (!slang) {
    return null;
  }

  const meaningEn = slang.meaning_en || '';
  const meaningMn = slang.meaning_mn || '';
  const noteEn = slang.note_en || '';
  const noteMn = slang.note_mn || '';
  const reading = slang.reading && slang.reading !== slang.term ? slang.reading : '';
  const examples = (slang.examples || []).filter((example) => example.jp);
  const tags = formatSlangTags(slang);

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
          <Text style={styles.term}>{slang.term}</Text>
          {reading ? <Text style={styles.reading}>{reading}</Text> : null}
          {tags.length > 0 ? (
            <View style={styles.tags}>
              {tags.map((tag, index) => (
                <View key={`${tag}-${index}`} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {meaningEn || meaningMn ? (
          <View style={[styles.card, styles.meaningCard]}>
            <Text style={styles.label}>{t('grammarMeaning')}</Text>
            {meaningMn ? (
              <Text style={styles.meaningText}>{meaningMn}</Text>
            ) : null}
            {meaningEn ? (
              <Text style={meaningMn ? styles.meaningMn : styles.meaningText}>
                {meaningEn}
              </Text>
            ) : null}
          </View>
        ) : null}

        {noteEn || noteMn ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('grammarNote')}</Text>
            {noteMn ? (
              <Text style={styles.body}>{noteMn}</Text>
            ) : null}
            {noteEn ? (
              <Text style={[styles.body, noteMn ? styles.bodyFollow : null]}>
                {noteEn}
              </Text>
            ) : null}
          </View>
        ) : null}

        {examples.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('examples')}</Text>
            {examples.map((example, index) => (
              <ExampleSentence
                key={`${slang.id}-${index}`}
                japanese={example.jp}
                translation={example.mn || example.en || ''}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('grammarSource')}</Text>
          <Text style={styles.body}>{t('slangAttribution')}</Text>
          {slang.source_url ? (
            <TouchableOpacity onPress={handleOpenSource} accessibilityRole="link">
              <Text style={styles.sourceLink}>{t('slangOpenSource')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
