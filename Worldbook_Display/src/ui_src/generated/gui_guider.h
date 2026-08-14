#ifndef GUI_GUIDER_H
#define GUI_GUIDER_H
#ifdef __cplusplus
extern "C" {
#endif

#include "lvgl.h"

typedef struct
{
	lv_obj_t *screen;
	bool screen_del;
	lv_obj_t *label_expression;
	lv_obj_t *label_reading;
	lv_obj_t *label_gloss;
	lv_obj_t *label_page;
	lv_obj_t *battery_body;   /* top-right outline */
	lv_obj_t *battery_tip;    /* nub on the right */
	lv_obj_t *battery_seg[3]; /* fill bars (left→right) */
	lv_obj_t *wifi_icon;      /* container; hidden when no SoftAP client */
	lv_obj_t *wifi_dot;
	lv_obj_t *wifi_arc[3];    /* radio arcs, small→large */
	lv_obj_t *label_battery;  /* unused; kept NULL for compatibility */
	lv_obj_t *label_hint; /* unused; kept for compatibility */
} lv_ui;

typedef void (*ui_setup_scr_t)(lv_ui * ui);

void ui_init_style(lv_style_t * style);

void ui_load_scr_animation(lv_ui *ui, lv_obj_t ** new_scr, bool new_scr_del, bool * old_scr_del, ui_setup_scr_t setup_scr,
                           lv_scr_load_anim_t anim_type, uint32_t time, uint32_t delay, bool is_clean, bool auto_del);

void ui_animation(void * var, int32_t duration, int32_t delay, int32_t start_value, int32_t end_value, lv_anim_path_cb_t path_cb,
                       uint16_t repeat_cnt, uint32_t repeat_delay, uint32_t playback_time, uint32_t playback_delay,
                       lv_anim_exec_xcb_t exec_cb, lv_anim_start_cb_t start_cb, lv_anim_ready_cb_t ready_cb, lv_anim_deleted_cb_t deleted_cb);

void init_scr_del_flag(lv_ui *ui);
void setup_ui(lv_ui *ui);
void init_keyboard(lv_ui *ui);
void setup_scr_screen(lv_ui *ui);

extern lv_ui guider_ui;

#ifdef __cplusplus
}
#endif
#endif
