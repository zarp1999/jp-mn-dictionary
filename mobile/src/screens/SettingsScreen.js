import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme, THEMES } from '../theme/ThemeContext';

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
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionLabel: {
      fontSize: 12,
      color: colors.textTertiary,
      fontWeight: '500',
      letterSpacing: 0.5,
      marginBottom: 8,
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    rowLabel: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    rowValue: {
      fontSize: 15,
      color: colors.textSecondary,
      flexShrink: 1,
      textAlign: 'right',
      marginLeft: 12,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.border,
      marginLeft: 14,
    },
    danger: {
      color: colors.danger,
    },
    themeControl: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
  });
}

export default function SettingsScreen({ favoritesCount, onClearFavorites }) {
  const { t } = useLocale();
  const { colors, isDark, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleThemeToggle = (enabled) => {
    setTheme(enabled ? THEMES.dark : THEMES.light);
  };

  const handleClearFavorites = () => {
    Alert.alert(
      t('settingsResetTitle'),
      t('settingsResetMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: onClearFavorites },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader title={t('settingsTitle')} compact />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settingsAppearance')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsTheme')}</Text>
            <View style={styles.themeControl}>
              <Text style={styles.rowValue}>
                {isDark ? t('themeDark') : t('themeLight')}
              </Text>
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
                accessibilityLabel={
                  isDark ? t('themeDark') : t('themeLight')
                }
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settingsDictionaryInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsDictionaryName')}</Text>
            <Text style={styles.rowValue}>{t('settingsDictionaryNameValue')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsEntryCount')}</Text>
            <Text style={styles.rowValue}>{t('settingsEntryCountValue')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsSource')}</Text>
            <Text style={styles.rowValue}>{t('settingsSourceValue')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settingsData')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settingsFavoritesCount')}</Text>
            <Text style={styles.rowValue}>{t('favoritesCount', favoritesCount)}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleClearFavorites}>
            <Text style={[styles.rowLabel, styles.danger]}>
              {t('settingsResetFavorites')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
