import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  ScrollView,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { useLocale } from '../i18n/LocaleContext';
import { LOCALES } from '../i18n/translations';
import { useTheme, THEMES } from '../theme/ThemeContext';
import { EPAPER_WIFI_PASSWORD, EPAPER_WIFI_SSID } from '../utils/epaperSync';
import { openEpaperShop } from '../utils/epaperIntro';
import { useEpaperIntro } from '../theme/EpaperIntroContext';

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
    languageControl: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    flagImage: {
      width: 36,
      height: 24,
      borderRadius: 4,
    },
  });
}

export default function SettingsScreen({ favoritesCount, onClearFavorites }) {
  const { locale, toggleLocale, t } = useLocale();
  const { colors, isDark, setTheme } = useTheme();
  const { resetIntro } = useEpaperIntro();
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

      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settingsAppearance')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('settingsTheme')}</Text>
              <View style={styles.themeControl}>
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
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.row}
              onPress={toggleLocale}
              accessibilityLabel={
                locale === LOCALES.ja
                  ? t('switchToMongolian')
                  : t('switchToJapanese')
              }
            >
              <Text style={styles.rowLabel}>{t('settingsLanguage')}</Text>
              <View style={styles.languageControl}>
                <Image
                  source={
                    locale === LOCALES.ja
                      ? require('../../assets/images/flags/flag-jp.png')
                      : require('../../assets/images/flags/flag-mn.png')
                  }
                  style={styles.flagImage}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settingsEpaper')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('settingsEpaperWifi')}</Text>
              <Text style={styles.rowValue}>{EPAPER_WIFI_SSID}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('settingsEpaperPassword')}</Text>
              <Text style={styles.rowValue}>{EPAPER_WIFI_PASSWORD}</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                openEpaperShop().catch(() => {});
              }}
              accessibilityRole="link"
              accessibilityLabel={t('settingsEpaperShop')}
            >
              <Text style={styles.rowLabel}>{t('settingsEpaperShop')}</Text>
              <Text style={styles.rowValue}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.row}
              onPress={async () => {
                await resetIntro();
                Alert.alert(t('settingsEpaper'), t('settingsEpaperShowIntroDone'));
              }}
              accessibilityRole="button"
              accessibilityLabel={t('settingsEpaperShowIntro')}
            >
              <Text style={styles.rowLabel}>{t('settingsEpaperShowIntro')}</Text>
            </TouchableOpacity>
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
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 32 }]}>
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
      </ScrollView>
    </SafeAreaView>
  );
}
