#include <WiFi.h>
#include <HTTPClient.h>
#include <ESPmDNS.h>  // mDNS support

const char* ssid = "homelab";
const char* password = "Dhaniya0#";

String serverName = "rpi-desktop";  // Set this to your Pi's hostname WITHOUT .local suffix
int serverPort = 5000;
String serverUrl = "";
String heartbeatUrl = "";

// Timing variables
unsigned long lastSensorData = 0;
unsigned long lastHeartbeat = 0;
const unsigned long sensorInterval = 5000;    // Send sensor data every 5 seconds
const unsigned long heartbeatInterval = 10000; // Send heartbeat every 10 seconds

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

  if (!MDNS.begin("esp32-client")) { // hostname for ESP32 (optional)
    Serial.println("Error starting mDNS");
  } else {
    Serial.println("mDNS responder started");
  }

  // Try to resolve Pi's IP via mDNS
  Serial.println("Resolving Raspberry Pi mDNS...");
  IPAddress serverIP = MDNS.queryHost(serverName);
  if (serverIP) {
    serverUrl = "http://" + serverIP.toString() + ":" + String(serverPort) + "/sensor-data";
    heartbeatUrl = "http://" + serverIP.toString() + ":" + String(serverPort) + "/esp32-heartbeat";
    Serial.print("Found Raspberry Pi at: ");
    Serial.println(serverIP.toString());
    Serial.println("Sensor URL: " + serverUrl);
    Serial.println("Heartbeat URL: " + heartbeatUrl);
  } else {
    Serial.println("Could not resolve Raspberry Pi via mDNS!");
  }
}

void sendSensorData() {
  if (serverUrl == "") return;
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Your actual sensor data (replace with real sensor readings)
  String jsonData = "{\"nitrogen\":45, \"phosphorus\":30, \"potassium\":60, \"moisture\":55.5, \"temperature\":28.7, \"pH\":6.4}";
  
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode > 0) {
    Serial.println("Sensor data sent successfully");
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Response: " + response);
    }
  } else {
    Serial.print("Error sending sensor data: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void sendHeartbeat() {
  if (heartbeatUrl == "") return;
  
  HTTPClient http;
  http.begin(heartbeatUrl);
  http.addHeader("Content-Type", "application/json");

  // Heartbeat data with ESP32 status
  String heartbeatData = "{\"esp32_id\":\"" + WiFi.macAddress() + "\", \"uptime\":" + String(millis()) + ", \"wifi_rssi\":" + String(WiFi.RSSI()) + ", \"free_heap\":" + String(ESP.getFreeHeap()) + "}";
  
  int httpResponseCode = http.POST(heartbeatData);
  
  if (httpResponseCode > 0) {
    Serial.println("Heartbeat sent successfully");
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Heartbeat response: " + response);
    }
  } else {
    Serial.print("Error sending heartbeat: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void resolveServerIfNeeded() {
  if (serverUrl == "") {
    Serial.println("Server not found. Retrying mDNS...");
    IPAddress serverIP = MDNS.queryHost(serverName);
    if (serverIP) {
      serverUrl = "http://" + serverIP.toString() + ":" + String(serverPort) + "/sensor-data";
      heartbeatUrl = "http://" + serverIP.toString() + ":" + String(serverPort) + "/esp32-heartbeat";
      Serial.println("Found Raspberry Pi at: " + serverIP.toString());
    }
  }
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println("\nReconnected to WiFi!");
  }
  
  // Resolve server if needed
  resolveServerIfNeeded();
  
  // Send sensor data every 5 seconds
  if (currentTime - lastSensorData >= sensorInterval) {
    sendSensorData();
    lastSensorData = currentTime;
  }
  
  // Send heartbeat every 10 seconds
  if (currentTime - lastHeartbeat >= heartbeatInterval) {
    sendHeartbeat();
    lastHeartbeat = currentTime;
  }
  
  delay(100); // Small delay to prevent watchdog issues
}