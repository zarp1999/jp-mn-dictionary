import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { COLORS } from '../constants/colors';

const MENU_ITEMS = [
  { name: 'Search', label: '検索', icon: '🔍' },
  { name: 'Favorites', label: 'お気に入り', icon: '⭐' },
  { name: 'Settings', label: '設定', icon: '⚙️' },
];

export default function DrawerContent({ state, navigation, favoritesCount }) {
  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      {MENU_ITEMS.map((item, index) => {
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

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.primaryLight,
  },
  itemIcon: {
    fontSize: 20,
    width: 28,
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  itemLabelActive: {
    color: COLORS.primaryText,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
});
