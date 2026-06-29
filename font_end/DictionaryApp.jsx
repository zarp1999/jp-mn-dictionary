import { useState } from "react";

const WORDS = [
  { id: 1, jp: "ありがとう", mn: "Баярлалаа", romaji: "arigatou", favorite: true },
  { id: 2, jp: "こんにちは", mn: "Сайн байна уу", romaji: "konnichiwa", favorite: false },
  { id: 3, jp: "すみません", mn: "Уучлаарай", romaji: "sumimasen", favorite: false },
  { id: 4, jp: "水", mn: "Ус", romaji: "mizu", favorite: false },
  { id: 5, jp: "食べる", mn: "Идэх", romaji: "taberu", favorite: true },
  { id: 6, jp: "行く", mn: "Явах", romaji: "iku", favorite: false },
  { id: 7, jp: "大きい", mn: "Том", romaji: "ookii", favorite: false },
  { id: 8, jp: "電車", mn: "Галт тэрэг", romaji: "densha", favorite: false },
  { id: 9, jp: "病院", mn: "Эмнэлэг", romaji: "byouin", favorite: false },
  { id: 10, jp: "友達", mn: "Найз", romaji: "tomodachi", favorite: true },
];

const COLORS = {
  primary: "#534AB7",
  primaryLight: "#EEEDFE",
  primaryText: "#3C3489",
  bg: "#F8F8F8",
  white: "#FFFFFF",
  border: "rgba(0,0,0,0.1)",
  textPrimary: "#1A1A1A",
  textSecondary: "#666666",
  textTertiary: "#AAAAAA",
  amber: "#EF9F27",
  amberLight: "#FAEEDA",
};

const styles = {
  container: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    background: COLORS.bg,
    minHeight: "100vh",
    maxWidth: 390,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  statusBar: {
    background: COLORS.white,
    padding: "12px 20px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusTime: { fontSize: 15, fontWeight: 600, color: COLORS.textPrimary },
  statusIcons: { fontSize: 13, color: COLORS.textPrimary, display: "flex", gap: 6 },
  header: {
    background: COLORS.white,
    padding: "12px 16px 14px",
    borderBottom: `0.5px solid ${COLORS.border}`,
  },
  title: { fontSize: 22, fontWeight: 600, color: COLORS.textPrimary, margin: "0 0 12px" },
  searchBar: {
    display: "flex",
    alignItems: "center",
    background: COLORS.bg,
    borderRadius: 12,
    padding: "10px 14px",
    gap: 8,
    border: `0.5px solid ${COLORS.border}`,
  },
  searchIcon: { fontSize: 16, color: COLORS.textTertiary },
  searchInput: {
    border: "none",
    background: "transparent",
    fontSize: 15,
    color: COLORS.textPrimary,
    outline: "none",
    flex: 1,
    fontFamily: "inherit",
  },
  tabRow: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },
  tabActive: {
    background: COLORS.primaryLight,
    borderRadius: 20,
    padding: "5px 14px",
    fontSize: 13,
    color: COLORS.primaryText,
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    fontFamily: "inherit",
  },
  tabInactive: {
    background: "transparent",
    borderRadius: 20,
    padding: "5px 14px",
    fontSize: 13,
    color: COLORS.textSecondary,
    cursor: "pointer",
    border: `0.5px solid ${COLORS.border}`,
    fontFamily: "inherit",
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    padding: "16px 16px 8px",
    fontWeight: 500,
    letterSpacing: 0.3,
  },
  wordList: {
    flex: 1,
    overflowY: "auto",
    padding: "0 12px",
    paddingBottom: 80,
  },
  wordCard: {
    background: COLORS.white,
    borderRadius: 12,
    border: `0.5px solid ${COLORS.border}`,
    padding: "12px 14px",
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    transition: "background 0.1s",
  },
  wordLeft: { flex: 1 },
  wordJp: { fontSize: 16, fontWeight: 500, color: COLORS.textPrimary, margin: 0 },
  wordRomaji: { fontSize: 12, color: COLORS.textTertiary, margin: "2px 0 0" },
  wordMn: { fontSize: 13, color: COLORS.textSecondary, margin: "4px 0 0" },
  starBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    padding: 4,
    lineHeight: 1,
  },
  detailOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "flex-end",
    zIndex: 100,
    maxWidth: 390,
    margin: "0 auto",
    left: "50%",
    transform: "translateX(-50%)",
  },
  detailSheet: {
    background: COLORS.white,
    borderRadius: "20px 20px 0 0",
    padding: "20px 20px 40px",
    width: "100%",
    boxSizing: "border-box",
  },
  detailHandle: {
    width: 36,
    height: 4,
    background: COLORS.border,
    borderRadius: 2,
    margin: "0 auto 20px",
  },
  detailJp: { fontSize: 32, fontWeight: 600, color: COLORS.textPrimary, margin: "0 0 4px" },
  detailRomaji: { fontSize: 14, color: COLORS.textTertiary, margin: "0 0 16px" },
  detailDivider: { height: 0.5, background: COLORS.border, margin: "16px 0" },
  detailLabel: { fontSize: 11, color: COLORS.textTertiary, fontWeight: 500, marginBottom: 6, letterSpacing: 0.5 },
  detailMn: { fontSize: 22, fontWeight: 500, color: COLORS.primary, margin: "0 0 16px" },
  detailFavBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: `0.5px solid ${COLORS.border}`,
    background: COLORS.white,
    fontSize: 15,
    color: COLORS.textPrimary,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 500,
    marginTop: 8,
  },
  detailFavBtnActive: {
    background: COLORS.amberLight,
    border: `0.5px solid ${COLORS.amber}`,
    color: "#7A5000",
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    background: COLORS.bg,
    border: "none",
    borderRadius: "50%",
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tabBar: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 390,
    background: COLORS.white,
    borderTop: `0.5px solid ${COLORS.border}`,
    display: "flex",
    justifyContent: "space-around",
    padding: "10px 0 24px",
    zIndex: 50,
  },
  tabItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    cursor: "pointer",
    background: "none",
    border: "none",
    fontFamily: "inherit",
    padding: "0 16px",
  },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 10 },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: COLORS.textTertiary,
    fontSize: 14,
  },
};

