import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import WordCard from '../components/WordCard';
import ScreenHeader from '../components/ScreenHeader';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';

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
    count: {
      fontSize: 12,
      color: colors.textTertiary,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      fontWeight: '500',
    },
    list: {
      paddingBottom: 20,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 60,
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textTertiary,
      marginBottom: 6,
    },
    emptySubText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
  });
}

export default function FavoritesScreen({ navigation, favorites, onToggleFavorite }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const favoriteList = Object.values(favorites);

  const handlePressWord = useCallback((word) => {
    navigation.navigate('WordDetail', { word });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader title={t('favoritesTitle')} compact />
      </View>

      {favoriteList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyText}>{t('favoritesEmpty')}</Text>
          <Text style={styles.emptySubText}>{t('favoritesEmptySub')}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.count}>{t('favoritesCount', favoriteList.length)}</Text>
          <FlatList
            data={favoriteList}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <WordCard
                word={item}
                index={index}
                isFavorite
                onPress={() => handlePressWord(item)}
                onToggleFavorite={onToggleFavorite}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}
