import { tokenizeJapanese } from './kuromojiTokenizer';

/** @typedef {'verb' | 'i-adjective' | 'na-adjective'} WordClass */

/** @typedef {'affirmative' | 'negative' | 'polite' | 'politeNegative'} MoodId */

/** @typedef {{ id: string, form: string }} ConjugationRow */

/** @typedef {{ id: MoodId, rows: ConjugationRow[] }} ConjugationGroup */

/** @typedef {{ wordClass: WordClass, groups: ConjugationGroup[] }} ConjugationResult */

const MOOD_IDS = ['affirmative', 'negative', 'polite', 'politeNegative'];

const VERB_ROW_IDS = [
  'dictionary',
  'past',
  'te',
  'conditionalBa',
  'conditionalTara',
  'potential',
  'passive',
  'causative',
  'imperative',
  'volitional',
];

const ADJECTIVE_ROW_IDS = [
  'dictionary',
  'past',
  'te',
  'conditionalBa',
  'conditionalTara',
];

const GODAN_RU_EXCEPTIONS = new Set([
  '帰る', '切る', '走る', '知る', '減る', '交わる', '限る', '蹴る', '要る', '入る',
  '散る', '滑る', '練る', '測る', '照る', '捕る', '取る', '罷る', '交る', '遮る',
  '覆る', '去る', '垂る', '練る', '吊る', '曇る', '焦る', '参る', '喰らう',
]);

const ICHIDAN_STEM_PATTERN = /(?:[いきぎしじちにひびみりぢ][ぁぃぅぇぉゃゅょ]?|[えけげせぜてでねへめべれ][ぁぃぅぇぉゃゅょ]?)$/;

const GODAN_PATTERNS = {
  う: { a: 'わ', i: 'い', e: 'え', o: 'お', te: 'って', ta: 'った' },
  く: { a: 'か', i: 'き', e: 'け', o: 'こ', te: 'いて', ta: 'いた' },
  ぐ: { a: 'が', i: 'ぎ', e: 'げ', o: 'ご', te: 'いで', ta: 'いだ' },
  す: { a: 'さ', i: 'し', e: 'せ', o: 'そ', te: 'して', ta: 'した' },
  つ: { a: 'た', i: 'ち', e: 'て', o: 'と', te: 'って', ta: 'った' },
  ぬ: { a: 'な', i: 'に', e: 'ね', o: 'の', te: 'んで', ta: 'んだ' },
  ぶ: { a: 'ば', i: 'び', e: 'べ', o: 'ぼ', te: 'んで', ta: 'んだ' },
  む: { a: 'ま', i: 'み', e: 'め', o: 'も', te: 'んで', ta: 'んだ' },
  る: { a: 'ら', i: 'り', e: 'れ', o: 'ろ', te: 'って', ta: 'った' },
};

const POLITE_EXCLUDED_ROW_IDS = new Set(['te', 'conditionalBa']);
const POLITE_EXCLUDED_ADJECTIVE_ROW_IDS = new Set(['te', 'conditionalBa', 'conditionalTara']);

/**
 * @param {Record<string, Partial<Record<MoodId, string | null>>>} matrix
 * @param {string[]} rowIds
 * @param {Set<string>} [politeExcludedRows]
 * @returns {ConjugationGroup[]}
 */
function buildGroups(matrix, rowIds, politeExcludedRows = POLITE_EXCLUDED_ROW_IDS) {
  return MOOD_IDS.map((moodId) => ({
    id: moodId,
    rows: rowIds
      .filter((rowId) => {
        if (moodId === 'negative' && rowId === 'volitional') {
          return false;
        }
        if (
          (moodId === 'polite' || moodId === 'politeNegative')
          && politeExcludedRows.has(rowId)
        ) {
          return false;
        }
        return matrix[rowId]?.[moodId];
      })
      .map((rowId) => ({
        id: rowId,
        form: matrix[rowId][moodId],
      })),
  })).filter((group) => group.rows.length > 0);
}

