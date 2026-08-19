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

static void wordbook_apply_card_layout(bool kanji_card)
{
  if (kanji_card) {
    lv_obj_set_style_text_align(src_ui.label_reading, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_left(src_ui.label_reading, 8, LV_PART_MAIN | LV_STATE_DEFAULT);
  } else {
    lv_obj_set_style_text_align(src_ui.label_reading, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_left(src_ui.label_reading, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
  }
  /* Gloss / meaning is always centered for both kanji and word cards. */
  lv_obj_set_style_text_align(src_ui.label_gloss, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN | LV_STATE_DEFAULT);
  lv_obj_set_style_pad_left(src_ui.label_gloss, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
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

  /* level 0: outline only; 1..3: that many fill bars from the left. */
  for (int i = 0; i < 3; i++) {
    if (i < level) {
      lv_obj_clear_flag(src_ui.battery_seg[i], LV_OBJ_FLAG_HIDDEN);
    } else {
      lv_obj_add_flag(src_ui.battery_seg[i], LV_OBJ_FLAG_HIDDEN);
    }
  }
}

static void wordbook_update_wifi_icon(void)
{
  if (src_ui.wifi_icon == NULL) {
    return;
  }

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
    wordbook_apply_card_layout(false);
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
  wordbook_apply_card_layout(kanji_card);

  char page[16];
  lv_label_set_text(src_ui.label_expression, word.expression);
  lv_label_set_text(src_ui.label_reading, word.reading);

  if (s_show_gloss) {
    lv_label_set_text(src_ui.label_gloss, word.gloss);
  } else {
    lv_label_set_text(src_ui.label_gloss, "？");
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

  /* SoftAP associate/disassociate → show/hide Wi-Fi icon (throttled). */
  const uint32_t now = millis();
  if ((int32_t)(now - s_wifi_poll_at_ms) >= 500) {
    s_wifi_poll_at_ms = now;
    const bool connected = wordbook_server_has_client();
    if (connected != s_wifi_client_seen) {
      s_wifi_client_seen = connected;
      s_ui_dirty = true;
      ESP_LOGI(TAG, "SoftAP client %s", connected ? "connected" : "disconnected");
    }
  }
}
