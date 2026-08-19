import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { generateConjugations } from '../utils/conjugation';

function createStyles(colors) {
  return StyleSheet.create({
    section: {
      marginBottom: 8,
    },
    label: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 10,
      marginLeft: 4,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabRow: {
      flexDirection: 'row',
      gap: 8,
      paddingBottom: 12,
      paddingHorizontal: 2,
    },
    tab: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    tabActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.primaryText,
      fontWeight: '600',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 7,
      paddingHorizontal: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    formLabel: {
      width: 88,
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
      paddingRight: 8,
    },
    formValue: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 22,
    },
  });
}

export default function ConjugationSection({ headword }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [result, setResult] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setResult(null);
    setSelectedMood(null);

    generateConjugations(headword)
      .then((next) => {
        if (!cancelled) {
          setResult(next);
          setSelectedMood(next?.groups?.[0]?.id ?? null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [headword]);

  const activeGroup = useMemo(
    () => result?.groups?.find((group) => group.id === selectedMood) ?? null,
    [result, selectedMood],
  );

  if (!result?.groups?.length || !activeGroup) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('conjugations')}</Text>
      <View style={styles.card}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {result.groups.map((group) => {
            const active = group.id === selectedMood;
            return (
              <TouchableOpacity
                key={group.id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setSelectedMood(group.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t(`conjGroup_${group.id}`)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t(`conjGroup_${group.id}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeGroup.rows.map((row, rowIndex) => (
          <View
            key={`${activeGroup.id}-${row.id}`}
            style={[
              styles.row,
              rowIndex === activeGroup.rows.length - 1 && styles.rowLast,
            ]}
          >
            <Text style={styles.formLabel}>{t(`conj_${row.id}`)}</Text>
            <Text style={styles.formValue}>{row.form}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
