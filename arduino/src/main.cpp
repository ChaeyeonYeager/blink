#include <Arduino.h>              // Arduino 기본 헤더, 필수 라이브러리
#include <TaskScheduler.h>        // Task 기반 스케줄링을 위한 라이브러리
#include <PinChangeInterrupt.h>   // 핀 변화 인터럽트를 지원하는 라이브러리

// --- 핀 설정 ---
const uint8_t RED_PIN = 11;       // RED LED가 연결된 핀 번호
const uint8_t YELLOW_PIN = 9;     // YELLOW LED 핀
const uint8_t BLUE_PIN = 10;      // BLUE LED 핀
const uint8_t POT_PIN = A0;       // 가변저항(포텐셔미터) 입력 핀

// --- 버튼 핀 설정 ---
const uint8_t BTN_EMERGENCY = 5;  // Emergency 모드 토글 버튼 핀
const uint8_t BTN_BLINK_ALL = 6;  // 전체 깜빡임 모드 버튼
const uint8_t BTN_SYSTEM = 7;     // 시스템 ON/OFF 버튼

// --- Task Scheduler 생성 ---
Scheduler runner;                 // 여러 Task를 관리하는 Task Scheduler 객체

// --- 시스템 상태 변수 ---
volatile bool isEmergencyMode = false; // Emergency 모드 상태 저장
volatile bool isAllBlinkMode = false;  // 전체 깜빡임 모드 상태 저장
volatile bool isSystemOn = true;       // 시스템 작동 상태 저장

// --- LED 상태 열거형 선언 ---
enum LEDState { NONE, RED, YELLOW, BLUE, RED_BLINK, BLUE_BLINK, ALL_BLINK }; 
volatile LEDState currentState = NONE;   // 현재 어떤 LED 상태인지 저장

volatile bool blinkState = false;        // 깜빡임 ON/OFF 상태 토글 변수
int currentBrightness = 0;               // 가변저항 값을 기반으로 계산한 LED 밝기

// --- 함수 프로토타입 선언 ---
int getBrightness();                     // 가변저항 값을 읽고 밝기로 변환
void updateLEDBrightness();              // 현재 상태에 따라 LED 출력값 업데이트
void processSerialCommands();            // 시리얼 통신으로 명령 수신 처리

// --- Task 콜백 함수 프로토타입 선언 ---
bool onRedEnable(); void onRedDisable();           // RED LED Task
bool onYellowEnable(); void onYellowDisable();     // YELLOW LED Task
bool onBlueEnable(); void onBlueDisable();         // BLUE LED Task
bool onBlueBlinkEnable(); void blueBlinkCallback(); void onBlueBlinkDisable();  // BLUE 깜빡임 Task
bool onYellowEnable2(); void onYellowDisable2();   // BLUE_BLINK 이후 YELLOW Task
void redBlinkCallback(); void allBlinkCallback();  // 특수 모드 콜백 함수들

// --- Task 객체 생성 ---
Task taskRed(2000, TASK_ONCE, NULL, &runner, false, onRedEnable, onRedDisable);        // RED 2초
Task taskYellow(500, TASK_ONCE, NULL, &runner, false, onYellowEnable, onYellowDisable); // YELLOW 0.5초
Task taskBlue(2000, TASK_ONCE, NULL, &runner, false, onBlueEnable, onBlueDisable);     // BLUE 2초
Task taskBlueBlink(167, 6, blueBlinkCallback, &runner, false, onBlueBlinkEnable, onBlueBlinkDisable); // BLUE 3회 깜빡임
Task taskYellow2(500, TASK_ONCE, NULL, &runner, false, onYellowEnable2, onYellowDisable2); // BLUE 깜빡임 후 YELLOW Task
Task taskRedBlink(500, TASK_FOREVER, redBlinkCallback, &runner, false);                // Emergency 모드 RED 깜빡임
Task taskAllBlink(500, TASK_FOREVER, allBlinkCallback, &runner, false);                // 전체 깜빡임 모드

// ----------------------------------------------------------------------
//                        인터럽트 서비스 루틴 (ISR)
// ----------------------------------------------------------------------

