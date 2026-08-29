#include <stdio.h>
#include <stddef.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "user_app.h"
#include "driver/gpio.h"
#include "user_config.h"
#include "esp_log.h"
#include "esp_err.h"

#include "src/ui_src/generated/gui_guider.h"
#include "src/power/board_power_bsp.h"
#include "src/button_bsp/button_bsp.h"
#include "font_wordbook_18.h"
#include "font_wordbook_32.h"
#include "wordbook_store.h"
#include "wordbook_server.h"
#include "wordbook_battery.h"
#include <WiFi.h>

static const char *TAG = "wordbook";

epaper_driver_display *driver = NULL;
board_power_bsp_t board_div(EPD_PWR_PIN, Audio_PWR_PIN, VBAT_PWR_PIN);

lv_ui src_ui;

static size_t s_index = 0;
static bool s_show_gloss = false;
static EventGroupHandle_t s_ui_events = NULL;
static volatile bool s_ui_dirty = false;
static volatile bool s_shutting_down = false;
static bool s_wifi_client_seen = false;
static uint32_t s_wifi_poll_at_ms = 0;
static uint32_t s_battery_poll_at_ms = 0;
static bool s_battery_charging_ui = false;

#define UI_EVENT_REFRESH set_bit_button(0)

bool wordbook_is_shutting_down(void)
{
  return s_shutting_down;
}

/* Kanji cards send labeled readings ("音読み" / "訓読み"); words do not. */
static bool wordbook_is_kanji_card(const wordbook_word_t *word)
{
  if (word == NULL || word->reading[0] == '\0') {
    return false;
  }
  return strstr(word->reading, "音読み") != NULL
      || strstr(word->reading, "訓読み") != NULL;
}

static void wordbook_set_label_band(lv_obj_t *label, lv_coord_t y, lv_coord_t height)
{
  if (label == NULL) {
    return;
  }
  lv_obj_set_pos(label, 5, y);
  lv_obj_set_height(label, height);
}

/* Kanji reading payload is "音読み: …\\n訓読み: …" — split across two labels. */
static void wordbook_split_kanji_reading(
  const char *reading,
  char *line1,
  size_t line1_len,
  char *line2,
  size_t line2_len)
{
  if (!line1 || line1_len == 0 || !line2 || line2_len == 0) {
    return;
  }
  line1[0] = '\0';
  line2[0] = '\0';
  if (!reading || reading[0] == '\0') {
    return;
  }

  const char *nl = strchr(reading, '\n');
  if (nl) {
    size_t first_len = (size_t)(nl - reading);
    if (first_len >= line1_len) {
      first_len = line1_len - 1;
    }
    memcpy(line1, reading, first_len);
    line1[first_len] = '\0';
    snprintf(line2, line2_len, "%s", nl + 1);
  } else {
    snprintf(line1, line1_len, "%s", reading);
  }
}

