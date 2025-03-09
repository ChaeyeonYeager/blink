#include <Arduino.h>
#include <TaskScheduler.h>

#define LED_PIN 13  // LED가 연결된 핀

Scheduler runner;   // TaskScheduler 객체 생성

void LedOn();       // LED 켜기 함수
void LedOff();      // LED 끄기 함수

Task task1(2000, TASK_FOREVER, &LedOn,  &runner, true); 
Task task2(   0,    TASK_ONCE, &LedOff, &runner, false);

void setup() {
    pinMode(LED_PIN, OUTPUT);
    Serial.begin(9600);
}

void loop() {
    runner.execute(); // TaskScheduler 실행
}

void LedOn() {
    Serial.println("[" + String(millis()) + "] LED ON");
    digitalWrite(LED_PIN, HIGH);
    task2.restartDelayed(200);
}

void LedOff() {
    Serial.println("[" + String(millis()) + "] LED OFF");
    digitalWrite(LED_PIN, LOW);
}
