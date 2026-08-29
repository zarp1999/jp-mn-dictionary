import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { meaningsToText } from '../utils/meaningOverrides';

function createStyles(colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.white,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      maxHeight: '80%',
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    input: {
      minHeight: 120,
      maxHeight: 220,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.bg,
      textAlignVertical: 'top',
    },
    hint: {
      marginTop: 8,
      fontSize: 12,
      color: colors.textTertiary,
      lineHeight: 18,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 16,
    },
    btn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
    },
    btnSecondary: {
      backgroundColor: colors.bg,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
    },
    btnDanger: {
      backgroundColor: colors.bg,
    },
    btnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    btnTextPrimary: {
      color: '#FFFFFF',
    },
    btnTextDanger: {
      color: colors.danger,
    },
  });
}

export default function MeaningEditModal({
  visible,
  title,
  initialMeanings,
  hasOverride,
  onSave,
  onReset,
  onClose,
}) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) {
      setText(meaningsToText(initialMeanings));
    }
  }, [visible, initialMeanings]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            multiline
            placeholder={t('meaningEditPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />
          <Text style={styles.hint}>{t('meaningEditHint')}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={onClose}
            >
              <Text style={styles.btnText}>{t('cancel')}</Text>
            </TouchableOpacity>
            {hasOverride ? (
              <TouchableOpacity
                style={[styles.btn, styles.btnDanger]}
                onPress={() => onReset?.()}
              >
                <Text style={[styles.btnText, styles.btnTextDanger]}>
                  {t('resetMeaning')}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => onSave?.(text)}
            >
              <Text style={[styles.btnText, styles.btnTextPrimary]}>
                {t('saveMeaning')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