function isIchidanVerb(lemma) {
  if (!lemma.endsWith('る')) {
    return false;
  }
  if (GODAN_RU_EXCEPTIONS.has(lemma)) {
    return false;
  }
  const stem = lemma.slice(0, -1);
  return ICHIDAN_STEM_PATTERN.test(stem);
}

function getVerbKind(lemma) {
  if (lemma === 'する' || (lemma.endsWith('する') && !lemma.endsWith('ずる'))) {
    return 'suru';
  }
  if (lemma === '来る' || lemma === 'くる') {
    return 'kuru';
  }
  if (lemma.endsWith('る') && isIchidanVerb(lemma)) {
    return 'ichidan';
  }
  return 'godan';
}

function conjugateIchidan(lemma) {
  const stem = lemma.slice(0, -1);

  return buildGroups({
    dictionary: {
      affirmative: lemma,
      negative: `${stem}ない`,
      polite: `${stem}ます`,
      politeNegative: `${stem}ません`,
    },
    past: {
      affirmative: `${stem}た`,
      negative: `${stem}なかった`,
      polite: `${stem}ました`,
      politeNegative: `${stem}ませんでした`,
    },
    te: {
      affirmative: `${stem}て`,
      negative: `${stem}なくて`,
      polite: `${stem}まして`,
      politeNegative: `${stem}ませんで`,
    },
    conditionalBa: {
      affirmative: `${stem}れば`,
      negative: `${stem}なければ`,
      polite: `${stem}ますなら`,
      politeNegative: `${stem}ませんと`,
    },
    conditionalTara: {
      affirmative: `${stem}たら`,
      negative: `${stem}なかったら`,
      polite: `${stem}ましたら`,
      politeNegative: `${stem}ませんでしたら`,
    },
    potential: {
      affirmative: `${stem}られる`,
      negative: `${stem}られない`,
      polite: `${stem}られます`,
      politeNegative: `${stem}られません`,
    },
    passive: {
      affirmative: `${stem}られる`,
      negative: `${stem}られない`,
      polite: `${stem}られます`,
      politeNegative: `${stem}られません`,
    },
    causative: {
      affirmative: `${stem}させる`,
      negative: `${stem}させない`,
      polite: `${stem}させます`,
      politeNegative: `${stem}させません`,
    },
    imperative: {
      affirmative: `${stem}ろ`,
      negative: `${lemma}な`,
      polite: `${stem}なさい`,
      politeNegative: `${stem}ないでください`,
    },
    volitional: {
      affirmative: `${stem}よう`,
      polite: `${stem}ましょう`,
    },
  }, VERB_ROW_IDS);
}

function conjugateGodan(lemma) {
  const ending = lemma.slice(-1);
  const stem = lemma.slice(0, -1);
  const pattern = GODAN_PATTERNS[ending];

  if (!pattern) {
    return null;
  }

  let te = stem + pattern.te;
  let ta = stem + pattern.ta;
  if (lemma === '行く') {
    te = '行って';
    ta = '行った';
  }

  const aStem = stem + pattern.a;
  const iStem = stem + pattern.i;
  const eStem = stem + pattern.e;
  const oStem = stem + pattern.o;

  return buildGroups({
    dictionary: {
      affirmative: lemma,
      negative: `${aStem}ない`,
      polite: `${iStem}ます`,
      politeNegative: `${aStem}ません`,
    },
    past: {
      affirmative: ta,
      negative: `${aStem}なかった`,
      polite: `${iStem}ました`,
      politeNegative: `${aStem}ませんでした`,
    },
    te: {
      affirmative: te,
      negative: `${aStem}なくて`,
      polite: `${iStem}まして`,
      politeNegative: `${aStem}ませんで`,
    },
    conditionalBa: {
      affirmative: `${eStem}ば`,
      negative: `${aStem}なければ`,
      polite: `${iStem}ますなら`,
      politeNegative: `${aStem}ませんと`,
    },
    conditionalTara: {
      affirmative: `${ta}ら`,
      negative: `${aStem}なかったら`,
      polite: `${iStem}ましたら`,
      politeNegative: `${aStem}ませんでしたら`,
    },
    potential: {
      affirmative: `${eStem}る`,
      negative: `${eStem}ない`,
      polite: `${eStem}ます`,
      politeNegative: `${eStem}ません`,
    },
    passive: {
      affirmative: `${aStem}れる`,
      negative: `${aStem}れない`,
      polite: `${aStem}れます`,
      politeNegative: `${aStem}れません`,
    },
    causative: {
      affirmative: `${aStem}せる`,
      negative: `${aStem}せない`,
      polite: `${aStem}せます`,
      politeNegative: `${aStem}せません`,
    },
    imperative: {
      affirmative: `${eStem}ろ`,
      negative: `${lemma}な`,
      polite: `${iStem}なさい`,
      politeNegative: `${aStem}ないでください`,
    },
    volitional: {
      affirmative: `${oStem}う`,
      polite: `${iStem}ましょう`,
    },
  }, VERB_ROW_IDS);
}