// Emergency 버튼을 누르면 Emergency 모드 ON/OFF 토글
void ISR_Emergency() {
  isEmergencyMode = !isEmergencyMode;  // 비상 모드 토글
  if (isEmergencyMode) {
    isAllBlinkMode = false;           // 전체 깜빡임 해제
    isSystemOn = false;               // 시스템 정지
    runner.disableAll();              // 모든 Task 중단
    currentState = RED;               // RED LED 고정 상태
  } else {
    analogWrite(RED_PIN, 0);          // RED LED OFF
    currentState = NONE;              // 상태 초기화
    isSystemOn = true;                // 시스템 재시작
    taskRed.restartDelayed();         // RED Task 재시작
  }
}

// 전체 깜빡임 모드 토글
void ISR_BlinkAll() {
  isAllBlinkMode = !isAllBlinkMode;  // 상태 토글
  if (isAllBlinkMode) {
    // 모든 Task 비활성화
    taskRed.disable(); taskYellow.disable(); taskBlue.disable();
    taskBlueBlink.disable(); taskRedBlink.disable(); taskYellow2.disable();
    runner.disableAll();
    // 모든 LED 끄기
    analogWrite(RED_PIN, 0);
    analogWrite(YELLOW_PIN, 0);
    analogWrite(BLUE_PIN, 0);
    blinkState = false;              // 깜빡임 초기화
    currentState = ALL_BLINK;        // 상태 설정
    taskAllBlink.enable();           // 전체 깜빡임 Task 시작
  } else {
    taskAllBlink.disable();          // 전체 깜빡임 종료
    analogWrite(RED_PIN, 0);         // 모든 LED 끄기
    analogWrite(YELLOW_PIN, 0);
    analogWrite(BLUE_PIN, 0);
    currentState = NONE;             // 상태 초기화
    taskRed.restartDelayed();        // RED Task 재시작
  }
}

// 시스템 ON/OFF 버튼 처리
void ISR_SystemToggle() {
  if (digitalRead(BTN_SYSTEM) == LOW) {
    isSystemOn = !isSystemOn;        // 시스템 상태 토글
    if (isSystemOn) {
      Serial.println("System ON");
      taskRed.restartDelayed();      // RED Task 재시작
    } else {
      Serial.println("System OFF");
      runner.disableAll();           // 모든 Task 비활성화
      taskRed.disable(); taskYellow.disable(); taskBlue.disable();
      taskBlueBlink.disable(); taskRedBlink.disable(); taskAllBlink.disable(); taskYellow2.disable();
      analogWrite(RED_PIN, 0); analogWrite(YELLOW_PIN, 0); analogWrite(BLUE_PIN, 0);
      currentState = NONE;           // 상태 초기화
    }
  }
}

// ---- RED Task Enable 콜백 함수 ----
bool onRedEnable() {
  currentState = RED;               // 상태를 RED로 설정
  Serial.println("RED");           // 시리얼로 상태 출력 (p5.js에서 상태 시각화 용도)
  return true;                     // TaskScheduler에 Task 성공적으로 시작했음을 알림
}

// ---- RED Task Disable 콜백 함수 ----
void onRedDisable() {
  Serial.println("OFF");           // 시리얼로 OFF 상태 출력
  analogWrite(RED_PIN, 0);         // RED LED OFF
  currentState = NONE;             // 상태 초기화
  if (!isAllBlinkMode && !isEmergencyMode)
    taskYellow.restartDelayed();   // 다음 YELLOW Task 시작 (일반 모드일 경우)
}

// ---- YELLOW Task Enable 콜백 함수 ----
bool onYellowEnable() {
  currentState = YELLOW;           // 상태를 YELLOW로 설정
  Serial.println("YELLOW");        // 시리얼 상태 출력
  return true;
}

// ---- YELLOW Task Disable 콜백 함수 ----
void onYellowDisable() {
  Serial.println("OFF");           // 시리얼 OFF 출력
  analogWrite(YELLOW_PIN, 0);      // YELLOW LED OFF
  currentState = NONE;             // 상태 초기화
  if (!isAllBlinkMode && !isEmergencyMode)
    taskBlue.restartDelayed();     // 다음 BLUE Task 시작
}

// ---- BLUE Task Enable 콜백 함수 ----
bool onBlueEnable() {
  currentState = BLUE;             // 상태를 BLUE로 설정
  Serial.println("BLUE");          // 상태 출력
  return true;
}

// ---- BLUE Task Disable 콜백 함수 ----
void onBlueDisable() {
  Serial.println("OFF");           // 상태 출력
  analogWrite(BLUE_PIN, 0);        // BLUE OFF
  currentState = NONE;             // 상태 초기화
  if (!isAllBlinkMode && !isEmergencyMode)
    taskBlueBlink.restartDelayed(); // 다음 BLUE BLINK Task 시작
}

