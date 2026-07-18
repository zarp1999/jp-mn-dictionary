import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import WordCard from '../components/WordCard';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import {
  searchWordsByKanjiPosition,
  getKanjiWordSearchTitleKey,
  KANJI_WORD_POSITION,
} from '../utils/kanjiWordSearch';

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
      backgroundColor: colors.white,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: 24,
      color: colors.textPrimary,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
      marginRight: 44,
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
      paddingHorizontal: 24,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}

export default function KanjiWordListScreen({
  navigation,
  route,
  favorites,
  onToggleFavorite,
}) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const character = route.params?.character || '';
  const position = route.params?.position || KANJI_WORD_POSITION.prefix;

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const titleKey = getKanjiWordSearchTitleKey(position);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    searchWordsByKanjiPosition(character, position)
      .then((words) => {
        if (!cancelled) {
          setResults(words);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Kanji word search failed', error);
        if (!cancelled) {
          setResults([]);
          setIsLoading(false);
          setLoadError(t('searchFailed'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [character, position, t]);

  const handlePressWord = useCallback((word) => {
    navigation.navigate('WordDetail', { word });
  }, [navigation]);

  const renderItem = useCallback(({ item, index }) => (
    <WordCard
      word={item}
      index={index}
      isFavorite={!!favorites[item.id]}
      onPress={() => handlePressWord(item)}
      onToggleFavorite={onToggleFavorite}
    />
  ), [favorites, handlePressWord, onToggleFavorite]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('back')}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {t(titleKey, character)}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : loadError ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('kanjiWordSearchEmpty')}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.count}>
            {t('kanjiWordSearchCount', results.length)}
          </Text>
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.list}
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}
