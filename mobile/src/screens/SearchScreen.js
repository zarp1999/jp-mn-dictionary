import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { searchWords, warmUpDictionarySearch } from '../utils/dictionary';
import {
  loadSearchHistory,
  addSearchHistoryItem,
  removeSearchHistoryItem,
  clearSearchHistory,
} from '../utils/searchHistory';
import WordCard from '../components/WordCard';
import ScreenHeader from '../components/ScreenHeader';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';

const SEARCH_DEBOUNCE_MS = 300;

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
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    searchIcon: {
      fontSize: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
    },
    clearBtn: {
      color: colors.textTertiary,
      fontSize: 16,
    },
    kanjiHeaderBtn: {
      minWidth: 44,
      height: 40,
      borderRadius: 8,
      paddingHorizontal: 10,
      borderWidth: 0.5,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kanjiHeaderBtnText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primaryText,
    },
    list: {
      paddingBottom: 20,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 60,
      paddingHorizontal: 24,
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textTertiary,
      marginBottom: 6,
      textAlign: 'center',
    },
    preparingText: {
      marginTop: 12,
    },
    emptySubText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    historyTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    historyClear: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.primary,
    },
    historyRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    historyRowEven: {
      backgroundColor: colors.white,
    },
    historyRowOdd: {
      backgroundColor: colors.bg,
    },
    historyLeft: {
      flex: 1,
    },
    historyHeadword: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    historyReading: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textTertiary,
    },
    historyDefinition: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    historyRemoveBtn: {
      paddingLeft: 8,
    },
    historyRemove: {
      fontSize: 16,
      color: colors.textTertiary,
    },
  });
}

export default function SearchScreen({ navigation, favorites, onToggleFavorite }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [searchError, setSearchError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;
    loadSearchHistory()
      .then((items) => {
        if (!cancelled) {
          setHistory(items);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsPreparing(true);
    warmUpDictionarySearch()
      .then(() => {
        if (!cancelled) {
          setIsPreparing(false);
          setSearchError(null);
        }
      })
      .catch((error) => {
        console.error('Dictionary warmup failed', error);
        if (!cancelled) {
          setIsPreparing(false);
          setSearchError(t('dictionaryLoadFailed'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return undefined;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    searchWords(debouncedQuery, 'jp-mn', 100)
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setIsSearching(false);
        }
      })
      .catch((error) => {
        console.error('Search failed', error);
        if (!cancelled) {
          setResults([]);
          setIsSearching(false);
          setSearchError(t('searchFailed'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, t]);

  const handleChangeText = useCallback((text) => {
    setQuery(text);
    setSearchError(null);
  }, []);

  const handlePressWord = useCallback((word) => {
    addSearchHistoryItem(word)
      .then(setHistory)
      .catch(() => {});
    navigation.navigate('WordDetail', { word });
  }, [navigation]);

  const handlePressHistoryItem = useCallback((item) => {
    setQuery(item.headword);
    setSearchError(null);
  }, []);

  const handleRemoveHistoryItem = useCallback((id) => {
    removeSearchHistoryItem(id)
      .then(setHistory)
      .catch(() => {});
  }, []);

  const handleClearHistory = useCallback(() => {
    const title = t('searchHistoryClearTitle');
    const message = t('searchHistoryClearMessage');

    if (Platform.OS === 'web') {
      const text = message ? `${title}\n\n${message}` : title;
      if (typeof window !== 'undefined' && window.confirm(text)) {
        clearSearchHistory()
          .then(setHistory)
          .catch(() => {});
      }
      return;
    }

    Alert.alert(title, message, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          clearSearchHistory()
            .then(setHistory)
            .catch(() => {});
        },
      },
    ]);
  }, [t]);

  const handleOpenKanjiSearch = useCallback(() => {
    navigation.navigate('KanjiSearch');
  }, [navigation]);

  const renderItem = useCallback(({ item, index }) => (
    <WordCard
      word={item}
      index={index}
      isFavorite={!!favorites[item.id]}
      onPress={() => handlePressWord(item)}
      onToggleFavorite={onToggleFavorite}
    />
  ), [favorites, onToggleFavorite, handlePressWord]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderHistoryItem = useCallback(({ item, index }) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        style={[styles.historyRow, isEven ? styles.historyRowEven : styles.historyRowOdd]}
        onPress={() => handlePressHistoryItem(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('searchHistoryItemA11y', item.headword)}
      >
        <View style={styles.historyLeft}>
          <Text style={styles.historyHeadword}>
            {item.headword}
            {item.reading && item.reading !== item.headword ? (
              <Text style={styles.historyReading}> [{item.reading}]</Text>
            ) : null}
          </Text>
          {item.definitions.length > 0 ? (
            <Text style={styles.historyDefinition} numberOfLines={1}>
              {item.definitions.join(', ')}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.historyRemoveBtn}
          onPress={() => handleRemoveHistoryItem(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('searchHistoryRemoveA11y', item.headword)}
        >
          <Text style={styles.historyRemove}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [handlePressHistoryItem, handleRemoveHistoryItem, styles, t]);

  const historyHeader = useMemo(() => (
    <View style={styles.historyHeader}>
      <Text style={styles.historyTitle}>{t('searchHistoryTitle')}</Text>
      <TouchableOpacity
        onPress={handleClearHistory}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('searchHistoryClear')}
      >
        <Text style={styles.historyClear}>{t('searchHistoryClear')}</Text>
      </TouchableOpacity>
    </View>
  ), [handleClearHistory, styles, t]);

  const showPreparing = isPreparing && !query.trim();
  const showSearching = Boolean(query.trim()) && (isSearching || query !== debouncedQuery);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader
          title={t('appTitle')}
          rightElement={(
            <TouchableOpacity
              style={styles.kanjiHeaderBtn}
              onPress={handleOpenKanjiSearch}
              accessibilityLabel={t('openKanjiSearch')}
            >
              <Text style={styles.kanjiHeaderBtnText}>部</Text>
            </TouchableOpacity>
          )}
        />

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={handleChangeText}
            autoCorrect={false}
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{searchError}</Text>
        </View>
      ) : showPreparing ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.emptyText, styles.preparingText]}>
            {t('dictionaryPreparing')}
          </Text>
        </View>
      ) : !query.trim() && history.length > 0 ? (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={historyHeader}
          contentContainerStyle={styles.list}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      ) : !query.trim() ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyText}>{t('searchEmptyTitle')}</Text>
          <Text style={styles.emptySubText}>{t('searchEmptySub')}</Text>
        </View>
      ) : showSearching ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('searchNotFound', debouncedQuery)}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
