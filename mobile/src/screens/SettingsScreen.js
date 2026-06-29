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

export default function SettingsScreen({ favoritesCount, onClearFavorites }) {
  const handleClearFavorites = () => {
    Alert.alert(
      'お気に入りをリセット',
      'すべてのお気に入りを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: onClearFavorites },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader title="設定" compact />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>辞書情報</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>辞書名</Text>
            <Text style={styles.rowValue}>日・モンゴル語辞典</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>収録数</Text>
            <Text style={styles.rowValue}>18,947語</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>出典</Text>
            <Text style={styles.rowValue}>東北大学・栗林均</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>データ</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>お気に入り件数</Text>
            <Text style={styles.rowValue}>{favoritesCount}件</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleClearFavorites}>
            <Text style={[styles.rowLabel, styles.danger]}>お気に入りをリセット</Text>
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
