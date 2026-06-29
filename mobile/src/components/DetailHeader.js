import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function DetailHeader({ onBack, isFavorite, onToggleFavorite }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.sideBtn}
        onPress={onBack}
        accessibilityLabel="戻る"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.sideBtn}
        onPress={onToggleFavorite}
        accessibilityLabel={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.star}>{isFavorite ? '⭐' : '☆'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sideBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  star: {
    fontSize: 24,
  },
  spacer: {
    flex: 1,
  },
});
