import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';

function createStyles(colors) {
  return StyleSheet.create({
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleRowCompact: {
      marginBottom: 0,
    },
    menuBtn: {
      width: 56,
      height: 40,
      justifyContent: 'center',
    },
    menuIcon: {
      fontSize: 24,
      color: colors.textPrimary,
    },
    title: {
      flex: 1,
      fontSize: 22,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    rightSlot: {
      minWidth: 56,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    rightSpacer: {
      width: 56,
    },
  });
}

export default function ScreenHeader({ title, rightElement, compact = false }) {
  const navigation = useNavigation();
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.titleRow, compact && styles.titleRowCompact]}>
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => navigation.openDrawer()}
        accessibilityLabel={t('openMenu')}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.rightSlot}>
        {rightElement ?? <View style={styles.rightSpacer} />}
      </View>
    </View>
  );
}