function conjugateSuru(lemma) {
  const prefix = lemma === 'する' ? '' : lemma.slice(0, -2);
  const base = prefix ? `${prefix}し` : 'し';
  const dictionary = prefix ? `${prefix}する` : 'する';
  const ba = prefix ? `${prefix}すれば` : 'すれば';

  return buildGroups({
    dictionary: {
      affirmative: dictionary,
      negative: `${base}ない`,
      polite: `${base}ます`,
      politeNegative: `${base}ません`,
    },
    past: {
      affirmative: `${base}た`,
      negative: `${base}なかった`,
      polite: `${base}ました`,
      politeNegative: `${base}ませんでした`,
    },
    te: {
      affirmative: `${base}て`,
      negative: `${base}なくて`,
      polite: `${base}まして`,
      politeNegative: `${base}ませんで`,
    },
    conditionalBa: {
      affirmative: ba,
      negative: `${base}なければ`,
      polite: `${base}ますなら`,
      politeNegative: `${base}ませんと`,
    },
    conditionalTara: {
      affirmative: `${base}たら`,
      negative: `${base}なかったら`,
      polite: `${base}ましたら`,
      politeNegative: `${base}ませんでしたら`,
    },
    potential: {
      affirmative: prefix ? `${prefix}できる` : 'できる',
      negative: prefix ? `${prefix}できない` : 'できない',
      polite: prefix ? `${prefix}できます` : 'できます',
      politeNegative: prefix ? `${prefix}できません` : 'できません',
    },
    passive: {
      affirmative: prefix ? `${prefix}される` : 'される',
      negative: prefix ? `${prefix}されない` : 'されない',
      polite: prefix ? `${prefix}されます` : 'されます',
      politeNegative: prefix ? `${prefix}されません` : 'されません',
    },
    causative: {
      affirmative: prefix ? `${prefix}させる` : 'させる',
      negative: prefix ? `${prefix}させない` : 'させない',
      polite: prefix ? `${prefix}させます` : 'させます',
      politeNegative: prefix ? `${prefix}させません` : 'させません',
    },
    imperative: {
      affirmative: `${base}ろ`,
      negative: `${dictionary}な`,
      polite: `${base}なさい`,
      politeNegative: `${base}ないでください`,
    },
    volitional: {
      affirmative: `${base}よう`,
      polite: `${base}ましょう`,
    },
  }, VERB_ROW_IDS);
}

