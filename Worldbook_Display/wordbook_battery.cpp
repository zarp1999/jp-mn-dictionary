#include "wordbook_battery.h"

#include <Arduino.h>
#include "user_config.h"
#include "esp_log.h"

static const char *TAG = "wordbook_bat";

/* Sticky icon level; -1 means uninitialized. */
static int s_level = -1;

void wordbook_battery_init(void)
{
  analogReadResolution(12);
  analogSetPinAttenuation(BAT_ADC_PIN, ADC_11db);
  s_level = -1;
  ESP_LOGI(TAG, "battery ADC ready on GPIO%d", (int)BAT_ADC_PIN);
}

bool wordbook_battery_read_percent(int *out_percent)
{
  if (!out_percent) {
    return false;
  }

  const int samples = 8;
  uint32_t sum_mv = 0;
  for (int i = 0; i < samples; i++) {
    sum_mv += (uint32_t)analogReadMilliVolts(BAT_ADC_PIN);
  }
  const float vadc_v = ((float)sum_mv / (float)samples) / 1000.0f;

  /* Board divider R21/R38: VBAT = VADC * 2 */
  const float vbat = vadc_v * 2.0f;

  /* Linear Li-ion estimate (not a coulomb fuel gauge). */
  const float vmin = 3.30f;
  const float vmax = 4.20f;
  float pct = (vbat - vmin) / (vmax - vmin) * 100.0f;
  if (pct < 0.0f) {
    pct = 0.0f;
  }
  if (pct > 100.0f) {
    pct = 100.0f;
  }

  *out_percent = (int)(pct + 0.5f);
  return true;
}

static int level_from_percent(int pct)
{
  if (pct < 20) {
    return 0;
  }
  if (pct < 45) {
    return 1;
  }
  if (pct < 70) {
    return 2;
  }
  return 3;
}

bool wordbook_battery_read_level(int *out_level)
{
  if (!out_level) {
    return false;
  }

  int pct = 0;
  if (!wordbook_battery_read_percent(&pct)) {
    return false;
  }

  /*
   * Hysteresis (percent):
   *   drop 3→2 below 60, 2→1 below 35, 1→0 below 12
   *   rise 0→1 above 28, 1→2 above 55, 2→3 above 80
   * At most one step per sample so ADC noise cannot jump levels.
   */
  if (s_level < 0) {
    s_level = level_from_percent(pct);
  } else if (pct < 12 && s_level > 0) {
    s_level--;
  } else if (pct < 35 && s_level > 1) {
    s_level--;
  } else if (pct < 60 && s_level > 2) {
    s_level--;
  } else if (pct > 80 && s_level < 3) {
    s_level++;
  } else if (pct > 55 && s_level < 2) {
    s_level++;
  } else if (pct > 28 && s_level < 1) {
    s_level++;
  }

  if (s_level < 0) {
    s_level = 0;
  }
  if (s_level > WORDBOOK_BATTERY_LEVEL_MAX) {
    s_level = WORDBOOK_BATTERY_LEVEL_MAX;
  }

  *out_level = s_level;
  ESP_LOGI(TAG, "battery pct=%d level=%d", pct, s_level);
  return true;
}
