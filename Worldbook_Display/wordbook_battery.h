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
 * Uses hysteresis so button-driven redraws do not flicker.
 * When charging is detected, rising is allowed more readily.
 */
bool wordbook_battery_read_level(int *out_level);

/* True while VBAT trend indicates charging (USB charge heuristic). */
bool wordbook_battery_is_charging(void);

/*
 * Periodic sample: updates level + charging estimate.
 * *changed is true when icon level or charging flag differs from the
 * last value returned by this function (for e-Paper redraw gating).
 */
bool wordbook_battery_poll(int *out_level, bool *out_charging, bool *changed);

/* Call after the UI paints battery so the next poll only redraws on real change. */
void wordbook_battery_mark_displayed(int level, bool charging);

#ifdef __cplusplus
}
#endif

#endif
