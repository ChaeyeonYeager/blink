유튜브: https://youtu.be/lmoJ5ljFtD8?feature=shared

# 🔆 Arduino + p5.js 기반 인터랙티브 LED 제어 및 시각화 시스템

이 프로젝트는 **Arduino Uno 보드**와 **웹 기반 p5.js 인터페이스**를 연동하여,  
LED 조명 시스템의 상태를 **실시간 시각화**하고, **사용자 제어 기반으로 다양한 모드 동작을 구현**하는 종합 프로젝트입니다.

---

## 📌 프로젝트 개요

본 시스템은 **TaskScheduler를 이용한 LED 제어 알고리즘**,  
**가변저항 기반 밝기 조절**, **3가지 특수 모드(비상/전체 깜빡임/시스템 OFF)**,  
그리고 **p5.js 기반 시리얼 통신 UI**를 결합한 **하드웨어-소프트웨어 통합형 IoT 프로젝트**입니다.

학습 목적, 졸업 프로젝트, 메이커 활동, 교보재로도 적극 활용 가능한 고급 예제입니다.

---

## 🔧 시스템 구성 요소 및 특징

### ✅ 하드웨어 구성 (Arduino Uno 기반)
- **3색 LED (Red, Yellow, Blue)** → Task 기반 순차 점등/깜빡임 제어
- **가변저항 (Potentiometer)** → LED 밝기 실시간 조절
- **3개의 버튼 스위치**
  - Emergency Mode 토글
  - All Blink Mode 토글
  - System ON/OFF 제어

### ✅ 소프트웨어 구성
- **Arduino 코드 (C++)**
  - TaskScheduler로 각 LED 동작을 독립 Task로 관리
  - 버튼 인터럽트를 통한 상태 전환 구현
  - 시리얼 통신 기반 외부 명령 수신 처리
- **p5.js (JavaScript + Web UI)**
  - 시리얼 포트 연결 및 통신
  - 슬라이더 UI로 LED 주기 설정
  - 시각적인 신호등 및 밝기 게이지 표현
  - 시스템 상태 인디케이터 (LOOP/B1/B2/B3)

---

## 🖥 회로 구성도

아래 이미지는 전체 하드웨어 배선 구성을 시각화한 회로도입니다.

![회로 구성도](image.png)

### 🪛 핀 연결 요약

| 구성 요소 | 연결 핀 |
|-----------|----------|
| RED LED   | D11 (PWM) |
| YELLOW LED| D9 (PWM) |
| BLUE LED  | D10 (PWM) |
| 가변저항(POT) | A0 (Analog 입력) |
| Emergency 버튼 | D5 (Interrupt 핀) |
| All Blink 버튼 | D6 (Interrupt 핀) |
| System ON/OFF 버튼 | D7 (Interrupt 핀) |

> 모든 버튼은 **INPUT_PULLUP 모드**로 동작하며, LED에는 **220Ω~330Ω 저항**이 연결되어 전류를 제한합니다.
> 버튼의 기본 상태는 HIGH, 눌리면 LOW

---

## 🔄 시스템 동작 흐름

### 기본 루프 모드
1. **RED → YELLOW → BLUE → BLUE BLINK(3회) → YELLOW → RED ... 반복**
2. 각 단계는 `TaskScheduler`로 관리되어 비동기적이고 독립적으로 작동

### 특수 모드
| 모드 | 설명 |
|------|------|
| Emergency Mode (B1) | RED LED가 깜빡이며 시스템 Task 중단 |
| All Blink Mode (B2) | 모든 LED가 동기화된 주기로 깜빡임 |
| System OFF Mode (B3) | 모든 Task 종료 및 LED OFF 상태 유지 |

---

## 📡 시리얼 통신 명령 포맷

### ✅ p5.js → Arduino 명령어

| 명령어 예시 | 기능 설명 |
|-------------|-----------|
| `RED_TIME:1000` | RED Task 주기를 1000ms로 설정 |
| `YELLOW_TIME:700` | YELLOW Task 주기를 700ms로 설정 |
| `BLUE_TIME:1500` | BLUE Task 주기를 1500ms로 설정 |

### ✅ Arduino → p5.js 상태 전송

| 메시지 | 의미 |
|--------|------|
| `B:128` | 현재 밝기값 (0~255) |
| `LED:RED`, `LED:BLUE_BLINK`, ... | 현재 LED 상태 |
| `LED_STATE:ON` or `OFF` | 깜빡임 상태 (ON: 점등 중) |
| `B1`, `B2`, `B3` | 시스템 상태 표시

---

## 🌈 p5.js 인터페이스 기능 설명

### 🎚 슬라이더 UI
- `Red Period` : RED Task 주기 조절
- `Yellow Period` : YELLOW Task 주기 조절
- `Blue Period` : 고정값, 비활성화됨

### 🖥 시각화 요소
- **LED 신호등** : 현재 상태에 따라 색상 점등
- **밝기 게이지 바** : 가변저항 상태 반영
- **System State 인디케이터** : LOOP, B1, B2, B3 상태 원형 표시
- **Connect 버튼** : 시리얼 포트 연결/해제


