import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';

export default function ScreenHeader({ title, rightElement, compact = false }) {
  const navigation = useNavigation();

  return (
    <View style={[styles.titleRow, compact && styles.titleRowCompact]}>
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => navigation.openDrawer()}
        accessibilityLabel="メニューを開く"
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

const styles = StyleSheet.create({
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
    color: COLORS.textPrimary,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  rightSlot: {
    width: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightSpacer: {
    width: 56,
  },
});
