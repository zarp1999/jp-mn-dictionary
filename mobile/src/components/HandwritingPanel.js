import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Ink from 'digital-ink';
import { strokePath } from '../utils/handwriting';
import { useLocale } from '../i18n/LocaleContext';

export default function HandwritingPanel({ onCandidate }) {
  const { isMongolian } = useLocale();
  const label = (ja, mn) => isMongolian ? mn : ja;
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [strokes, setStrokes] = useState([]);
  const [current, setCurrent] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const active = useRef([]);
  const generation = useRef(0);
  const mounted = useRef(true);
  const downloadTimer = useRef(null);
  const { height } = useWindowDimensions();
  useEffect(() => {
    mounted.current = true;
    Ink?.isReady().then(value => { if (mounted.current) setReady(value); }).catch(() => {
      if (mounted.current) setError('モデルの状態を確認できません / Загвар шалгах боломжгүй');
    });
    return () => { mounted.current = false; generation.current++; clearTimeout(downloadTimer.current); };
  }, []);
  const reset = (next = []) => {
    generation.current++; active.current = []; setCurrent([]); setStrokes(next); setCandidates([]); setBusy(false);
  };
  useEffect(() => {
    const id = ++generation.current;
    if (!ready || !strokes.length) return;
    const timer = setTimeout(async () => {
      if (!mounted.current || id !== generation.current) return;
      setBusy(true);
      try {
        const result = await Ink.recognize(strokes);
        if (mounted.current && id === generation.current) {
          setCandidates([...new Set(result.filter(s => typeof s === 'string' && s.trim()))]);
          setError('');
        }
      } catch {
        if (mounted.current && id === generation.current) setError('認識できませんでした。書き直してください / Дахин бичнэ үү');
      } finally { if (mounted.current && id === generation.current) setBusy(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [strokes, ready]);
  const download = async () => {
    if (downloading) return;
    setDownloading(true); setError('');
    const deadline = Date.now() + 120000;
    const failed = () => {
      if (!mounted.current) return;
      setDownloading(false);
      setError('通信を確認して再試行してください / Интернэтээ шалгаад дахин оролдоно уу');
    };
    const check = async () => {
      if (!mounted.current) return;
      try {
        const value = await Ink.isReady();
        if (!mounted.current) return;
        if (value) { setReady(true); setDownloading(false); return; }
        if (Date.now() >= deadline || await Ink.downloadError()) { failed(); return; }
        downloadTimer.current = setTimeout(check, 1000);
      } catch { failed(); }
    };
    try { await Ink.startDownload(); await check(); } catch { failed(); }
  };
  const point = e => ({ x: Math.max(0, e.nativeEvent.locationX), y: Math.max(0, e.nativeEvent.locationY), t: Date.now() });
  return <View style={s.panel}>
    {!Ink ? <Text style={s.message}>{label('手書き認識にはアプリの再ビルドが必要です（Expo Go・Web非対応）', 'Гар бичмэл танихын тулд аппыг дахин build хийнэ үү. Expo Go / Web дэмжихгүй.')}</Text>
      : !ready ? <View style={s.setup}>
        <Text style={s.message}>{label('初回のみ日本語モデルのダウンロードが必要です。その後はオフラインで使えます。', 'Япон хэлний загварыг нэг удаа татна. Дараа нь интернэтгүй ашиглана.')}</Text>
        <TouchableOpacity accessibilityRole="button" disabled={downloading} onPress={download} style={s.button}>
          <Text style={s.text}>{downloading ? label('ダウンロード中…', 'Татаж байна…') : label('モデルをダウンロード（通信あり）', 'Загвар татах (интернэт ашиглана)')}</Text>
        </TouchableOpacity>
      </View> : <>
        <ScrollView horizontal keyboardShouldPersistTaps="always" style={s.candidates}>
          {candidates.map(c => <TouchableOpacity key={c} accessibilityRole="button" accessibilityLabel={c} style={s.candidate} onPress={() => { onCandidate(c); reset(); }}><Text style={s.kanji}>{c}</Text></TouchableOpacity>)}
          {!candidates.length && <Text style={s.message}>{busy ? label('認識中…', 'Таних гэж байна…') : label('漢字を1文字書き、候補を選んでください', 'Нэг ханз бичээд санал болгосон үсгээ сонгоно уу')}</Text>}
        </ScrollView>
        <View style={{ height: Math.min(260, height * .32), backgroundColor: '#191919' }}
          onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={e => {
            generation.current++; setCandidates([]); setBusy(false);
            active.current = [point(e)]; setCurrent([...active.current]);
          }}
          onResponderMove={e => {
            if (!active.current.length) return;
            // Retain the full stroke rather than dropping its tail on long gestures.
            if (active.current.length >= 180) active.current = active.current.filter((_, i) => i % 2 === 0);
            active.current.push(point(e)); setCurrent([...active.current]);
          }}
          onResponderRelease={e => {
            if (!active.current.length) return;
            active.current.push(point(e)); const finished = active.current;
            active.current = []; setCurrent([]);
            if (strokes.length >= 100) { setError('全消去して書き直してください / Арилгаад дахин бичнэ үү'); return; }
            setStrokes(prev => [...prev, finished]);
          }}
          onResponderTerminate={() => { active.current = []; setCurrent([]); generation.current++; }}>
          <Svg width="100%" height="100%" pointerEvents="none">
            {[...strokes, current].map((points, i) => <Path key={i} d={strokePath(points)} stroke="white" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
          </Svg>
        </View>
        <View style={s.controls}>
          <TouchableOpacity accessibilityRole="button" style={s.button} onPress={() => reset(strokes.slice(0, -1))}><Text style={s.text}>{label('↶ 一画戻す', '↶ Буцаах')}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={s.button} onPress={() => reset()}><Text style={s.text}>{label('⌫ 全消去', '⌫ Арилгах')}</Text></TouchableOpacity>
        </View>
      </>}
    {!!error && <Text accessibilityRole="alert" style={s.message}>{error}</Text>}
  </View>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#242424' }, setup: { padding: 12 },
  message: { color: '#ddd', fontSize: 13, padding: 12 }, text: { color: 'white', fontSize: 14 },
  candidates: { maxHeight: 58, minHeight: 48 }, candidate: { paddingHorizontal: 16, paddingVertical: 6, borderRightWidth: 1, borderColor: '#555' },
  kanji: { color: 'white', fontSize: 30 }, controls: { flexDirection: 'row', justifyContent: 'space-around' },
  button: { padding: 12, minHeight: 44, alignItems: 'center' },
});
