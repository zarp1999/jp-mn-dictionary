#include "wordbook_store.h"

#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "esp_log.h"
#include "nvs.h"
#include "nvs_flash.h"
#include "cJSON.h"

static const char *TAG = "wordbook_store";
static const char *NVS_NS = "wordbook";
static const char *NVS_KEY_COUNT = "count";
static const char *NVS_KEY_DATA = "data";

static wordbook_word_t s_words[WORDBOOK_MAX_WORDS];
static wordbook_word_t s_parse_buf[WORDBOOK_MAX_WORDS]; /* avoid large stack in HTTP task */
static size_t s_count = 0;
static SemaphoreHandle_t s_mutex = NULL;

static const wordbook_word_t kDefaultWords[] = {
  {"食べる", "たべる", "идэх"},
  {"行く", "いく", "явах"},
  {"見る", "みる", "харах"},
  {"大きい", "おおきい", "том"},
  {"水", "みず", "ус"},
};

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

static void load_defaults_unlocked(void)
{
  s_count = sizeof(kDefaultWords) / sizeof(kDefaultWords[0]);
  for (size_t i = 0; i < s_count; i++) {
    s_words[i] = kDefaultWords[i];
  }
}

static bool nvs_load_unlocked(void)
{
  nvs_handle_t handle;
  esp_err_t err = nvs_open(NVS_NS, NVS_READONLY, &handle);
  if (err != ESP_OK) {
    return false;
  }

  uint8_t count = 0;
  err = nvs_get_u8(handle, NVS_KEY_COUNT, &count);
  if (err != ESP_OK || count == 0 || count > WORDBOOK_MAX_WORDS) {
    nvs_close(handle);
    return false;
  }

  size_t data_size = 0;
  err = nvs_get_blob(handle, NVS_KEY_DATA, NULL, &data_size);
  if (err != ESP_OK || data_size != ((size_t)count * sizeof(wordbook_word_t))) {
    nvs_close(handle);
    return false;
  }

  err = nvs_get_blob(handle, NVS_KEY_DATA, s_words, &data_size);
  nvs_close(handle);
  if (err != ESP_OK) {
    return false;
  }

  s_count = count;
  ESP_LOGI(TAG, "loaded %u words from NVS", (unsigned)s_count);
  return true;
}

static void nvs_save_unlocked(void)
{
  nvs_handle_t handle;
  esp_err_t err = nvs_open(NVS_NS, NVS_READWRITE, &handle);
  if (err != ESP_OK) {
    ESP_LOGW(TAG, "nvs_open failed: %s", esp_err_to_name(err));
    return;
  }

  err = nvs_set_u8(handle, NVS_KEY_COUNT, (uint8_t)s_count);
  if (err == ESP_OK) {
    err = nvs_set_blob(handle, NVS_KEY_DATA, s_words, s_count * sizeof(wordbook_word_t));
  }
  if (err == ESP_OK) {
    err = nvs_commit(handle);
  }
  nvs_close(handle);

  if (err != ESP_OK) {
    ESP_LOGW(TAG, "nvs save failed: %s", esp_err_to_name(err));
  } else {
    ESP_LOGI(TAG, "saved %u words to NVS", (unsigned)s_count);
  }
}

void wordbook_store_init(void)
{
  if (s_mutex == NULL) {
    s_mutex = xSemaphoreCreateMutex();
  }

  esp_err_t err = nvs_flash_init();
  if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
    nvs_flash_erase();
    err = nvs_flash_init();
  }
  if (err != ESP_OK) {
    ESP_LOGW(TAG, "nvs_flash_init failed: %s", esp_err_to_name(err));
  }

  if (s_mutex && xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    if (!nvs_load_unlocked()) {
      load_defaults_unlocked();
      ESP_LOGI(TAG, "initialized with %u default words", (unsigned)s_count);
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

  if (s_mutex && xSemaphoreTake(s_mutex, portMAX_DELAY) == pdTRUE) {
    s_count = (size_t)n;
    for (int i = 0; i < n; i++) {
      s_words[i] = s_parse_buf[i];
    }
    nvs_save_unlocked();
    xSemaphoreGive(s_mutex);
  }

  ESP_LOGI(TAG, "replaced deck with %d words", n);
  return true;
}
