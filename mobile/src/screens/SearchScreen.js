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
} from 'react-native';
import { searchWords, warmUpDictionarySearch } from '../utils/dictionary';
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
    navigation.navigate('WordDetail', { word });
  }, [navigation]);

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
