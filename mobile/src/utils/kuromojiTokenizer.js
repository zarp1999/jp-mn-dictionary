import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { isNativeTokenizerAvailable, tokenizeNative } from 'japanese-tokenizer';
import { KUROMOJI_DIC_ASSETS } from './kuromojiDictAssets';

const async = require('async');
const DynamicDictionaries = require('kuromoji/src/dict/DynamicDictionaries');
const Tokenizer = require('kuromoji/src/Tokenizer');
const zlibModule = require('zlibjs/bin/gunzip.min.js');

const SKIP_POS_PREFIXES = ['助詞', '助動詞', '記号', '接続詞', 'フィラー', '感動詞', '空白', '接頭詞', '接尾辞'];

function getGunzipClass() {
  return (
    zlibModule?.Zlib?.Gunzip
    ?? zlibModule?.Gunzip
    ?? globalThis.Zlib?.Gunzip
  );
}

function copyToArrayBuffer(bytes) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function looksLikeGzip(bytes) {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function gunzipBuffer(bytes) {
  if (!looksLikeGzip(bytes)) {
    return copyToArrayBuffer(bytes);
  }

  const Gunzip = getGunzipClass();
  if (!Gunzip) {
    throw new Error('zlibjs Gunzip is not available');
  }
  const gz = new Gunzip(bytes);
  const decompressed = gz.decompress();
  if (decompressed instanceof Uint8Array) {
    return copyToArrayBuffer(decompressed);
  }
  return decompressed.buffer;
}

function shouldSkipLookupToken(token, term) {
  if (term === 'する' && token.surface_form !== token.basic_form) {
    return true;
  }
  return false;
}

const INIT_TIMEOUT_MS = 90000;

let tokenizerPromise = null;

function isHttpUri(uri) {
  return typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://'));
}

function isFileUri(uri) {
  return typeof uri === 'string' && uri.startsWith('file://');
}

function resolveAssetUri(asset) {
  if (isHttpUri(asset.uri)) {
    return asset.uri;
  }
  return asset.localUri || asset.uri || null;
}

function base64ToUint8Array(base64) {
  const decodeBase64 = globalThis.atob;
  if (typeof decodeBase64 !== 'function') {
    throw new Error('base64 decode (atob) is not available');
  }
  const binary = decodeBase64(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function loadAssetBytes(uri) {
  if (Platform.OS === 'web' || isHttpUri(uri)) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  if (isFileUri(uri)) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64ToUint8Array(base64);
  }

  throw new Error(`Unsupported asset URI scheme: ${uri.slice(0, 32)}`);
}

async function loadDictionaryFile(filename) {
  const assetModule = KUROMOJI_DIC_ASSETS[filename];
  if (!assetModule) {
    throw new Error(`Unknown dictionary file: ${filename}`);
  }

  const asset = Asset.fromModule(assetModule);

  if (!isHttpUri(asset.uri)) {
    await asset.downloadAsync();
  }

  const uri = resolveAssetUri(asset);
  if (!uri) {
    throw new Error(`Missing asset URI for ${filename}`);
  }

  console.log(`[Kuromoji] loading ${filename}`);
  const bytes = await loadAssetBytes(uri);
  return gunzipBuffer(bytes);
}

function createAssetLoadArrayBuffer() {
  return function loadArrayBuffer(filename, callback) {
    loadDictionaryFile(filename)
      .then((buffer) => callback(null, buffer))
      .catch((error) => callback(error, null));
  };
}

function loadDictionary(loadArrayBuffer, loadCallback) {
  const dic = new DynamicDictionaries();
  const runTasks = Platform.OS === 'web' ? async.parallel : async.series;

  runTasks([
    function (callback) {
      async.map(['base.dat.gz', 'check.dat.gz'], (filename, _callback) => {
        loadArrayBuffer(filename, (err, buffer) => {
          if (err) {
            _callback(err);
            return;
          }
          _callback(null, buffer);
        });
      }, (err, buffers) => {
        if (err) {
          callback(err);
          return;
        }
        dic.loadTrie(new Int32Array(buffers[0]), new Int32Array(buffers[1]));
        callback(null);
      });
    },
    function (callback) {
      async.map(['tid.dat.gz', 'tid_pos.dat.gz', 'tid_map.dat.gz'], (filename, _callback) => {
        loadArrayBuffer(filename, (err, buffer) => {
          if (err) {
            _callback(err);
            return;
          }
          _callback(null, buffer);
        });
      }, (err, buffers) => {
        if (err) {
          callback(err);
          return;
        }
        dic.loadTokenInfoDictionaries(
          new Uint8Array(buffers[0]),
          new Uint8Array(buffers[1]),
          new Uint8Array(buffers[2]),
        );
        callback(null);
      });
    },
    function (callback) {
      loadArrayBuffer('cc.dat.gz', (err, buffer) => {
        if (err) {
          callback(err);
          return;
        }
        dic.loadConnectionCosts(new Int16Array(buffer));
        callback(null);
      });
    },
    function (callback) {
      async.map(
        ['unk.dat.gz', 'unk_pos.dat.gz', 'unk_map.dat.gz', 'unk_char.dat.gz', 'unk_compat.dat.gz', 'unk_invoke.dat.gz'],
        (filename, _callback) => {
          loadArrayBuffer(filename, (err, buffer) => {
            if (err) {
              _callback(err);
              return;
            }
            _callback(null, buffer);
          });
        },
        (err, buffers) => {
          if (err) {
            callback(err);
            return;
          }
          dic.loadUnknownDictionaries(
            new Uint8Array(buffers[0]),
            new Uint8Array(buffers[1]),
            new Uint8Array(buffers[2]),
            new Uint8Array(buffers[3]),
            new Uint32Array(buffers[4]),
            new Uint8Array(buffers[5]),
          );
          callback(null);
        },
      );
    },
  ], (err) => {
    loadCallback(err, dic);
  });
}

function withTimeout(promise, ms, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
}

function buildTokenizer() {
  return new Promise((resolve, reject) => {
    loadDictionary(createAssetLoadArrayBuffer(), (error, dic) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(new Tokenizer(dic));
    });
  });
}

export function initKuromoji() {
  if (isNativeTokenizerAvailable()) {
    console.log('[Tokenizer] using native engine');
    return Promise.resolve(null);
  }

  if (!tokenizerPromise) {
    console.log('[Kuromoji] initializing');
    tokenizerPromise = withTimeout(
      buildTokenizer(),
      INIT_TIMEOUT_MS,
      `Kuromoji init timed out after ${INIT_TIMEOUT_MS}ms`,
    )
      .then((tokenizer) => {
        console.log('[Kuromoji] initialized');
        return tokenizer;
      })
      .catch((error) => {
        tokenizerPromise = null;
        console.warn('Kuromoji initialization failed', error);
        throw error;
      });
  }
  return tokenizerPromise;
}

export async function tokenizeJapanese(text) {
  if (isNativeTokenizerAvailable()) {
    const tokens = await tokenizeNative(text);
    if (Array.isArray(tokens)) {
      return tokens;
    }
    throw new Error('Native tokenizer returned no tokens');
  }

  const tokenizer = await initKuromoji();
  return tokenizer.tokenize(text);
}

export function getLookupTermsFromTokens(tokens) {
  const terms = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token.pos.startsWith('助動詞') && token.basic_form === 'たい') {
      const prev = tokens[i - 1];
      if (prev?.basic_form === 'する' && prev.surface_form === 'し') {
        terms.push('したい');
      } else if (prev?.pos.startsWith('動詞')) {
        terms.push('たい');
      }
      continue;
    }

    if (SKIP_POS_PREFIXES.some((prefix) => token.pos.startsWith(prefix))) {
      continue;
    }

    const term = token.basic_form && token.basic_form !== '*'
      ? token.basic_form
      : token.surface_form;

    if (term && !shouldSkipLookupToken(token, term)) {
      terms.push(term);
    }
  }

  return terms;
}

export async function getLookupTerms(text) {
  const tokens = await tokenizeJapanese(text);
  return getLookupTermsFromTokens(tokens);
}
