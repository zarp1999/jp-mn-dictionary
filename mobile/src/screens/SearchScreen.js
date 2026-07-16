import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { searchWords, warmUpDictionarySearch } from '../utils/dictionary';
import WordCard from '../components/WordCard';
import ScreenHeader from '../components/ScreenHeader';

const SEARCH_DEBOUNCE_MS = 300;

export default function SearchScreen({ navigation, favorites, onToggleFavorite }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [direction, setDirection] = useState('jp-mn');
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
          setSearchError('辞書の読み込みに失敗しました。再読み込みしてください。');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

    searchWords(debouncedQuery, direction, 100)
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
          setSearchError('検索に失敗しました。もう一度お試しください。');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, direction]);

  const handleChangeText = useCallback((text) => {
    setQuery(text);
    setSearchError(null);
  }, []);

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
  ), [favorites, onToggleFavorite, handlePressWord]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const showPreparing = isPreparing && !query.trim();
  const showSearching = Boolean(query.trim()) && (isSearching || query !== debouncedQuery);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader
          title="日モ辞典"
          rightElement={(
            <TouchableOpacity
              style={styles.flagBtn}
              onPress={() => setDirection(direction === 'jp-mn' ? 'mn-jp' : 'jp-mn')}
              accessibilityLabel={
                direction === 'jp-mn'
                  ? '日本語で検索。タップでモンゴル語に切り替え'
                  : 'モンゴル語で検索。タップで日本語に切り替え'
              }
            >
              <Image
                source={
                  direction === 'jp-mn'
                    ? require('../../assets/images/flags/flag-jp.png')
                    : require('../../assets/images/flags/flag-mn.png')
                }
                style={styles.flagImage}
              />
            </TouchableOpacity>
          )}
        />

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={direction === 'jp-mn' ? '日本語で検索…' : 'モンゴル語で検索…'}
            placeholderTextColor={COLORS.textTertiary}
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
          <ActivityIndicator color={COLORS.primary} />
          <Text style={[styles.emptyText, styles.preparingText]}>辞書を準備しています…</Text>
        </View>
      ) : !query.trim() ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyText}>単語を入力して検索</Text>
          <Text style={styles.emptySubText}>18,947件の日本語・モンゴル語データ</Text>
        </View>
      ) : showSearching ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>「{debouncedQuery}」は見つかりませんでした</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  clearBtn: {
    color: COLORS.textTertiary,
    fontSize: 16,
  },
  flagBtn: {
    borderRadius: 8,
    padding: 4,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  flagImage: {
    width: 48,
    height: 32,
    borderRadius: 4,
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
    color: COLORS.textTertiary,
    marginBottom: 6,
    textAlign: 'center',
  },
  preparingText: {
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
