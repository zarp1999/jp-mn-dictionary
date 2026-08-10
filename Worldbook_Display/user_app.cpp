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
#include "wordbook_store.h"
#include "wordbook_server.h"

static const char *TAG = "wordbook";

epaper_driver_display *driver = NULL;
board_power_bsp_t board_div(EPD_PWR_PIN, Audio_PWR_PIN, VBAT_PWR_PIN);

lv_ui src_ui;

static size_t s_index = 0;
static bool s_show_gloss = false;
static EventGroupHandle_t s_ui_events = NULL;
static volatile bool s_ui_dirty = false;

#define UI_EVENT_REFRESH set_bit_button(0)

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

static void wordbook_refresh_ui(void)
{
  const size_t count = wordbook_store_count();
  if (count == 0) {
    lv_label_set_text(src_ui.label_expression, "-");
    lv_label_set_text(src_ui.label_reading, "");
    lv_label_set_text(src_ui.label_gloss, "");
    lv_label_set_text(src_ui.label_page, "0/0");
    wordbook_apply_card_layout(false);
    return;
  }

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
  s_ui_dirty = true;
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
      set_bit_button(0),
      pdTRUE,
      pdFALSE,
      0
    );

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
        s_ui_dirty = true;
        ESP_LOGI(TAG, "deck refresh requested");
      }
    }
  }
}

void wordbook_ui_poll(void)
{
  if (!s_ui_dirty) {
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
  user_button_init();
  s_ui_events = xEventGroupCreate();
}

void user_ui_init(void)
{
  setup_ui(&src_ui);
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
  wordbook_server_loop();
}
