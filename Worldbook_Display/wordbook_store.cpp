#include "wordbook_store.h"

#include <stdio.h>
#include <string.h>
#include <LittleFS.h>
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "esp_log.h"
#include "nvs.h"
#include "nvs_flash.h"
#include "cJSON.h"

static const char *TAG = "wordbook_store";
static const char *STORE_PATH = "/wordbook.bin";
static const char *STORE_PATH_TMP = "/wordbook.tmp";
static const char *PROGRESS_PATH = "/progress.bin";
static const char *NVS_NS = "wordbook"; /* legacy only (one-time migrate) */

static const uint32_t STORE_MAGIC = 0x314B4257u; /* 'WBK1' little-endian */
static const uint8_t STORE_VERSION = 3;
static const uint32_t PROGRESS_MAGIC = 0x47525057u; /* 'WPRG' little-endian */
static const uint8_t PROGRESS_VERSION = 1;

typedef struct __attribute__((packed)) {
  uint32_t magic;
  uint8_t version;
  uint8_t count;
  uint16_t reserved;
} wordbook_file_header_t;

typedef struct __attribute__((packed)) {
  uint32_t magic;
  uint8_t version;
  uint8_t show_gloss;
  uint16_t index;
} wordbook_progress_t;

static wordbook_word_t s_words[WORDBOOK_MAX_WORDS];
static wordbook_word_t s_parse_buf[WORDBOOK_MAX_WORDS]; /* avoid large stack in HTTP task */
static size_t s_count = 0;
static SemaphoreHandle_t s_mutex = NULL;
static bool s_fs_ready = false;

static void copy_field(char *dst, size_t dst_len, const char *src)
{
  if (!dst || dst_len == 0) {
    return;
  }
  if (!src) {
    dst[0] = '\0';
    return;
  }
  snprintf(dst, dst_len, "%s", src);
}

static const char *json_string_field(const cJSON *obj, const char *a, const char *b)
{
  const cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, a);
  if (!cJSON_IsString(item) || item->valuestring == NULL) {
    item = cJSON_GetObjectItemCaseSensitive(obj, b);
  }
  if (!cJSON_IsString(item) || item->valuestring == NULL) {
    return NULL;
  }
  return item->valuestring;
}

static void clear_deck_unlocked(void)
{
  s_count = 0;
}

static bool fs_save_unlocked(void)
{
  if (!s_fs_ready) {
    ESP_LOGW(TAG, "LittleFS not ready");
    return false;
  }

  wordbook_file_header_t hdr = {};
  hdr.magic = STORE_MAGIC;
  hdr.version = STORE_VERSION;
  hdr.count = (uint8_t)s_count;
  hdr.reserved = 0;

  File f = LittleFS.open(STORE_PATH_TMP, "w");
  if (!f) {
    ESP_LOGW(TAG, "open %s failed", STORE_PATH_TMP);
    return false;
  }

  const size_t hdr_n = f.write((const uint8_t *)&hdr, sizeof(hdr));
  size_t body_n = 0;
  if (s_count > 0) {
    body_n = f.write((const uint8_t *)s_words, s_count * sizeof(wordbook_word_t));
  }
  f.flush();
  f.close();

  const size_t expect_body = s_count * sizeof(wordbook_word_t);
  if (hdr_n != sizeof(hdr) || body_n != expect_body) {
    ESP_LOGW(
      TAG,
      "write incomplete hdr=%u/%u body=%u/%u",
      (unsigned)hdr_n,
      (unsigned)sizeof(hdr),
      (unsigned)body_n,
      (unsigned)expect_body
    );
    LittleFS.remove(STORE_PATH_TMP);
    return false;
  }

  LittleFS.remove(STORE_PATH);
  if (!LittleFS.rename(STORE_PATH_TMP, STORE_PATH)) {
    ESP_LOGW(TAG, "rename to %s failed", STORE_PATH);
    return false;
  }

  ESP_LOGI(TAG, "saved %u words to LittleFS (%u bytes)", (unsigned)s_count, (unsigned)(sizeof(hdr) + expect_body));
  return true;
}

static bool fs_load_unlocked(void)
{
  if (!s_fs_ready || !LittleFS.exists(STORE_PATH)) {
    return false;
  }

  File f = LittleFS.open(STORE_PATH, "r");
  if (!f) {
    return false;
  }

  wordbook_file_header_t hdr = {};
  if (f.read((uint8_t *)&hdr, sizeof(hdr)) != (int)sizeof(hdr)) {
    f.close();
    return false;
  }

  if (hdr.magic != STORE_MAGIC || hdr.version != STORE_VERSION || hdr.count > WORDBOOK_MAX_WORDS) {
    ESP_LOGW(
      TAG,
      "bad header magic=0x%08x ver=%u count=%u",
      (unsigned)hdr.magic,
      (unsigned)hdr.version,
      (unsigned)hdr.count
    );
    f.close();
    return false;
  }

  if (hdr.count == 0) {
    s_count = 0;
    f.close();
    ESP_LOGI(TAG, "loaded empty deck from LittleFS");
    return true;
  }

  const size_t bytes = (size_t)hdr.count * sizeof(wordbook_word_t);
  if (f.read((uint8_t *)s_words, bytes) != (int)bytes) {
    f.close();
    ESP_LOGW(TAG, "body read failed for %u words", (unsigned)hdr.count);
    return false;
  }
  f.close();

  s_count = hdr.count;
  ESP_LOGI(TAG, "loaded %u words from LittleFS", (unsigned)s_count);
  return true;
}

