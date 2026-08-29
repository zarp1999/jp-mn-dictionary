#include "lvgl.h"
#include <stdio.h>
#include "gui_guider.h"
#include "events_init.h"
#include "widgets_init.h"
#include "../custom/custom.h"
#include "font_wordbook_18.h"
#include "font_wordbook_32.h"

static lv_obj_t *create_centered_label(lv_obj_t *parent, lv_coord_t y, lv_coord_t height, const lv_font_t *font)
{
    lv_obj_t *label = lv_label_create(parent);
    lv_obj_set_width(label, 190);
    lv_obj_set_height(label, height);
    lv_obj_set_pos(label, 5, y);
    lv_obj_set_style_text_font(label, font, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_color(label, lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_align(label, LV_TEXT_ALIGN_CENTER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_top(label, 2, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_label_set_long_mode(label, LV_LABEL_LONG_WRAP);
    return label;
}

void setup_scr_screen(lv_ui *ui)
{
    ui->screen = lv_obj_create(NULL);
    lv_obj_set_size(ui->screen, 200, 200);
    lv_obj_set_scrollbar_mode(ui->screen, LV_SCROLLBAR_MODE_OFF);
    lv_obj_set_style_bg_opa(ui->screen, 255, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_bg_color(ui->screen, lv_color_hex(0xffffff), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_bg_grad_dir(ui->screen, LV_GRAD_DIR_NONE, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_all(ui->screen, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(ui->screen, 0, LV_PART_MAIN | LV_STATE_DEFAULT);

    /* Page indicator: top-left */
    ui->label_page = lv_label_create(ui->screen);
    lv_obj_set_width(ui->label_page, 90);
    lv_obj_set_height(ui->label_page, 20);
    lv_obj_set_pos(ui->label_page, 5, 4);
    lv_obj_set_style_text_font(ui->label_page, &font_wordbook_18, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_color(ui->label_page, lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_align(ui->label_page, LV_TEXT_ALIGN_LEFT, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_label_set_long_mode(ui->label_page, LV_LABEL_LONG_CLIP);

    ui->label_battery = NULL;

    /*
     * Top-right status: [Wi-Fi icon][battery]
     * Wi-Fi sits just left of the battery; hidden when no SoftAP client.
     */
    ui->wifi_icon = lv_obj_create(ui->screen);
    lv_obj_set_size(ui->wifi_icon, 16, 12);
    lv_obj_set_pos(ui->wifi_icon, 148, 5);
    lv_obj_set_style_bg_opa(ui->wifi_icon, LV_OPA_TRANSP, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(ui->wifi_icon, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_all(ui->wifi_icon, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_clear_flag(ui->wifi_icon, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_add_flag(ui->wifi_icon, LV_OBJ_FLAG_HIDDEN);

    /* Approximate Wi-Fi glyph: 3 widening bars + center dot. */
    static const lv_coord_t arc_w[3] = {6, 10, 14};
    static const lv_coord_t arc_y[3] = {7, 4, 1};
    for (int i = 0; i < 3; i++) {
        ui->wifi_arc[i] = lv_obj_create(ui->wifi_icon);
        lv_obj_set_size(ui->wifi_arc[i], arc_w[i], 2);
        lv_obj_set_pos(ui->wifi_arc[i], (16 - arc_w[i]) / 2, arc_y[i]);
        lv_obj_set_style_bg_color(ui->wifi_arc[i], lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_set_style_bg_opa(ui->wifi_arc[i], LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_set_style_border_width(ui->wifi_arc[i], 0, LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_set_style_radius(ui->wifi_arc[i], 1, LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_clear_flag(ui->wifi_arc[i], LV_OBJ_FLAG_SCROLLABLE);
    }

    ui->wifi_dot = lv_obj_create(ui->wifi_icon);
    lv_obj_set_size(ui->wifi_dot, 3, 3);
    lv_obj_set_pos(ui->wifi_dot, 6, 9);
    lv_obj_set_style_bg_color(ui->wifi_dot, lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_bg_opa(ui->wifi_dot, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(ui->wifi_dot, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_radius(ui->wifi_dot, LV_RADIUS_CIRCLE, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_clear_flag(ui->wifi_dot, LV_OBJ_FLAG_SCROLLABLE);

    /* Battery icon: top-right (outline + tip + up to 3 fill bars). */
    ui->battery_body = lv_obj_create(ui->screen);
    lv_obj_set_size(ui->battery_body, 22, 10);
    lv_obj_set_pos(ui->battery_body, 170, 6);
    lv_obj_set_style_bg_opa(ui->battery_body, LV_OPA_TRANSP, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(ui->battery_body, 1, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_color(ui->battery_body, lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_radius(ui->battery_body, 1, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_all(ui->battery_body, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_clear_flag(ui->battery_body, LV_OBJ_FLAG_SCROLLABLE);

    ui->battery_tip = lv_obj_create(ui->screen);
    lv_obj_set_size(ui->battery_tip, 2, 4);
    lv_obj_set_pos(ui->battery_tip, 192, 9);
    lv_obj_set_style_bg_color(ui->battery_tip, lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_bg_opa(ui->battery_tip, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(ui->battery_tip, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_radius(ui->battery_tip, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_clear_flag(ui->battery_tip, LV_OBJ_FLAG_SCROLLABLE);

    for (int i = 0; i < 3; i++) {
        ui->battery_seg[i] = lv_obj_create(ui->screen);
        lv_obj_set_size(ui->battery_seg[i], 4, 6);
        lv_obj_set_pos(ui->battery_seg[i], 173 + i * 5, 8);
        lv_obj_set_style_bg_color(ui->battery_seg[i], lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_set_style_bg_opa(ui->battery_seg[i], LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_set_style_border_width(ui->battery_seg[i], 0, LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_set_style_radius(ui->battery_seg[i], 0, LV_PART_MAIN | LV_STATE_DEFAULT);
        lv_obj_clear_flag(ui->battery_seg[i], LV_OBJ_FLAG_SCROLLABLE);
        lv_obj_add_flag(ui->battery_seg[i], LV_OBJ_FLAG_HIDDEN);
    }

    /* Charging mark ("+") just left of the battery outline. */
    ui->battery_charge = lv_obj_create(ui->screen);
    lv_obj_set_size(ui->battery_charge, 8, 8);
    lv_obj_set_pos(ui->battery_charge, 160, 7);
    lv_obj_set_style_bg_opa(ui->battery_charge, LV_OPA_TRANSP, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(ui->battery_charge, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_pad_all(ui->battery_charge, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_clear_flag(ui->battery_charge, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_add_flag(ui->battery_charge, LV_OBJ_FLAG_HIDDEN);

    ui->battery_charge_h = lv_obj_create(ui->battery_charge);
    lv_obj_set_size(ui->battery_charge_h, 6, 2);
    lv_obj_set_pos(ui->battery_charge_h, 1, 3);
    lv_obj_set_style_bg_color(ui->battery_charge_h, lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_bg_opa(ui->battery_charge_h, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(ui->battery_charge_h, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_radius(ui->battery_charge_h, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_clear_flag(ui->battery_charge_h, LV_OBJ_FLAG_SCROLLABLE);

    ui->battery_charge_v = lv_obj_create(ui->battery_charge);
    lv_obj_set_size(ui->battery_charge_v, 2, 6);
    lv_obj_set_pos(ui->battery_charge_v, 3, 1);
    lv_obj_set_style_bg_color(ui->battery_charge_v, lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_bg_opa(ui->battery_charge_v, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_border_width(ui->battery_charge_v, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_radius(ui->battery_charge_v, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_clear_flag(ui->battery_charge_v, LV_OBJ_FLAG_SCROLLABLE);

    /* Headword + reading + gloss (geometry adjusted at runtime for kanji vs word) */
    ui->label_expression = create_centered_label(ui->screen, 28, 60, &font_wordbook_32);
    ui->label_reading = create_centered_label(ui->screen, 92, 54, &font_wordbook_18);
    ui->label_gloss = create_centered_label(ui->screen, 150, 42, &font_wordbook_18);
    ui->label_hint = NULL;

    lv_obj_set_style_text_line_space(ui->label_expression, 2, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_line_space(ui->label_reading, 0, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_line_space(ui->label_gloss, 0, LV_PART_MAIN | LV_STATE_DEFAULT);

    lv_obj_update_layout(ui->screen);
}
