import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      paddingTop: 56,
      paddingHorizontal: 12,
      paddingBottom: 24,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderRadius: 10,
      marginBottom: 4,
    },
    itemActive: {
      backgroundColor: colors.primaryLight,
    },
    itemIcon: {
      fontSize: 20,
      width: 28,
    },
    itemLabel: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    itemLabelActive: {
      color: colors.primaryText,
      fontWeight: '600',
    },
    badge: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: '600',
    },
  });
}

export default function DrawerContent({ state, navigation, favoritesCount }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const menuItems = [
    { name: 'Search', label: t('navSearch'), icon: '🔍' },
    { name: 'Favorites', label: t('navFavorites'), icon: '⭐' },
    { name: 'Settings', label: t('navSettings'), icon: '⚙️' },
  ];

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      {menuItems.map((item, index) => {
        const active = state.index === index;

        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => navigation.navigate(item.name)}
          >
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
              {item.label}
            </Text>
            {item.name === 'Favorites' && favoritesCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{favoritesCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </DrawerContentScrollView>
  );
}
