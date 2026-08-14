#include "wordbook_server.h"

#include <WiFi.h>
#include <WebServer.h>
#include <stdio.h>
#include <string.h>
#include "esp_log.h"
#include "user_config.h"
#include "wordbook_store.h"

static const char *TAG = "wordbook_server";

static WebServer s_server(WORDBOOK_HTTP_PORT);
static wordbook_server_on_update_cb s_on_update = NULL;
static char s_body[WORDBOOK_MAX_BODY_LEN];
static uint32_t s_notify_at_ms = 0;

static void send_json(int code, const char *json)
{
  s_server.sendHeader("Access-Control-Allow-Origin", "*");
  s_server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  s_server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  s_server.sendHeader("Connection", "close");
  s_server.send(code, "application/json; charset=utf-8", json);
}

static void handle_options(void)
{
  s_server.sendHeader("Access-Control-Allow-Origin", "*");
  s_server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  s_server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  s_server.send(204);
}

static void schedule_ui_notify(void)
{
  /* Refresh e-Paper only after HTTP response has time to finish. */
  s_notify_at_ms = millis() + 1000;
}

static void handle_root(void)
{
  char msg[384];
  snprintf(
    msg,
    sizeof(msg),
    "{"
    "\"ok\":true,"
    "\"ssid\":\"%s\","
    "\"ip\":\"%s\","
    "\"words\":%u,"
    "\"endpoints\":["
    "\"GET /\","
    "\"GET /words\","
    "\"POST /words\""
    "]"
    "}",
    WORDBOOK_WIFI_SSID,
    WiFi.softAPIP().toString().c_str(),
    (unsigned)wordbook_store_count()
  );
  send_json(200, msg);
}

static void handle_get_words(void)
{
  const size_t count = wordbook_store_count();
  String json = "{\"words\":[";

  for (size_t i = 0; i < count; i++) {
    wordbook_word_t word;
    if (!wordbook_store_get(i, &word)) {
      continue;
    }
    if (i > 0) {
      json += ",";
    }
    json += "{\"ja\":\"";
    json += word.expression;
    json += "\",\"reading\":\"";
    json += word.reading;
    json += "\",\"mn\":\"";
    json += word.gloss;
    json += "\"}";
  }

  json += "]}";
  send_json(200, json.c_str());
}

static void handle_post_words(void)
{
  ESP_LOGI(TAG, "POST /words begin");

  if (!s_server.hasArg("plain")) {
    ESP_LOGW(TAG, "POST missing body");
    send_json(400, "{\"ok\":false,\"error\":\"JSON body required\"}");
    return;
  }

  const String &body = s_server.arg("plain");
  ESP_LOGI(TAG, "POST body len=%u", (unsigned)body.length());

  if (body.length() == 0) {
    send_json(400, "{\"ok\":false,\"error\":\"empty body\"}");
    return;
  }
  if (body.length() >= sizeof(s_body)) {
    send_json(413, "{\"ok\":false,\"error\":\"body too large\"}");
    return;
  }

  memcpy(s_body, body.c_str(), body.length());
  s_body[body.length()] = '\0';

  char err[96];
  if (!wordbook_store_replace_json(s_body, err, sizeof(err))) {
    char msg[160];
    snprintf(msg, sizeof(msg), "{\"ok\":false,\"error\":\"%s\"}", err[0] ? err : "replace failed");
    ESP_LOGW(TAG, "POST replace failed: %s", err[0] ? err : "unknown");
    send_json(400, msg);
    return;
  }

  char msg[96];
  snprintf(
    msg,
    sizeof(msg),
    "{\"ok\":true,\"count\":%u}",
    (unsigned)wordbook_store_count()
  );

  /* Reply first so the client is not reset by a later e-Paper refresh. */
  send_json(200, msg);
  ESP_LOGI(TAG, "POST /words accepted (%u), UI notify scheduled", (unsigned)wordbook_store_count());
  schedule_ui_notify();
}

static void handle_not_found(void)
{
  send_json(404, "{\"ok\":false,\"error\":\"not found\"}");
}

void wordbook_server_begin(wordbook_server_on_update_cb on_update)
{
  s_on_update = on_update;
  s_notify_at_ms = 0;

  WiFi.mode(WIFI_AP);
  const bool ok = WiFi.softAP(WORDBOOK_WIFI_SSID, WORDBOOK_WIFI_PASSWORD);
  if (!ok) {
    ESP_LOGE(TAG, "softAP failed");
    return;
  }

  delay(100);

  s_server.on("/", HTTP_GET, handle_root);
  s_server.on("/", HTTP_OPTIONS, handle_options);
  s_server.on("/words", HTTP_GET, handle_get_words);
  s_server.on("/words", HTTP_POST, handle_post_words);
  s_server.on("/words", HTTP_OPTIONS, handle_options);
  s_server.onNotFound(handle_not_found);
  s_server.begin();

  ESP_LOGI(
    TAG,
    "AP ready ssid=%s pass=%s ip=%s",
    WORDBOOK_WIFI_SSID,
    WORDBOOK_WIFI_PASSWORD,
    WiFi.softAPIP().toString().c_str()
  );
}

bool wordbook_server_has_client(void)
{
  return WiFi.softAPgetStationNum() > 0;
}

void wordbook_server_loop(void)
{
  s_server.handleClient();

  if (s_notify_at_ms != 0 && (int32_t)(millis() - s_notify_at_ms) >= 0) {
    s_notify_at_ms = 0;
    if (s_on_update) {
      ESP_LOGI(TAG, "firing deferred UI notify");
      s_on_update();
    }
  }
}