// ---- BLUE 깜빡임 Enable 콜백 함수 ----
bool onBlueBlinkEnable() {
  currentState = BLUE_BLINK;       // 상태 변경
  Serial.println("BLUE_BLINK");    // 상태 출력
  blinkState = false;              // 깜빡임 초기화
  return true;
}

// ---- BLUE 깜빡임 콜백 함수 (0.167초마다 실행됨) ----
void blueBlinkCallback() {
  blinkState = !blinkState;        // 깜빡임 상태 토글 (ON/OFF 반복)
}

// ---- BLUE 깜빡임 Disable 함수 ----
void onBlueBlinkDisable() {
  Serial.println("OFF");           // 상태 출력
  analogWrite(BLUE_PIN, 0);        // BLUE OFF
  currentState = NONE;             // 상태 초기화
  if (!isAllBlinkMode && !isEmergencyMode)
    taskYellow2.restartDelayed();  // 다음 YELLOW2 Task 시작
}

// ---- YELLOW2 Task Enable 함수 (반복 순환) ----
bool onYellowEnable2() {
  currentState = YELLOW;           // 상태를 YELLOW로 설정
  Serial.println("YELLOW");        // 상태 출력
  return true;
}

// ---- YELLOW2 Task Disable 함수 ----
void onYellowDisable2() {
  Serial.println("OFF");           // 상태 출력
  analogWrite(YELLOW_PIN, 0);      // YELLOW OFF
  currentState = NONE;             // 상태 초기화
  if (!isAllBlinkMode && !isEmergencyMode)
    taskRed.restartDelayed();      // 다시 RED부터 반복 시작
}

// ---- RED 깜빡임 콜백 함수 (Emergency 모드 전용) ----
void redBlinkCallback() {
  currentState = RED_BLINK;        // 상태 변경
  blinkState = !blinkState;        // 깜빡임 상태 토글
}

// ---- 전체 깜빡임 콜백 함수 (모든 LED 깜빡임) ----
void allBlinkCallback() {
  currentState = ALL_BLINK;        // 상태 변경
  blinkState = !blinkState;        // 깜빡임 상태 토글
}

// ----- 밝기 및 LED 상태 업데이트 함수 -----
void updateLEDBrightness() {
  currentBrightness = getBrightness();  // 가변저항 값을 읽어 0~255로 변환하여 저장

  // 현재 상태에 따라 해당 LED에 밝기값 출력
  switch (currentState) {
    case RED:
      analogWrite(RED_PIN, currentBrightness);        // RED LED에 밝기 적용
      break;
    case YELLOW:
      analogWrite(YELLOW_PIN, currentBrightness);     // YELLOW LED에 밝기 적용
      break;
    case BLUE:
      analogWrite(BLUE_PIN, currentBrightness);       // BLUE LED에 밝기 적용
      break;
    case RED_BLINK:
      analogWrite(RED_PIN, blinkState ? currentBrightness : 0);  // 깜빡임 상태면 밝기 출력, 아니면 OFF
      break;
    case BLUE_BLINK:
      analogWrite(BLUE_PIN, blinkState ? currentBrightness : 0); // 마찬가지로 깜빡임 상태에 따라 출력
      break;
    case ALL_BLINK:
      // 전체 LED 깜빡임 시 모두 동시에 ON/OFF
      analogWrite(RED_PIN, blinkState ? currentBrightness : 0);
      analogWrite(YELLOW_PIN, blinkState ? currentBrightness : 0);
      analogWrite(BLUE_PIN, blinkState ? currentBrightness : 0);
      break;
    default:
      // NONE 상태 혹은 예외 상태 → 모든 LED OFF
      analogWrite(RED_PIN, 0);
      analogWrite(YELLOW_PIN, 0);
      analogWrite(BLUE_PIN, 0);
      break;
  }

  // --- 100ms 주기로 밝기 및 LED 상태 시리얼 전송 ---
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate >= 100) {
    Serial.print("B:");                         // 밝기 값 전송 (p5.js에서 게이지 출력용)
    Serial.println(currentBrightness);

    // LED 상태 문자열 전송
    String ledMsg = "LED:";
    switch (currentState) {
      case RED:        ledMsg += "RED"; break;
      case RED_BLINK:  ledMsg += "RED_BLINK"; break;
      case YELLOW:     ledMsg += "YELLOW"; break;
      case BLUE:       ledMsg += "BLUE"; break;
      case BLUE_BLINK: ledMsg += "BLUE_BLINK"; break;
      case ALL_BLINK:  ledMsg += "ALL_BLINK"; break;
      default:         ledMsg += "OFF"; break;
    }
    Serial.println(ledMsg);                     // p5.js에서 시각화용

    // 깜빡임 상태 ON/OFF 전송 (실제 LED 출력 상태와 맞춤)
    if (currentState == RED_BLINK || currentState == BLUE_BLINK || currentState == ALL_BLINK) {
      Serial.print("LED_STATE:");
      Serial.println(blinkState ? "ON" : "OFF");
    }

    lastUpdate = millis();  // 마지막 업데이트 시간 갱신
  }

  // --- 상태 인디케이터 메시지 전송 ---
  if (isEmergencyMode) Serial.println("B1");      // Emergency 상태
  else if (isAllBlinkMode) Serial.println("B2");  // 전체 깜빡임 상태
  else if (!isSystemOn) Serial.println("B3");     // 시스템 OFF 상태
}

