#include "wordbook_battery.h"

#include <Arduino.h>
#include "user_config.h"
#include "esp_log.h"

static const char *TAG = "wordbook_bat";

/* Sticky icon level; -1 means uninitialized. */
static int s_level = -1;
static float s_last_vbat = 0.0f;
static bool s_charging = false;
static int s_reported_level = -1;
static bool s_reported_charging = false;

static bool read_vbat_volts(float *out_vbat, int *out_percent)
{
  if (!out_vbat) {
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
  *out_vbat = vbat;

  if (out_percent) {
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
  }
  return true;
}

static void update_charging_from_vbat(float vbat)
{
  /*
   * No dedicated CHRG GPIO in this project — infer from VBAT trend.
   * Rising voltage ⇒ charging; clear drop ⇒ not charging.
   */
  if (s_last_vbat > 0.1f) {
    if (vbat >= s_last_vbat + 0.020f) {
      s_charging = true;
    } else if (vbat <= s_last_vbat - 0.035f) {
      s_charging = false;
    }
  }
  /* Near full while still rising/stable high: keep charging mark until drop. */
  if (s_charging && vbat >= 4.16f) {
    s_charging = true;
  }
  s_last_vbat = vbat;
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

static void apply_level_hysteresis(int pct)
{
  const int raw = level_from_percent(pct);
  if (s_level < 0) {
    s_level = raw;
    return;
  }

  if (s_charging) {
    /* While charging, allow rising toward the raw estimate one step at a time. */
    if (raw > s_level) {
      s_level++;
    } else if (pct < 12 && s_level > 0) {
      s_level--;
    } else if (pct < 35 && s_level > 1) {
      s_level--;
    } else if (pct < 60 && s_level > 2) {
      s_level--;
    }
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
}

void wordbook_battery_init(void)
{
  analogReadResolution(12);
  analogSetPinAttenuation(BAT_ADC_PIN, ADC_11db);
  s_level = -1;
  s_last_vbat = 0.0f;
  s_charging = false;
  s_reported_level = -1;
  s_reported_charging = false;
  ESP_LOGI(TAG, "battery ADC ready on GPIO%d", (int)BAT_ADC_PIN);
}

bool wordbook_battery_read_percent(int *out_percent)
{
  float vbat = 0.0f;
  return read_vbat_volts(&vbat, out_percent);
}

bool wordbook_battery_is_charging(void)
{
  return s_charging;
}

bool wordbook_battery_read_level(int *out_level)
{
  if (!out_level) {
    return false;
  }

  float vbat = 0.0f;
  int pct = 0;
  if (!read_vbat_volts(&vbat, &pct)) {
    return false;
  }
  update_charging_from_vbat(vbat);
  apply_level_hysteresis(pct);

  *out_level = s_level;
  ESP_LOGI(TAG, "battery pct=%d level=%d charging=%d vbat=%.3f", pct, s_level, (int)s_charging, vbat);
  return true;
}

bool wordbook_battery_poll(int *out_level, bool *out_charging, bool *changed)
{
  int level = 0;
  if (!wordbook_battery_read_level(&level)) {
    return false;
  }

  const bool charging = s_charging;
  const bool did_change =
    (s_reported_level < 0)
    || (level != s_reported_level)
    || (charging != s_reported_charging);

  s_reported_level = level;
  s_reported_charging = charging;

  if (out_level) {
    *out_level = level;
  }
  if (out_charging) {
    *out_charging = charging;
  }
  if (changed) {
    *changed = did_change;
  }
  return true;
}

void wordbook_battery_mark_displayed(int level, bool charging)
{
  s_reported_level = level;
  s_reported_charging = charging;
}
