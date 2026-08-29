import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import SlangCard from '../components/SlangCard';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { getAllSlang, searchSlang } from '../utils/slang';

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
      paddingBottom: 0,
    },
    searchWrap: {
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
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
    count: {
      marginTop: 8,
      fontSize: 12,
      color: colors.textTertiary,
    },
    list: {
      paddingBottom: 24,
    },
    empty: {
      paddingHorizontal: 24,
      paddingTop: 40,
      fontSize: 15,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  });
}

export default function SlangListScreen({ navigation }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const items = useMemo(() => getAllSlang(), []);
  const visibleItems = useMemo(
    () => searchSlang(items, query),
    [items, query],
  );

  const handlePress = useCallback((item) => {
    navigation.navigate('SlangDetail', { slangId: item.id });
  }, [navigation]);

  const renderItem = useCallback(({ item, index }) => (
    <SlangCard
      item={item}
      index={index}
      onPress={() => handlePress(item)}
      accessibilityLabel={t('slangItemA11y', item.term)}
    />
  ), [handlePress, t]);

  const keyExtractor = useCallback((item) => item.id, []);

  const emptyText = query.trim()
    ? t('slangSearchNotFound', query.trim())
    : t('slangEmpty');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader title={t('slangTitle')} compact />
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('slangSearchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.count}>{t('slangCount', visibleItems.length)}</Text>
      </View>

      {visibleItems.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <FlatList
          data={visibleItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