// ----- 시리얼 명령어 처리 함수 -----
void processSerialCommands() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n'); // 한 줄 수신
    cmd.trim(); // 앞뒤 공백 제거
    if (cmd.length() == 0) return;

    // 명령 포맷: COMMAND:VALUE
    int separatorIndex = cmd.indexOf(':');
    if (separatorIndex > 0) {
      String commandName = cmd.substring(0, separatorIndex);      // 명령 이름
      String commandValue = cmd.substring(separatorIndex + 1);    // 값
      commandName.trim(); commandValue.trim();

      if (commandName == "RED_TIME") {
        long period = commandValue.toInt();           // 시간 값으로 변환
        taskRed.setInterval(period);                  // RED Task 주기 설정
        Serial.print("OK:RED_TIME:"); Serial.println(period);  // 확인 메시지 전송
      }
      else if (commandName == "YELLOW_TIME") {
        long period = commandValue.toInt();
        taskYellow.setInterval(period);               // YELLOW Task 주기 변경
        taskYellow2.setInterval(period);              // YELLOW2 Task도 동일하게 변경
        Serial.print("OK:YELLOW_TIME:"); Serial.println(period);
      }
      else if (commandName == "BLUE_TIME") {
        long period = commandValue.toInt();
        taskBlue.setInterval(period);                 // BLUE Task 주기 변경
        Serial.print("OK:BLUE_TIME:"); Serial.println(period);
      }
    }
  }
}

// ----- setup 함수 (최초 실행 시 1회만 호출됨) -----
void setup() {
  Serial.begin(9600);                          // 시리얼 통신 시작 (속도: 9600bps)
  
  // LED 핀 출력 설정
  pinMode(RED_PIN, OUTPUT);
  pinMode(YELLOW_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  // 가변저항 핀 입력 설정
  pinMode(POT_PIN, INPUT);

  // 버튼 핀 입력(PULLUP) 설정
  pinMode(BTN_EMERGENCY, INPUT_PULLUP);
  pinMode(BTN_BLINK_ALL, INPUT_PULLUP);
  pinMode(BTN_SYSTEM, INPUT_PULLUP);

  // 버튼에 인터럽트 연결
  attachPCINT(digitalPinToPCINT(BTN_EMERGENCY), ISR_Emergency, FALLING);
  attachPCINT(digitalPinToPCINT(BTN_BLINK_ALL), ISR_BlinkAll, FALLING);
  attachPCINT(digitalPinToPCINT(BTN_SYSTEM), ISR_SystemToggle, FALLING);

  // 시스템 ON 상태면 RED Task부터 시작
  if (isSystemOn) {
    taskRed.enableDelayed();
  }
}

// ----- loop 함수 (매 프레임 반복) -----
void loop() {
  updateLEDBrightness();     // 현재 상태에 따른 LED 밝기 출력
  processSerialCommands();   // 시리얼 명령 수신 및 처리
  if (isSystemOn) {
    runner.execute();        // Task Scheduler 실행 (예약된 Task 실행)
  }
}

// ----- 가변저항 읽어서 밝기로 변환하는 함수 -----
int getBrightness() {
  int potValue = analogRead(POT_PIN);             // 아날로그 핀에서 0~1023 값 읽기
  return map(potValue, 0, 1023, 0, 255);           // 0~255 범위로 변환하여 밝기값 리턴
}