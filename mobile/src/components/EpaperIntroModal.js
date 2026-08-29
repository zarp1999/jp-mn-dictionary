import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { openEpaperShop } from '../utils/epaperIntro';

function createStyles(colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 16,
      overflow: 'hidden',
    },
    photo: {
      width: '100%',
      height: 200,
      backgroundColor: colors.bg,
    },
    body: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    paragraph: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    actions: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 16,
      gap: 8,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    buyBtn: {
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    buyBtnText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryBtn: {
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryBtnText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '500',
    },
  });
}

export default function EpaperIntroModal({ visible, onHasDevice, onClose }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Image
            source={require('../../assets/images/epaper-wordbook.jpeg')}
            style={styles.photo}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.body}>
            <Text style={styles.title}>{t('epaperIntroTitle')}</Text>
            <Text style={styles.paragraph}>{t('epaperIntroBody1')}</Text>
            <Text style={styles.paragraph}>{t('epaperIntroBody2')}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onHasDevice}
              accessibilityRole="button"
              accessibilityLabel={t('epaperIntroHasDevice')}
            >
              <Text style={styles.primaryBtnText}>{t('epaperIntroHasDevice')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buyBtn}
              onPress={() => {
                openEpaperShop().catch(() => {});
              }}
              accessibilityRole="link"
              accessibilityLabel={t('epaperIntroBuy')}
            >
              <Text style={styles.buyBtnText}>{t('epaperIntroBuy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('epaperIntroClose')}
            >
              <Text style={styles.secondaryBtnText}>{t('epaperIntroClose')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
