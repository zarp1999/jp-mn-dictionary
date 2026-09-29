/**
 * 【画面】検索
 *
 * 役割: 検索バー・結果一覧・検索履歴の見た目と操作
 * 機能: utils/dictionary.js（単語検索・文貼り付け分解）, utils/grammar.js / slang.js（横断検索）, utils/searchHistory.js
 * 遷移: navigation/SearchStack.js → WordDetail など
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  Keyboard,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import {
  searchWordsFast,
  searchWordsFollowUp,
  searchWordsFromSentence,
  isSentenceLikeQuery,
  warmUpDictionarySearch,
} from '../utils/dictionary';
import { searchAllGrammar } from '../utils/grammar';
import { searchAllSlang } from '../utils/slang';
import {
  loadSearchHistory,
  addSearchHistoryItem,
  removeSearchHistoryItem,
  clearSearchHistory,
} from '../utils/searchHistory';
import WordCard from '../components/WordCard';
import GrammarCard from '../components/GrammarCard';
import SlangCard from '../components/SlangCard';
import ScreenHeader from '../components/ScreenHeader';
import HandwritingPanel from '../components/HandwritingPanel';
import { insertCandidate } from '../utils/handwriting';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';

const SEARCH_DEBOUNCE_MS = 300;
const KUROMOJI_FOLLOWUP_TIMEOUT_MS = 4000;
/** 準備 UI の最大表示時間（ms）。辞書読み込み完了前でもこの時間で検索画面を出す */
const DICTIONARY_PREPARE_UI_MAX_MS = 2000;

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
      minHeight: 44,
      gap: 8,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    searchIcon: {
      fontSize: 16,
    },
    searchInput: {
      flex: 1,
      minHeight: 44,
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

export default function SearchScreen({ navigation, route, favorites, onToggleFavorite }) {
  const { t, isMongolian } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [inputMode, setInputMode] = useState('keyboard');
  const [showInputTools, setShowInputTools] = useState(false);
  useEffect(() => {
    if (!showInputTools || inputMode !== 'handwriting') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowInputTools(false); setInputMode('keyboard'); return true;
    });
    return () => subscription.remove();
  }, [showInputTools, inputMode]);
  useFocusEffect(useCallback(() => () => {
    setShowInputTools(false); setInputMode('keyboard'); Keyboard.dismiss();
  }, []));
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [grammarResults, setGrammarResults] = useState([]);
  const [slangResults, setSlangResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [searchError, setSearchError] = useState(null);
  const [history, setHistory] = useState([]);
  const searchGenRef = useRef(0);
  const isSentenceMode = Boolean(debouncedQuery.trim()) && isSentenceLikeQuery(debouncedQuery);

  useFocusEffect(
    useCallback(() => {
      const incomingQuery = route.params?.query;
      if (!incomingQuery || typeof incomingQuery !== 'string') {
        return undefined;
      }

      searchGenRef.current += 1;
      setQuery(incomingQuery);
      setDebouncedQuery(incomingQuery);
      setSearchError(null);
      setResults([]);
      setGrammarResults([]);
      setSlangResults([]);
      setIsRefining(false);
      navigation.setParams({ query: undefined });

      return undefined;
    }, [navigation, route.params?.query]),
  );

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
    setSearchError(null);

    const hidePreparing = () => {
      if (!cancelled) {
        setIsPreparing(false);
      }
    };

    const maxTimer = setTimeout(hidePreparing, DICTIONARY_PREPARE_UI_MAX_MS);

    warmUpDictionarySearch()
      .then(() => {
        if (!cancelled) {
          setSearchError(null);
          hidePreparing();
        }
      })
      .catch((error) => {
        console.error('Dictionary warmup failed', error);
        if (!cancelled) {
          hidePreparing();
          setSearchError(t('dictionaryLoadFailed'));
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(maxTimer);
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
      setGrammarResults([]);
      setSlangResults([]);
      setIsSearching(false);
      setIsRefining(false);
      setSearchError(null);
      return undefined;
    }

    let cancelled = false;
    const refine = { timeoutId: null };
    const gen = searchGenRef.current;
    setIsSearching(true);
    setIsRefining(false);
    setSearchError(null);

    const isStale = () => cancelled || searchGenRef.current !== gen;

    if (isSentenceLikeQuery(debouncedQuery)) {
      setGrammarResults([]);
      setSlangResults([]);

      searchWordsFromSentence(debouncedQuery, 'jp-mn', 100)
        .then(({ words }) => {
          if (isStale()) {
            return;
          }
          setResults(words);
          setIsSearching(false);
        })
        .catch((error) => {
          console.error('Sentence search failed', error);
          if (!isStale()) {
            setResults([]);
            setIsSearching(false);
            setSearchError(t('searchFailed'));
          }
        });

      return () => {
        cancelled = true;
      };
    }

    const grammarHits = searchAllGrammar(debouncedQuery);
    const slangHits = searchAllSlang(debouncedQuery);
    setGrammarResults(grammarHits);
    setSlangResults(slangHits);

    searchWordsFast(debouncedQuery, 'jp-mn', 100)
      .then((data) => {
        if (isStale()) {
          return undefined;
        }

        setResults(data);
        setIsSearching(false);

        if (data.length > 0) {
          return undefined;
        }

        setIsRefining(true);
        refine.timeoutId = setTimeout(() => {
          if (!isStale()) {
            setIsRefining(false);
          }
        }, KUROMOJI_FOLLOWUP_TIMEOUT_MS);

        return searchWordsFollowUp(debouncedQuery, 'jp-mn', 100)
          .then((morph) => {
            if (refine.timeoutId) {
              clearTimeout(refine.timeoutId);
            }
            if (isStale()) {
              return;
            }
            if (morph.length > 0) {
              setResults(morph);
            }
            setIsRefining(false);
          })
          .catch((error) => {
            console.warn('Search follow-up failed', error);
            if (refine.timeoutId) {
              clearTimeout(refine.timeoutId);
            }
            if (!isStale()) {
              setIsRefining(false);
            }
          });
      })
      .catch((error) => {
        console.error('Search failed', error);
        if (!isStale()) {
          setResults([]);
          setIsSearching(false);
          setIsRefining(false);
          if (grammarHits.length === 0 && slangHits.length === 0) {
            setSearchError(t('searchFailed'));
          }
        }
      });

    return () => {
      cancelled = true;
      if (refine.timeoutId) {
        clearTimeout(refine.timeoutId);
      }
    };
  }, [debouncedQuery, t]);

  const handleChangeText = useCallback((text) => {
    if (text === query) {
      return;
    }

    searchGenRef.current += 1;
    setQuery(text);
    setSearchError(null);
    setResults([]);
    setGrammarResults([]);
    setSlangResults([]);
    setIsRefining(false);
  }, [query]);

  const handlePressWord = useCallback((word) => {
    addSearchHistoryItem(word)
      .then(setHistory)
      .catch(() => {});
    navigation.navigate('WordDetail', { word });
  }, [navigation]);

  const handlePressGrammar = useCallback((item) => {
    navigation.navigate('GrammarDetail', { grammarId: item.id });
  }, [navigation]);

  const handlePressSlang = useCallback((item) => {
    navigation.navigate('SlangDetail', { slangId: item.id });
  }, [navigation]);

  const handlePressHistoryItem = useCallback((item) => {
    handleChangeText(item.headword);
  }, [handleChangeText]);

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

  const combinedResults = useMemo(() => {
    const items = [];
    results.forEach((word, index) => {
      items.push({
        kind: 'word',
        key: `word-${word.id}`,
        word,
        index,
      });
    });
    grammarResults.forEach((grammar, index) => {
      items.push({
        kind: 'grammar',
        key: `grammar-${grammar.id}`,
        grammar,
        index: results.length + index,
      });
    });
    slangResults.forEach((slang, index) => {
      items.push({
        kind: 'slang',
        key: `slang-${slang.id}`,
        slang,
        index: results.length + grammarResults.length + index,
      });
    });
    return items;
  }, [grammarResults, slangResults, results]);

  const renderItem = useCallback(({ item }) => {
    if (item.kind === 'grammar') {
      return (
        <GrammarCard
          item={item.grammar}
          index={item.index}
          onPress={() => handlePressGrammar(item.grammar)}
          accessibilityLabel={t('grammarItemA11y', item.grammar.pattern)}
        />
      );
    }

    if (item.kind === 'slang') {
      return (
        <SlangCard
          item={item.slang}
          index={item.index}
          onPress={() => handlePressSlang(item.slang)}
          accessibilityLabel={t('slangItemA11y', item.slang.term)}
        />
      );
    }

    return (
      <WordCard
        word={item.word}
        index={item.index}
        isFavorite={!!favorites[item.word.id]}
        onPress={() => handlePressWord(item.word)}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }, [favorites, handlePressGrammar, handlePressSlang, handlePressWord, onToggleFavorite, t]);

  const keyExtractor = useCallback((item) => item.key || String(item.id), []);

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
  const isQueryPending = Boolean(query.trim()) && (query !== debouncedQuery || isSearching);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            ref={inputRef}
            onFocus={() => setShowInputTools(true)}
            showSoftInputOnFocus={inputMode === 'keyboard'}
            onSelectionChange={e => { selectionRef.current = e.nativeEvent.selection; }}
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
            <TouchableOpacity
              onPress={() => handleChangeText('')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
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
      ) : combinedResults.length > 0 ? (
        <FlatList
          data={combinedResults}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      ) : isQueryPending ? (
        <View style={styles.emptyState} />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {isSentenceMode
              ? t('searchSentenceNoWords')
              : t('searchNotFound', debouncedQuery)}
          </Text>
        </View>
      )}
      {showInputTools && <View>
        <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: .5, borderColor: colors.border }}>
          {['keyboard', 'handwriting'].map(mode => <TouchableOpacity key={mode} accessibilityRole="button" accessibilityState={{ selected: inputMode === mode }}
            style={{ flex: 1, padding: 12, minHeight: 44, alignItems: 'center' }} onPress={() => {
              setInputMode(mode);
              if (mode === 'handwriting') { inputRef.current?.blur(); Keyboard.dismiss(); }
              else { requestAnimationFrame(() => inputRef.current?.focus()); }
            }}>
            <Text style={{ color: inputMode === mode ? colors.primary : colors.textPrimary }}>
              {mode === 'keyboard' ? (isMongolian ? '⌨ Гар' : '⌨ キーボード') : (isMongolian ? '✎ Гараар бичих' : '✎ 手書き')}
            </Text>
          </TouchableOpacity>)}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={isMongolian ? 'Хаах' : '入力パネルを閉じる'} style={{ padding: 12, minWidth: 44 }} onPress={() => {
            inputRef.current?.blur(); Keyboard.dismiss(); setShowInputTools(false); setInputMode('keyboard');
          }}><Text style={{ color: colors.textPrimary }}>×</Text></TouchableOpacity>
        </View>
        {inputMode === 'handwriting' && <HandwritingPanel onCandidate={candidate => {
          const next = insertCandidate(query, selectionRef.current, candidate);
          handleChangeText(next.text); selectionRef.current = next.selection;
          inputRef.current?.setNativeProps({ selection: next.selection });
        }} />}
      </View>}
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
