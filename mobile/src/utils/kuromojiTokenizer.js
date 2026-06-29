import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { KUROMOJI_DIC_ASSETS, KUROMOJI_DIC_FILENAMES } from './kuromojiDictAssets';

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

function gunzipBuffer(bytes) {
  const Gunzip = getGunzipClass();
  if (!Gunzip) {
    throw new Error('zlibjs Gunzip is not available');
  }
  const gz = new Gunzip(bytes);
  return gz.decompress().buffer;
}

function shouldSkipLookupToken(token, term) {
  if (term === 'する' && token.surface_form !== token.basic_form) {
    return true;
  }
  return false;
}

let tokenizerPromise = null;
let initError = null;

function normalizeFileUri(file) {
  if (file.startsWith('file:/') && !file.startsWith('file:///')) {
    return `file://${file.slice('file:'.length)}`;
  }
  return file;
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function createWebLoadArrayBuffer() {
  return function loadArrayBuffer(filename, callback) {
    const assetModule = KUROMOJI_DIC_ASSETS[filename];

    if (!assetModule) {
      callback(new Error(`Unknown dictionary file: ${filename}`), null);
      return;
    }

    const asset = Asset.fromModule(assetModule);
    const uri = asset.localUri || asset.uri;

    fetch(uri)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => {
        callback(null, gunzipBuffer(new Uint8Array(arrayBuffer)));
      })
      .catch((error) => callback(error, null));
  };
}

function createNativeLoadArrayBuffer(dicPath) {
  return function loadArrayBuffer(filename, callback) {
    const uri = normalizeFileUri(`${dicPath}${filename}`);

    FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
      .then((base64) => {
        callback(null, gunzipBuffer(base64ToUint8Array(base64)));
      })
      .catch((error) => callback(error, null));
  };
}

function loadDictionary(loadArrayBuffer, loadCallback) {
  const dic = new DynamicDictionaries();

  async.parallel([
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

async function ensureWebAssetsReady() {
  await Promise.all(
    KUROMOJI_DIC_FILENAMES.map(async (filename) => {
      const asset = Asset.fromModule(KUROMOJI_DIC_ASSETS[filename]);
      await asset.downloadAsync();
    }),
  );
}

async function ensureDictionaryFiles() {
  const dir = `${FileSystem.documentDirectory}kuromoji/dict/`;
  const marker = `${dir}.installed`;
  const markerInfo = await FileSystem.getInfoAsync(marker);

  if (markerInfo.exists) {
    return dir;
  }

  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  await Promise.all(
    KUROMOJI_DIC_FILENAMES.map(async (filename) => {
      const asset = Asset.fromModule(KUROMOJI_DIC_ASSETS[filename]);
      await asset.downloadAsync();
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: `${dir}${filename}`,
      });
    }),
  );

  await FileSystem.writeAsStringAsync(marker, 'ok');
  return dir;
}

function buildTokenizer(dicPath) {
  return new Promise((resolve, reject) => {
    const loadArrayBuffer = Platform.OS === 'web'
      ? createWebLoadArrayBuffer()
      : createNativeLoadArrayBuffer(dicPath);

    loadDictionary(loadArrayBuffer, (error, dic) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(new Tokenizer(dic));
    });
  });
}

function prepareDictionary() {
  if (Platform.OS === 'web') {
    return ensureWebAssetsReady();
  }
  return ensureDictionaryFiles();
}

export function initKuromoji() {
  if (initError) {
    return Promise.reject(initError);
  }
  if (!tokenizerPromise) {
    tokenizerPromise = prepareDictionary()
      .then((dicPath) => buildTokenizer(dicPath || ''))
      .catch((error) => {
        initError = error;
        tokenizerPromise = null;
        throw error;
      });
  }
  return tokenizerPromise;
}

export async function tokenizeJapanese(text) {
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