/* One-time: pull a previously saved NVS deck into RAM (chunked ver=2 or legacy blob). */
static bool nvs_migrate_load_unlocked(void)
{
  nvs_handle_t handle;
  if (nvs_open(NVS_NS, NVS_READONLY, &handle) != ESP_OK) {
    return false;
  }

  uint8_t count = 0;
  if (nvs_get_u8(handle, "count", &count) != ESP_OK || count == 0 || count > WORDBOOK_MAX_WORDS) {
    nvs_close(handle);
    return false;
  }

  uint8_t ver = 0;
  const bool has_ver = (nvs_get_u8(handle, "ver", &ver) == ESP_OK);
  bool ok = false;

  if (has_ver && ver == 2) {
    size_t loaded = 0;
    const size_t per = 5;
    const size_t chunks = (count + per - 1) / per;
    ok = true;
    for (size_t c = 0; c < chunks && ok; c++) {
      char key[8];
      snprintf(key, sizeof(key), "c%u", (unsigned)c);
      const size_t remaining = (size_t)count - loaded;
      const size_t words_here = remaining < per ? remaining : per;
      size_t data_size = words_here * sizeof(wordbook_word_t);
      if (nvs_get_blob(handle, key, &s_words[loaded], &data_size) != ESP_OK
          || data_size != words_here * sizeof(wordbook_word_t)) {
        ok = false;
        break;
      }
      loaded += words_here;
    }
    if (ok) {
      s_count = count;
    }
  }

  if (!ok) {
    size_t data_size = 0;
    if (nvs_get_blob(handle, "data", NULL, &data_size) == ESP_OK
        && data_size == (size_t)count * sizeof(wordbook_word_t)
        && nvs_get_blob(handle, "data", s_words, &data_size) == ESP_OK) {
      s_count = count;
      ok = true;
    }
  }

  nvs_close(handle);
  if (ok) {
    ESP_LOGI(TAG, "migrated %u words from NVS", (unsigned)s_count);
  }
  return ok;
}

static void nvs_migrate_erase(void)
{
  nvs_handle_t handle;
  if (nvs_open(NVS_NS, NVS_READWRITE, &handle) != ESP_OK) {
    return;
  }
  nvs_erase_all(handle);
  nvs_commit(handle);
  nvs_close(handle);
  ESP_LOGI(TAG, "erased legacy NVS wordbook namespace");
}

void wordbook_store_init(void)
{
  if (s_mutex == NULL) {
    s_mutex = xSemaphoreCreateMutex();
  }

  /* Keep NVS available for Wi-Fi / system and one-time migration. */
  esp_err_t err = nvs_flash_init();
  if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
    ESP_LOGW(TAG, "nvs_flash_init needs erase: %s", esp_err_to_name(err));
    nvs_flash_erase();
    err = nvs_flash_init();
  }
  if (err != ESP_OK) {
    ESP_LOGW(TAG, "nvs_flash_init failed: %s", esp_err_to_name(err));
  }

  /* Mount LittleFS; format only if mount fails (first boot after partition change). */
  s_fs_ready = LittleFS.begin(false);
  if (!s_fs_ready) {
    ESP_LOGW(TAG, "LittleFS mount failed — formatting partition (may take a while)");
    if (LittleFS.format() && LittleFS.begin(false)) {
      s_fs_ready = true;
    }
  }
  if (!s_fs_ready) {
    ESP_LOGW(TAG, "LittleFS unavailable — use partitions.csv / erase flash if needed");
  } else {
    ESP_LOGI(TAG, "LittleFS mounted total=%u used=%u", (unsigned)LittleFS.totalBytes(), (unsigned)LittleFS.usedBytes());
  }

  if (s_mutex && xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    bool loaded = fs_load_unlocked();
    if (!loaded && nvs_migrate_load_unlocked()) {
      if (fs_save_unlocked()) {
        nvs_migrate_erase();
        loaded = true;
      }
    }
    if (!loaded) {
      clear_deck_unlocked();
      ESP_LOGI(TAG, "initialized with empty deck (setup hint on UI)");
      (void)fs_save_unlocked();
    }
    xSemaphoreGive(s_mutex);
  }
}

size_t wordbook_store_count(void)
{
  size_t count = 0;
  if (s_mutex && xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    count = s_count;
    xSemaphoreGive(s_mutex);
  }
  return count;
}

bool wordbook_store_get(size_t index, wordbook_word_t *out)
{
  if (!out) {
    return false;
  }

  bool ok = false;
  if (s_mutex && xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    if (index < s_count) {
      *out = s_words[index];
      ok = true;
    }
    xSemaphoreGive(s_mutex);
  }
  return ok;
}

