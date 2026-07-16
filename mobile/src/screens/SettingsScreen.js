import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/colors';
import ScreenHeader from '../components/ScreenHeader';
import { useLocale } from '../i18n/LocaleContext';

export default function SettingsScreen({ favoritesCount, onClearFavorites }) {
  const { t } = useLocale();

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
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
    color: COLORS.textPrimary,
  },
  rowValue: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginLeft: 14,
  },
  danger: {
    color: '#D0312D',
  },
});