function conjugateKuru(lemma) {
  const useKanji = lemma.includes('来');

  const forms = useKanji
    ? {
      dictionary: { affirmative: '来る', negative: '来ない', polite: '来ます', politeNegative: '来ません' },
      past: { affirmative: '来た', negative: '来なかった', polite: '来ました', politeNegative: '来ませんでした' },
      te: { affirmative: '来て', negative: '来なくて', polite: '来まして', politeNegative: '来ませんで' },
      conditionalBa: { affirmative: '来れば', negative: '来なければ', polite: '来ますなら', politeNegative: '来ませんと' },
      conditionalTara: { affirmative: '来たら', negative: '来なかったら', polite: '来ましたら', politeNegative: '来ませんでしたら' },
      potential: { affirmative: '来られる', negative: '来られない', polite: '来られます', politeNegative: '来られません' },
      passive: { affirmative: '来られる', negative: '来られない', polite: '来られます', politeNegative: '来られません' },
      causative: { affirmative: '来させる', negative: '来させない', polite: '来させます', politeNegative: '来させません' },
      imperative: { affirmative: '来い', negative: '来るな', polite: '来なさい', politeNegative: '来ないでください' },
      volitional: { affirmative: '来よう', polite: '来ましょう' },
    }
    : {
      dictionary: { affirmative: 'くる', negative: 'こない', polite: 'きます', politeNegative: 'きません' },
      past: { affirmative: 'きた', negative: 'こなかった', polite: 'きました', politeNegative: 'きませんでした' },
      te: { affirmative: 'きて', negative: 'こなくて', polite: 'きまして', politeNegative: 'きませんで' },
      conditionalBa: { affirmative: 'くれば', negative: 'こなければ', polite: 'きますなら', politeNegative: 'きませんと' },
      conditionalTara: { affirmative: 'きたら', negative: 'こなかったら', polite: 'きましたら', politeNegative: 'きませんでしたら' },
      potential: { affirmative: 'こられる', negative: 'こられない', polite: 'こられます', politeNegative: 'こられません' },
      passive: { affirmative: 'こられる', negative: 'こられない', polite: 'こられます', politeNegative: 'こられません' },
      causative: { affirmative: 'こさせる', negative: 'こさせない', polite: 'こさせます', politeNegative: 'こさせません' },
      imperative: { affirmative: 'こい', negative: 'くるな', polite: 'きなさい', politeNegative: 'こないでください' },
      volitional: { affirmative: 'こよう', polite: 'きましょう' },
    };

  if (lemma !== forms.dictionary.affirmative) {
    forms.dictionary.affirmative = lemma;
  }

  return buildGroups(forms, VERB_ROW_IDS);
}

function conjugateVerb(lemma) {
  const kind = getVerbKind(lemma);

  switch (kind) {
    case 'suru':
      return conjugateSuru(lemma);
    case 'kuru':
      return conjugateKuru(lemma);
    case 'ichidan':
      return conjugateIchidan(lemma);
    case 'godan':
      return conjugateGodan(lemma);
    default:
      return null;
  }
}

function conjugateIAdjective(lemma) {
  if (lemma === 'いい' || lemma === '良い' || lemma === 'よい') {
    const dict = lemma === 'よい' ? 'よい' : 'いい';
    const politeDict = lemma === 'よい' ? 'よいです' : 'いいです';

    return buildGroups({
      dictionary: {
        affirmative: dict,
        negative: 'よくない',
        polite: politeDict,
        politeNegative: 'よくないです',
      },
      past: {
        affirmative: 'よかった',
        negative: 'よくなかった',
        polite: 'よかったです',
        politeNegative: 'よくなかったです',
      },
      te: {
        affirmative: 'よくて',
        negative: 'よくなくて',
        polite: 'よくて',
        politeNegative: 'よくなくて',
      },
      conditionalBa: {
        affirmative: 'よければ',
        negative: 'よくなければ',
        polite: `${politeDict}なら`,
        politeNegative: 'よくないですと',
      },
      conditionalTara: {
        affirmative: 'よかったら',
        negative: 'よくなかったら',
        polite: 'よかったですら',
        politeNegative: 'よくなかったですら',
      },
    }, ADJECTIVE_ROW_IDS, POLITE_EXCLUDED_ADJECTIVE_ROW_IDS);
  }

  const stem = lemma.slice(0, -1);

  return buildGroups({
    dictionary: {
      affirmative: lemma,
      negative: `${stem}くない`,
      polite: `${lemma}です`,
      politeNegative: `${stem}くないです`,
    },
    past: {
      affirmative: `${stem}かった`,
      negative: `${stem}くなかった`,
      polite: `${stem}かったです`,
      politeNegative: `${stem}くなかったです`,
    },
    te: {
      affirmative: `${stem}くて`,
      negative: `${stem}くなくて`,
      polite: `${stem}くて`,
      politeNegative: `${stem}くなくて`,
    },
    conditionalBa: {
      affirmative: `${stem}ければ`,
      negative: `${stem}くなければ`,
      polite: `${lemma}ですなら`,
      politeNegative: `${stem}くないですと`,
    },
    conditionalTara: {
      affirmative: `${stem}かったら`,
      negative: `${stem}くなかったら`,
      polite: `${stem}かったですら`,
      politeNegative: `${stem}くなかったですら`,
    },
  }, ADJECTIVE_ROW_IDS, POLITE_EXCLUDED_ADJECTIVE_ROW_IDS);
}

