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

    /* Page indicator: top-right */
    ui->label_page = lv_label_create(ui->screen);
    lv_obj_set_width(ui->label_page, 90);
    lv_obj_set_height(ui->label_page, 20);
    lv_obj_set_pos(ui->label_page, 105, 4);
    lv_obj_set_style_text_font(ui->label_page, &font_wordbook_18, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_color(ui->label_page, lv_color_hex(0x000000), LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_align(ui->label_page, LV_TEXT_ALIGN_RIGHT, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_label_set_long_mode(ui->label_page, LV_LABEL_LONG_CLIP);

    /* Headword + reading + gloss (alignment adjusted at runtime for kanji vs word) */
    ui->label_expression = create_centered_label(ui->screen, 32, 70, &font_wordbook_32);
    ui->label_reading = create_centered_label(ui->screen, 108, 44, &font_wordbook_18);
    ui->label_gloss = create_centered_label(ui->screen, 156, 36, &font_wordbook_18);
    ui->label_hint = NULL;

    lv_obj_set_style_text_line_space(ui->label_expression, 2, LV_PART_MAIN | LV_STATE_DEFAULT);
    lv_obj_set_style_text_line_space(ui->label_reading, 2, LV_PART_MAIN | LV_STATE_DEFAULT);

    lv_obj_update_layout(ui->screen);
}
