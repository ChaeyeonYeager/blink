#include <Arduino.h>
#include <TaskScheduler.h>

#define LED_PIN 13  // LED가 연결된 핀

Scheduler runner;   // TaskScheduler 객체 생성

void LedOn();       // LED 켜기 함수
void LedOff();      // LED 끄기 함수

Task task1(2000, TASK_FOREVER, &LedOn,  &runner, true); 
Task task2(2000, TASK_FOREVER, &LedOff, &runner, true);

void setup() {
    pinMode(LED_PIN, OUTPUT);
    task2.delay(200);
}

void loop() {
    runner.execute(); // TaskScheduler 실행
}

void LedOn() {
    digitalWrite(LED_PIN, HIGH);
}

void LedOff() {
    digitalWrite(LED_PIN, LOW);
}