function conjugateNaAdjective(lemma) {
  return buildGroups({
    dictionary: {
      affirmative: `${lemma}だ`,
      negative: `${lemma}じゃない`,
      polite: `${lemma}です`,
      politeNegative: `${lemma}じゃないです`,
    },
    past: {
      affirmative: `${lemma}だった`,
      negative: `${lemma}じゃなかった`,
      polite: `${lemma}でした`,
      politeNegative: `${lemma}じゃないでした`,
    },
    te: {
      affirmative: `${lemma}で`,
      negative: `${lemma}じゃなくて`,
      polite: `${lemma}で`,
      politeNegative: `${lemma}じゃなくて`,
    },
    conditionalBa: {
      affirmative: `${lemma}なら`,
      negative: `${lemma}じゃなければ`,
      polite: `${lemma}ですなら`,
      politeNegative: `${lemma}じゃないですと`,
    },
    conditionalTara: {
      affirmative: `${lemma}だったら`,
      negative: `${lemma}じゃなかったら`,
      polite: `${lemma}でしたら`,
      politeNegative: `${lemma}じゃないでしたら`,
    },
  }, ADJECTIVE_ROW_IDS, POLITE_EXCLUDED_ADJECTIVE_ROW_IDS);
}

function pickPrimaryToken(tokens, headword) {
  if (!tokens.length) {
    return null;
  }

  const verbToken = tokens.find((token) => token.pos === '動詞' && token.pos_detail_1 === '自立');
  if (verbToken) {
    return verbToken;
  }

  const adjectiveToken = tokens.find((token) => token.pos === '形容詞');
  if (adjectiveToken) {
    return adjectiveToken;
  }

  const naAdjectiveToken = tokens.find(
    (token) => token.pos === '名詞' && token.pos_detail_1 === '形容動詞語幹',
  );
  if (naAdjectiveToken) {
    return naAdjectiveToken;
  }

  if (tokens.length === 1) {
    return tokens[0];
  }

  const exact = tokens.find((token) => token.surface_form === headword);
  return exact || tokens[0];
}

/**
 * @param {string} headword
 * @returns {Promise<ConjugationResult | null>}
 */
export async function generateConjugations(headword) {
  const trimmed = (headword || '').trim();
  if (!trimmed) {
    return null;
  }

  try {
    const tokens = await tokenizeJapanese(trimmed);
    const token = pickPrimaryToken(tokens, trimmed);
    if (!token) {
      return null;
    }

    if (token.pos === '動詞') {
      let lemma = token.basic_form && token.basic_form !== '*'
        ? token.basic_form
        : token.surface_form;

      if (
        lemma === 'する'
        && trimmed.endsWith('する')
        && trimmed.length > 2
      ) {
        lemma = trimmed;
      }

      const groups = conjugateVerb(lemma);
      if (!groups?.length) {
        return null;
      }
      return { wordClass: 'verb', groups };
    }

    if (token.pos === '形容詞') {
      const lemma = token.surface_form;
      const groups = conjugateIAdjective(lemma);
      return groups?.length ? { wordClass: 'i-adjective', groups } : null;
    }

    if (token.pos === '名詞' && token.pos_detail_1 === '形容動詞語幹') {
      const lemma = token.surface_form;
      const groups = conjugateNaAdjective(lemma);
      return groups?.length ? { wordClass: 'na-adjective', groups } : null;
    }

    return null;
  } catch {
    return null;
  }
}

export { MOOD_IDS, VERB_ROW_IDS, ADJECTIVE_ROW_IDS };
