/**
 * Flood Monitoring — ESP32 + ultrasonik + buzzer + relay (aktif LOW).
 * Salinan kerja untuk upload; sama logika dengan folder Flood_Monitoring_System.
 * POST /api/ingest + X-API-KEY — samakan API_KEY dengan database (ApiClientSeeder).
 */
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#if defined(ESP32)
#include <WiFi.h>
#include <HTTPClient.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#endif

const char *WIFI_SSID = "Dangpuuu";
const char *WIFI_PASSWORD = "raditya16";
const char *API_HOST = "http://10.57.212.217:8000";
const char *API_KEY = "FLOOD-SECRET-KEY-2025";
// ID teknis ke API (tetap DEV001). Nama tampilan di server: Ciledug-Dapa
const char *DEVICE_ID = "DEV001";

LiquidCrystal_I2C lcd(0x27, 16, 2);

#define TRIG_PIN 5
#define ECHO_PIN 18
#define BUZZER 23
#define RELAY_PIN 26

long duration;
float distance;
float tinggiAir;

/** true = relay hanya diatur dari antrian perintah (pump_on / pump_off); false = ikuti logika sensor */
bool manualRelayMode = false;

#if defined(ESP32) || defined(ESP8266)
static long extractJsonLong(const String &json, const char *key) {
    String needle = String("\"") + key + "\":";
    int p = json.indexOf(needle);
    if (p < 0) {
        return -1;
    }
    p += needle.length();
    while (p < (int)json.length() && json.charAt(p) == ' ') {
        p++;
    }
    if (p >= (int)json.length() || !isDigit(json.charAt(p))) {
        return -1;
    }
    int q = p;
    while (q < (int)json.length() && isDigit(json.charAt(q))) {
        q++;
    }
    return json.substring(p, q).toInt();
}

static String extractJsonString(const String &json, const char *key) {
    String needle = String("\"") + key + "\":\"";
    int p = json.indexOf(needle);
    if (p < 0) {
        return "";
    }
    p += needle.length();
    int q = json.indexOf("\"", p);
    if (q < 0) {
        return "";
    }
    return json.substring(p, q);
}

static bool postCommandDone(long id) {
    if (WiFi.status() != WL_CONNECTED || id < 0) {
        return false;
    }
    HTTPClient http;
    String url = String(API_HOST) + "/api/command/done";
    if (!http.begin(url)) {
        return false;
    }
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-KEY", String(API_KEY));
    String body = "{\"id\":";
    body += String(id);
    body += ",\"device_id\":\"";
    body += String(DEVICE_ID);
    body += "\"}";
    int code = http.POST(body);
    http.end();
    return code >= 200 && code < 300;
}

static void pollServerCommands() {
    if (WiFi.status() != WL_CONNECTED) {
        return;
    }
    HTTPClient http;
    String url = String(API_HOST) + "/api/command/get?device_id=" + String(DEVICE_ID);
    if (!http.begin(url)) {
        return;
    }
    http.addHeader("X-API-KEY", String(API_KEY));
    int code = http.GET();
    if (code != 200) {
        http.end();
        return;
    }
    String body = http.getString();
    http.end();

    if (body.length() < 8 || body == "null") {
        return;
    }

    long id = extractJsonLong(body, "id");
    String cmd = extractJsonString(body, "command");
    if (id < 0 || cmd.length() == 0) {
        return;
    }

    if (cmd == "pump_on") {
        manualRelayMode = true;
        digitalWrite(RELAY_PIN, LOW);
    } else if (cmd == "pump_off") {
        manualRelayMode = true;
        digitalWrite(RELAY_PIN, HIGH);
    } else if (cmd == "relay_auto") {
        manualRelayMode = false;
    }
    postCommandDone(id);
}
#endif

bool postIngest(float airCm, const String &statusLabel, bool relayOn) {
#if !defined(ESP32) && !defined(ESP8266)
    (void)airCm;
    (void)statusLabel;
    (void)relayOn;
    return false;
#else
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }
    HTTPClient http;
    String url = String(API_HOST) + "/api/ingest";
    if (!http.begin(url)) {
        return false;
    }
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-KEY", String(API_KEY));

    String body = "{";
    body += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    body += "\"water_level\":" + String(airCm, 2) + ",";
    body += "\"rainfall\":0,";
    body += "\"relay_on\":" + String(relayOn ? "true" : "false") + ",";
    body += "\"status\":\"" + statusLabel + "\"";
    body += "}";

    int code = http.POST(body);
    http.end();
    return code >= 200 && code < 300;
#endif
}

void setup() {
    Serial.begin(115200);

    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(BUZZER, OUTPUT);
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, HIGH);

    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Flood Monitor");
    lcd.setCursor(0, 1);
    lcd.print("System Ready");
    delay(2000);
    lcd.clear();

#if defined(ESP32) || defined(ESP8266)
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("WiFi ");
    uint8_t tries = 0;
    while (WiFi.status() != WL_CONNECTED && tries < 40) {
        delay(500);
        Serial.print(".");
        tries++;
    }
    Serial.println();
    if (WiFi.status() == WL_CONNECTED) {
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("WiFi gagal — ingest tidak dikirim.");
    }
#endif
}

void loop() {
#if defined(ESP32) || defined(ESP8266)
    pollServerCommands();
#endif

    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    duration = pulseIn(ECHO_PIN, HIGH, 30000);
    distance = duration * 0.034f / 2.0f;

    tinggiAir = 11.0f - distance;
    if (tinggiAir < 0) {
        tinggiAir = 0;
    }

    String status;
    bool relayOn = false;

    if (!manualRelayMode) {
        if (tinggiAir <= 4) {
            status = "NORMAL";
            digitalWrite(BUZZER, LOW);
            digitalWrite(RELAY_PIN, HIGH);
        } else if (tinggiAir <= 8) {
            status = "SIAGA";
            digitalWrite(BUZZER, HIGH);
            delay(200);
            digitalWrite(BUZZER, LOW);
            delay(800);
            digitalWrite(RELAY_PIN, HIGH);
        } else {
            status = "AWAS";
            digitalWrite(BUZZER, HIGH);
            digitalWrite(RELAY_PIN, LOW);
            relayOn = true;
        }
    } else {
        if (tinggiAir <= 4) {
            status = "NORMAL";
            digitalWrite(BUZZER, LOW);
        } else if (tinggiAir <= 8) {
            status = "SIAGA";
            digitalWrite(BUZZER, HIGH);
            delay(200);
            digitalWrite(BUZZER, LOW);
            delay(800);
        } else {
            status = "AWAS";
            digitalWrite(BUZZER, HIGH);
        }
        relayOn = (digitalRead(RELAY_PIN) == LOW);
    }

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Air:");
    lcd.print(tinggiAir, 1);
    lcd.print(" cm");
    lcd.setCursor(0, 1);
    lcd.print(status);

    Serial.print("Tinggi Air : ");
    Serial.print(tinggiAir);
    Serial.print(" cm | Status : ");
    Serial.println(status);

#if defined(ESP32) || defined(ESP8266)
    if (WiFi.status() == WL_CONNECTED) {
        bool ok = postIngest(tinggiAir, status, relayOn);
        Serial.println(ok ? "Ingest OK" : "Ingest gagal");
    }
#endif

    delay(1000);
}