static void wordbook_apply_card_layout(bool kanji_card, bool kanji_show_meaning)
{
  if (kanji_card && !kanji_show_meaning) {
    /*
     * 音読み / 訓読み: two bands stacked with no large gap.
     * Each band is tall enough for ~2 wrapped lines (18px font).
     */
    wordbook_set_label_band(src_ui.label_reading, 88, 50);
    wordbook_set_label_band(src_ui.label_gloss, 138, 54);
    lv_obj_set_style_text_align(src_ui.label_reading, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_left(src_ui.label_reading, 8, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_line_space(src_ui.label_reading, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_align(src_ui.label_gloss, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_left(src_ui.label_gloss, 8, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_top(src_ui.label_gloss, 2, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_line_space(src_ui.label_gloss, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
  } else if (kanji_card && kanji_show_meaning) {
    /* Meaning uses a higher, taller band so ~3 wrapped lines are not clipped. */
    wordbook_set_label_band(src_ui.label_reading, 92, 16);
    wordbook_set_label_band(src_ui.label_gloss, 105, 82);
    lv_obj_set_style_text_align(src_ui.label_reading, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_left(src_ui.label_reading, 8, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_align(src_ui.label_gloss, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_left(src_ui.label_gloss, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_top(src_ui.label_gloss, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_line_space(src_ui.label_gloss, 1, LV_PART_MAIN | LV_STATE_DEFAULT);
  } else {
    wordbook_set_label_band(src_ui.label_reading, 92, 54);
    wordbook_set_label_band(src_ui.label_gloss, 150, 42);
    lv_obj_set_style_text_align(src_ui.label_reading, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_left(src_ui.label_reading, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_line_space(src_ui.label_reading, 2, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_align(src_ui.label_gloss, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_left(src_ui.label_gloss, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_top(src_ui.label_gloss, 2, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_line_space(src_ui.label_gloss, 2, LV_PART_MAIN | LV_STATE_DEFAULT);
  }
}

static void wordbook_update_battery_icon(void)
{
  if (src_ui.battery_body == NULL || src_ui.battery_seg[0] == NULL) {
    return;
  }

  int level = 0;
  if (!wordbook_battery_read_level(&level)) {
    level = 0;
  }
  s_battery_charging_ui = wordbook_battery_is_charging();

  /* level 0: outline only; 1..3: that many fill bars from the left. */
  for (int i = 0; i < 3; i++) {
    if (i < level) {
      lv_obj_clear_flag(src_ui.battery_seg[i], LV_OBJ_FLAG_HIDDEN);
    } else {
      lv_obj_add_flag(src_ui.battery_seg[i], LV_OBJ_FLAG_HIDDEN);
    }
  }

  if (src_ui.battery_charge != NULL) {
    if (s_battery_charging_ui) {
      lv_obj_clear_flag(src_ui.battery_charge, LV_OBJ_FLAG_HIDDEN);
    } else {
      lv_obj_add_flag(src_ui.battery_charge, LV_OBJ_FLAG_HIDDEN);
    }
  }

  wordbook_battery_mark_displayed(level, s_battery_charging_ui);
}

static void wordbook_update_wifi_icon(void)
{
  if (src_ui.wifi_icon == NULL) {
    return;
  }

  /* Shift left when charging "+" is visible so icons do not overlap. */
  lv_obj_set_pos(src_ui.wifi_icon, s_battery_charging_ui ? 138 : 148, 5);

  if (wordbook_server_has_client()) {
    lv_obj_clear_flag(src_ui.wifi_icon, LV_OBJ_FLAG_HIDDEN);
  } else {
    lv_obj_add_flag(src_ui.wifi_icon, LV_OBJ_FLAG_HIDDEN);
  }
}

static void wordbook_refresh_ui(void)
{
  wordbook_update_battery_icon();
  wordbook_update_wifi_icon();

  const size_t count = wordbook_store_count();
  if (count == 0) {
    /* Empty deck: Mongolian brand + word-bank count (Cyrillic is in 18px font). */
    lv_obj_set_style_text_font(
      src_ui.label_expression,
      &font_wordbook_18,
      LV_PART_MAIN | LV_STATE_DEFAULT
    );
    lv_label_set_text(src_ui.label_expression, "НИЧИМО толь");
    lv_label_set_text(src_ui.label_reading, "үгийн сан 0");
    lv_label_set_text(src_ui.label_gloss, "");
    lv_label_set_text(src_ui.label_page, "");
    wordbook_apply_card_layout(false, false);
    return;
  }

  /* Restore large headword font after empty-deck (18px) mode. */
  lv_obj_set_style_text_font(
    src_ui.label_expression,
    &font_wordbook_32,
    LV_PART_MAIN | LV_STATE_DEFAULT
  );

  if (s_index >= count) {
    s_index = 0;
  }

  wordbook_word_t word;
  if (!wordbook_store_get(s_index, &word)) {
    return;
  }

  const bool kanji_card = wordbook_is_kanji_card(&word);
  wordbook_apply_card_layout(kanji_card, kanji_card && s_show_gloss);

  char page[16];
  lv_label_set_text(src_ui.label_expression, word.expression);

  if (kanji_card) {
    if (!s_show_gloss) {
      char reading_line1[WORDBOOK_MAX_FIELD_LEN];
      char reading_line2[WORDBOOK_MAX_FIELD_LEN];
      wordbook_split_kanji_reading(
        word.reading,
        reading_line1,
        sizeof(reading_line1),
        reading_line2,
        sizeof(reading_line2)
      );
      lv_label_set_text(src_ui.label_reading, reading_line1);
      lv_label_set_text(src_ui.label_gloss, reading_line2);
    } else {
      lv_label_set_text(src_ui.label_reading, "");
      lv_label_set_text(src_ui.label_gloss, word.gloss);
    }
  } else {
    lv_label_set_text(src_ui.label_reading, word.reading);
    if (s_show_gloss) {
      lv_label_set_text(src_ui.label_gloss, word.gloss);
    } else {
      lv_label_set_text(src_ui.label_gloss, "？");
    }
  }

  snprintf(page, sizeof(page), "%u/%u", (unsigned)(s_index + 1), (unsigned)count);
  lv_label_set_text(src_ui.label_page, page);

  ESP_LOGI(
    TAG,
    "card %u/%u gloss=%d kanji=%d",
    (unsigned)(s_index + 1),
    (unsigned)count,
    (int)s_show_gloss,
    (int)kanji_card
  );
}

static void wordbook_persist_progress(void)
{
  (void)wordbook_store_save_progress(s_index, s_show_gloss);
}

static void wordbook_restore_progress(void)
{
  size_t index = 0;
  bool show_gloss = false;
  if (!wordbook_store_load_progress(&index, &show_gloss)) {
    s_index = 0;
    s_show_gloss = false;
    return;
  }

  const size_t count = wordbook_store_count();
  if (count == 0) {
    s_index = 0;
    s_show_gloss = false;
    return;
  }
  if (index >= count) {
    index = 0;
    show_gloss = false;
  }
  s_index = index;
  s_show_gloss = show_gloss;
}

static void wordbook_on_boot_click(void)
{
  const size_t count = wordbook_store_count();
  if (count == 0) {
    return;
  }

  if (!s_show_gloss) {
    s_show_gloss = true;
  } else {
    s_index = (s_index + 1) % count;
    s_show_gloss = false;
  }
  wordbook_persist_progress();
  /* Mark dirty; actual LVGL update runs in LVGL task. */
  s_ui_dirty = true;
}

/* PWR short click: undo one BOOT step (hide gloss, or go to previous card + show gloss). */
static void wordbook_on_pwr_click(void)
{
  const size_t count = wordbook_store_count();
  if (count == 0) {
    return;
  }

  if (s_show_gloss) {
    s_show_gloss = false;
  } else {
    s_index = (s_index + count - 1) % count;
    s_show_gloss = true;
  }
  wordbook_persist_progress();
  s_ui_dirty = true;
}

/* PWR long press (~1s): try clear e-Paper, then always cut battery latch. */
static void wordbook_shutdown(void)
{
  if (s_shutting_down) {
    return;
  }
  s_shutting_down = true;
  s_ui_dirty = false;
  ESP_LOGW(TAG, "PWR long-press: shutting down");

  /* Persist resume position before cutting power. */
  wordbook_persist_progress();

  /* Stop SoftAP without blocking forever on teardown. */
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_OFF);

  /* Let LVGL finish / skip any in-flight flush before we touch the panel. */
  vTaskDelay(pdMS_TO_TICKS(300));

  /*
   * Best-effort white clear. BUSY waits are time-limited in the driver.
   * If this fails or times out, we still power off.
   */
  if (driver) {
    ESP_LOGI(TAG, "clearing e-Paper before power-off");
    driver->EPD_Init();
    driver->EPD_Clear();
    driver->EPD_DisplayPartBaseImage();
  }

  board_div.POWEER_Audio_OFF();
  board_div.POWEER_EPD_OFF();
  board_div.VBAT_POWER_OFF();
  ESP_LOGW(TAG, "VBAT latch off (USB may keep board alive)");

  vTaskDelay(pdMS_TO_TICKS(200));
  for (;;) {
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

static void wordbook_on_deck_updated(void)
{
  if (s_ui_events) {
    xEventGroupSetBits(s_ui_events, UI_EVENT_REFRESH);
  }
}

static void wordbook_task(void *arg)
{
  (void)arg;
  for (;;) {
    if (s_shutting_down) {
      vTaskDelay(pdMS_TO_TICKS(1000));
      continue;
    }

    EventBits_t boot_bits = xEventGroupWaitBits(
      boot_groups,
      set_bit_button(0),
      pdTRUE,
      pdFALSE,
      pdMS_TO_TICKS(50)
    );

    if (get_bit_button(boot_bits, 0)) {
      wordbook_on_boot_click();
    }

    EventBits_t pwr_bits = xEventGroupWaitBits(
      pwr_groups,
      set_bit_button(0) | set_bit_button(2),
      pdTRUE,
      pdFALSE,
      0
    );

    if (get_bit_button(pwr_bits, 2)) {
      wordbook_shutdown();
      continue;
    }
    if (get_bit_button(pwr_bits, 0)) {
      wordbook_on_pwr_click();
    }

    if (s_ui_events) {
      EventBits_t ui_bits = xEventGroupWaitBits(
        s_ui_events,
        UI_EVENT_REFRESH,
        pdTRUE,
        pdFALSE,
        0
      );
      if (ui_bits & UI_EVENT_REFRESH) {
        s_index = 0;
        s_show_gloss = false;
        wordbook_store_reset_progress();
        s_ui_dirty = true;
        ESP_LOGI(TAG, "deck refresh requested");
      }
    }
  }
}

void wordbook_ui_poll(void)
{
  if (s_shutting_down || !s_ui_dirty) {
    return;
  }
  s_ui_dirty = false;
  wordbook_refresh_ui();
  ESP_LOGI(TAG, "UI refreshed on LVGL task");
}

void user_app_init(void)
{
  board_div.VBAT_POWER_ON();
  board_div.POWEER_EPD_ON();
  board_div.POWEER_Audio_ON();

  custom_lcd_spi_t driver_config = {};
  driver_config.cs = EPD_CS_PIN;
  driver_config.dc = EPD_DC_PIN;
  driver_config.rst = EPD_RST_PIN;
  driver_config.busy = EPD_BUSY_PIN;
  driver_config.mosi = EPD_MOSI_PIN;
  driver_config.scl = EPD_SCK_PIN;
  driver_config.spi_host = EPD_SPI_NUM;
  driver_config.buffer_len = 5000;

  driver = new epaper_driver_display(EPD_WIDTH, EPD_HEIGHT, driver_config);
  driver->EPD_Init();
  driver->EPD_Clear();
  driver->EPD_DisplayPartBaseImage();
  driver->EPD_Init_Partial();

  wordbook_store_init();
  wordbook_battery_init();
  user_button_init();
  s_ui_events = xEventGroupCreate();
}

void user_ui_init(void)
{
  setup_ui(&src_ui);
  wordbook_restore_progress();
  wordbook_refresh_ui();
  wordbook_server_begin(wordbook_on_deck_updated);
  xTaskCreatePinnedToCore(wordbook_task, "wordbook_task", 4 * 1024, NULL, 4, NULL, 1);
  ESP_LOGI(
    TAG,
    "Phase2 ready words=%u ssid=%s pass=%s",
    (unsigned)wordbook_store_count(),
    WORDBOOK_WIFI_SSID,
    WORDBOOK_WIFI_PASSWORD
  );
}

void user_app_loop(void)
{
  if (s_shutting_down) {
    return;
  }
  wordbook_server_loop();

  const uint32_t now = millis();

  /* SoftAP associate/disassociate → show/hide Wi-Fi icon (throttled). */
  if ((int32_t)(now - s_wifi_poll_at_ms) >= 500) {
    s_wifi_poll_at_ms = now;
    const bool connected = wordbook_server_has_client();
    if (connected != s_wifi_client_seen) {
      s_wifi_client_seen = connected;
      s_ui_dirty = true;
      ESP_LOGI(TAG, "SoftAP client %s", connected ? "connected" : "disconnected");
    }
  }

  /*
   * Idle / charging: re-sample battery on an interval.
   * Redraw e-Paper only when level bars or charging mark change.
   */
  if ((int32_t)(now - s_battery_poll_at_ms) >= (int32_t)WORDBOOK_BATTERY_POLL_MS) {
    s_battery_poll_at_ms = now;
    int level = 0;
    bool charging = false;
    bool changed = false;
    if (wordbook_battery_poll(&level, &charging, &changed) && changed) {
      s_ui_dirty = true;
      ESP_LOGI(
        TAG,
        "battery status changed level=%d charging=%d",
        level,
        (int)charging
      );
    }
  }
}
