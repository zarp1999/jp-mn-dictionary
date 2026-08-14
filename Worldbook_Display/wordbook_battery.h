#ifndef WORDBOOK_BATTERY_H
#define WORDBOOK_BATTERY_H

#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Display levels: 0=empty .. 3=full (icon bars). */
#define WORDBOOK_BATTERY_LEVEL_MAX 3

void wordbook_battery_init(void);

/* Approximate SoC percent from VBAT (diagnostic). */
bool wordbook_battery_read_percent(int *out_percent);

/*
 * Stable 0..3 level for the battery icon.
 * Uses hysteresis so button-driven redraws do not flicker or "charge up".
 */
bool wordbook_battery_read_level(int *out_level);

#ifdef __cplusplus
}
#endif

#endif