bool wordbook_store_save_progress(size_t index, bool show_gloss)
{
  if (!s_fs_ready) {
    return false;
  }

  wordbook_progress_t prog = {};
  prog.magic = PROGRESS_MAGIC;
  prog.version = PROGRESS_VERSION;
  prog.show_gloss = show_gloss ? 1 : 0;
  prog.index = (uint16_t)index;

  File f = LittleFS.open(PROGRESS_PATH, "w");
  if (!f) {
    ESP_LOGW(TAG, "open %s failed", PROGRESS_PATH);
    return false;
  }
  const size_t n = f.write((const uint8_t *)&prog, sizeof(prog));
  f.flush();
  f.close();

  if (n != sizeof(prog)) {
    ESP_LOGW(TAG, "progress write incomplete");
    return false;
  }

  ESP_LOGI(TAG, "saved progress index=%u gloss=%d", (unsigned)index, (int)show_gloss);
  return true;
}

bool wordbook_store_load_progress(size_t *index, bool *show_gloss)
{
  if (!index || !show_gloss || !s_fs_ready || !LittleFS.exists(PROGRESS_PATH)) {
    return false;
  }

  File f = LittleFS.open(PROGRESS_PATH, "r");
  if (!f) {
    return false;
  }

  wordbook_progress_t prog = {};
  const int n = f.read((uint8_t *)&prog, sizeof(prog));
  f.close();
  if (n != (int)sizeof(prog)
      || prog.magic != PROGRESS_MAGIC
      || prog.version != PROGRESS_VERSION) {
    return false;
  }

  *index = prog.index;
  *show_gloss = prog.show_gloss != 0;
  ESP_LOGI(TAG, "loaded progress index=%u gloss=%d", (unsigned)*index, (int)*show_gloss);
  return true;
}

void wordbook_store_reset_progress(void)
{
  if (s_fs_ready && LittleFS.exists(PROGRESS_PATH)) {
    LittleFS.remove(PROGRESS_PATH);
  }
  (void)wordbook_store_save_progress(0, false);
}

bool wordbook_store_replace_json(const char *json, char *err, size_t err_len)
{
  if (err && err_len > 0) {
    err[0] = '\0';
  }
  if (!json) {
    if (err && err_len > 0) {
      snprintf(err, err_len, "empty body");
    }
    return false;
  }

  cJSON *root = cJSON_Parse(json);
  if (!root) {
    if (err && err_len > 0) {
      snprintf(err, err_len, "invalid json");
    }
    return false;
  }

  cJSON *words = cJSON_GetObjectItemCaseSensitive(root, "words");
  if (!cJSON_IsArray(words)) {
    cJSON_Delete(root);
    if (err && err_len > 0) {
      snprintf(err, err_len, "words array required");
    }
    return false;
  }

  const int n = cJSON_GetArraySize(words);
  if (n <= 0) {
    cJSON_Delete(root);
    if (err && err_len > 0) {
      snprintf(err, err_len, "words is empty");
    }
    return false;
  }
  if (n > WORDBOOK_MAX_WORDS) {
    cJSON_Delete(root);
    if (err && err_len > 0) {
      snprintf(err, err_len, "too many words (max %d)", WORDBOOK_MAX_WORDS);
    }
    return false;
  }

  memset(s_parse_buf, 0, sizeof(s_parse_buf));

  for (int i = 0; i < n; i++) {
    const cJSON *item = cJSON_GetArrayItem(words, i);
    if (!cJSON_IsObject(item)) {
      cJSON_Delete(root);
      if (err && err_len > 0) {
        snprintf(err, err_len, "words[%d] must be object", i);
      }
      return false;
    }

    const char *ja = json_string_field(item, "ja", "expression");
    const char *reading = json_string_field(item, "reading", "reading");
    const char *mn = json_string_field(item, "mn", "gloss");

    if (!ja || ja[0] == '\0') {
      cJSON_Delete(root);
      if (err && err_len > 0) {
        snprintf(err, err_len, "words[%d].ja required", i);
      }
      return false;
    }

    copy_field(s_parse_buf[i].expression, sizeof(s_parse_buf[i].expression), ja);
    copy_field(s_parse_buf[i].reading, sizeof(s_parse_buf[i].reading), reading ? reading : "");
    copy_field(s_parse_buf[i].gloss, sizeof(s_parse_buf[i].gloss), mn ? mn : "");
  }

  cJSON_Delete(root);

  bool saved = false;
  if (s_mutex && xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    s_count = (size_t)n;
    for (int i = 0; i < n; i++) {
      s_words[i] = s_parse_buf[i];
    }
    saved = fs_save_unlocked();
    if (!saved) {
      if (!fs_load_unlocked()) {
        clear_deck_unlocked();
      }
    }
    xSemaphoreGive(s_mutex);
  }

  if (!saved) {
    if (err && err_len > 0) {
      snprintf(err, err_len, "persist failed");
    }
    ESP_LOGW(TAG, "persist failed; deck not updated (%d words)", n);
    return false;
  }

  ESP_LOGI(TAG, "replaced deck with %d words (persisted to LittleFS)", n);
  wordbook_store_reset_progress();
  return true;
}
