#ifndef WORDBOOK_STORE_H
#define WORDBOOK_STORE_H

#include <stddef.h>
#include <stdbool.h>
#include "user_config.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
  char expression[WORDBOOK_MAX_FIELD_LEN];
  char reading[WORDBOOK_MAX_FIELD_LEN];
  char gloss[WORDBOOK_MAX_FIELD_LEN];
} wordbook_word_t;

void wordbook_store_init(void);
size_t wordbook_store_count(void);
bool wordbook_store_get(size_t index, wordbook_word_t *out);
bool wordbook_store_replace_json(const char *json, char *err, size_t err_len);

#ifdef __cplusplus
}
#endif

#endif