export default function App() {
  const [words, setWords] = useState(WORDS);
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("jp-mn");
  const [activeTab, setActiveTab] = useState("search");
  const [selected, setSelected] = useState(null);

  const toggleFavorite = (id) => {
    setWords(words.map(w => w.id === id ? { ...w, favorite: !w.favorite } : w));
    if (selected?.id === id) setSelected(s => ({ ...s, favorite: !s.favorite }));
  };

  const filtered = words.filter(w => {
    const q = search.toLowerCase();
    if (!q) return true;
    return direction === "jp-mn"
      ? w.jp.includes(q) || w.romaji.includes(q)
      : w.mn.toLowerCase().includes(q);
  });

  const displayed = activeTab === "favorites" ? words.filter(w => w.favorite) : filtered;
  const isHistory = activeTab === "history";
  const sectionTitle =
    activeTab === "favorites" ? "お気に入り" :
    activeTab === "history" ? "最近見た単語" :
    search ? "検索結果" : "よく使う言葉";

  return (
    <div style={styles.container}>
      <div style={styles.statusBar}>
        <span style={styles.statusTime}>9:41</span>
        <div style={styles.statusIcons}>
          <span>●●●</span><span>WiFi</span><span>🔋</span>
        </div>
      </div>

      <div style={styles.header}>
        <p style={styles.title}>日モ辞典</p>
        <div style={styles.searchBar}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            placeholder={direction === "jp-mn" ? "日本語で検索…" : "モンゴル語で検索…"}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textTertiary, fontSize: 16 }}>✕</button>
          )}
        </div>
        <div style={styles.tabRow}>
          <button style={direction === "jp-mn" ? styles.tabActive : styles.tabInactive} onClick={() => setDirection("jp-mn")}>
            日 → モ
          </button>
          <button style={direction === "mn-jp" ? styles.tabActive : styles.tabInactive} onClick={() => setDirection("mn-jp")}>
            モ → 日
          </button>
        </div>
      </div>

      <p style={styles.sectionLabel}>{sectionTitle}　{displayed.length > 0 ? `${displayed.length}件` : ""}</p>

      <div style={styles.wordList}>
        {isHistory ? (
          <div style={styles.emptyState}>履歴はまだありません</div>
        ) : displayed.length === 0 ? (
          <div style={styles.emptyState}>「{search}」は見つかりませんでした</div>
        ) : (
          displayed.map(word => (
            <div key={word.id} style={styles.wordCard} onClick={() => setSelected(word)}>
              <div style={styles.wordLeft}>
                <p style={styles.wordJp}>{word.jp}</p>
                <p style={styles.wordRomaji}>{word.romaji}</p>
                <p style={styles.wordMn}>{word.mn}</p>
              </div>
              <button
                style={styles.starBtn}
                onClick={e => { e.stopPropagation(); toggleFavorite(word.id); }}
                aria-label={word.favorite ? "お気に入りから削除" : "お気に入りに追加"}
              >
                {word.favorite ? "⭐" : "☆"}
              </button>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div style={styles.detailOverlay} onClick={() => setSelected(null)}>
          <div style={{ ...styles.detailSheet, position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={styles.detailHandle} />
            <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            <p style={styles.detailJp}>{selected.jp}</p>
            <p style={styles.detailRomaji}>{selected.romaji}</p>
            <div style={styles.detailDivider} />
            <p style={styles.detailLabel}>モンゴル語</p>
            <p style={styles.detailMn}>{selected.mn}</p>
            <button
              style={{ ...styles.detailFavBtn, ...(selected.favorite ? styles.detailFavBtnActive : {}) }}
              onClick={() => toggleFavorite(selected.id)}
            >
              {selected.favorite ? "⭐ お気に入りから削除" : "☆ お気に入りに追加"}
            </button>
          </div>
        </div>
      )}

      <div style={styles.tabBar}>
        {[
          { key: "search", icon: "🔍", label: "検索" },
          { key: "favorites", icon: "⭐", label: "お気に入り" },
          { key: "history", icon: "🕐", label: "履歴" },
          { key: "settings", icon: "⚙️", label: "設定" },
        ].map(tab => (
          <button
            key={tab.key}
            style={styles.tabItem}
            onClick={() => setActiveTab(tab.key)}
          >
            <span style={{ ...styles.tabIcon, opacity: activeTab === tab.key ? 1 : 0.4 }}>{tab.icon}</span>
            <span style={{ ...styles.tabLabel, color: activeTab === tab.key ? COLORS.primary : COLORS.textTertiary, fontWeight: activeTab === tab.key ? 500 : 400 }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
