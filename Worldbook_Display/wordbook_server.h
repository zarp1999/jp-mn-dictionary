#ifndef WORDBOOK_SERVER_H
#define WORDBOOK_SERVER_H

#ifdef __cplusplus
extern "C" {
#endif

typedef void (*wordbook_server_on_update_cb)(void);

void wordbook_server_begin(wordbook_server_on_update_cb on_update);
void wordbook_server_loop(void);

#ifdef __cplusplus
}
#endif

#endif