---

## 🧩 사용 부품 목록

- Arduino Uno R3 보드
- 브레드보드
- LED (RED, YELLOW, BLUE)
- 저항 (220Ω~330Ω) × 3
- 가변저항(Potentiometer) × 1
- 푸시 버튼 스위치 × 3
- 점퍼 와이어 세트

---

## 💡 활용 아이디어

- **교육용 실습 (물리+코딩 통합 수업)**
- **졸업 프로젝트/캡스톤 디자인**
- **스마트 조명 시스템의 기초 구성 실습**
- **웹-하드웨어 연동 기술 습득**

---


---

## 🖐️ 제스처 기반 제어 기능 및 코드 흐름 설명

본 시스템은 **ml5.js의 HandPose 모델**과 **p5.js**를 활용하여,  
웹캠을 통해 사용자의 손 제스처를 실시간 인식하고 Arduino 시스템을 원격 제어하는 기능을 포함합니다.  
이를 통해 물리 버튼 없이 **제스처만으로 모드 전환 및 LED 주기 조절**이 가능합니다.

### 📌 시스템 제어 흐름 개요

#### 1️⃣ HandPose 기반 제스처 인식
- `ml5.handPose` 모델이 웹캠 영상을 통해 양손의 **손가락 관절 keypoint 좌표**를 실시간으로 추출합니다.
- 좌표 기준으로 **왼손/오른손 분류** 후, 손가락 펼침 상태와 엄지 위치를 분석합니다.

#### 2️⃣ 제어 조건 분기 로직
- **왼손이 주먹 상태일 때**: 오른손 손가락 개수로 **시스템 모드(B1/B2/B3/LOOP)** 전환
- **왼손이 손가락을 펼친 상태일 때**: 왼손 손가락 수에 따라 조절 대상 LED(R/Y/B)를 지정하고,
  오른손의 **Thumbs Up/Down** 제스처로 **LED 주기를 ±100ms**씩 조절합니다.

#### 3️⃣ 상태 전송
- p5.js는 사용자의 제스처 해석 결과를 **시리얼 명령어 형태**로 아두이노에 전송합니다.
- 예: `RED_TIME:1200`, `B2`, `LOOP` 등

---

### ✋ 제스처 기반 시스템 모드 제어 (왼손 주먹 + 오른손 손가락 수)

| 오른손 손가락 수 | 시스템 제어 명령 | 기능 설명 |
|------------------|------------------|-----------|
| 0개              | `LOOP`           | 기본 루프 모드 복귀 |
| 1개              | `B1`             | Emergency Mode (RED 깜빡임) |
| 2개              | `B2`             | All Blink Mode (전체 LED 동시 깜빡임) |
| 3개              | `B3`             | System OFF Mode (전체 Task 정지) |

※ 0.5초 쿨다운 설정으로 중복 명령 방지

---

### 🔧 LED 주기 조절 제스처 제어 (왼손 손가락 수 + 오른손 엄지 방향)

| 왼손 손가락 수 | 조절 대상 LED | Thumbs Up | Thumbs Down |
|----------------|----------------|-----------|--------------|
| 1개            | RED LED        | +100ms    | -100ms       |
| 2개            | YELLOW LED     | +100ms    | -100ms       |
| 3개            | BLUE LED       | +100ms    | -100ms       |

- 해당 주기는 p5.js 슬라이더와 동기화되며, 시리얼로 아두이노에 실시간 전송됩니다.

---

## ⚙️ 아두이노 코드 구조 및 동작 흐름

### 🔸 시리얼 명령어 처리 함수: `void processSerialCommands()`

이 함수는 **p5.js로부터 수신한 명령어를 파싱**하여 시스템 모드 변경 또는 LED 주기를 조정합니다.

#### 🧠 내부 흐름 요약

```cpp
void processSerialCommands() {
  while (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd.length() == 0) continue;

    // [1] 시스템 모드 전환 명령어 (단일 키워드: LOOP, B1, B2, B3)
    if (cmd.indexOf(':') == -1) {
      if (cmd == \"LOOP\") {
        // 기본 루프 모드 복귀: RED Task부터 재시작
      } else if (cmd == \"B1\") {
        // Emergency Mode: RED 깜빡임, 모든 Task 정지
      } else if (cmd == \"B2\") {
        // All Blink Mode: 모든 LED 동기 깜빡임
      } else if (cmd == \"B3\") {
        // System OFF: 모든 LED OFF 및 Task 종료
      }
    }

    // [2] LED 주기 설정 명령어 (RED_TIME:x, YELLOW_TIME:x, BLUE_TIME:x)
    else {
      int idx = cmd.indexOf(':');
      String key = cmd.substring(0, idx);
      String val = cmd.substring(idx + 1);
      long period = val.toInt();
      if (key == \"RED_TIME\") {
        taskRed.setInterval(period);
      } else if (key == \"YELLOW_TIME\") {
        taskYellow.setInterval(period);
        taskYellow2.setInterval(period);
      } else if (key == \"BLUE_TIME\") {
        taskBlue.setInterval(period);
      }
    }
  }
}

