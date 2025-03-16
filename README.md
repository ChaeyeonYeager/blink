유튜브: https://youtu.be/lmoJ5ljFtD8?feature=shared

# 💡 Arduino + p5.js LED 제어 및 시각화 프로젝트

본 프로젝트는 **Arduino Uno 보드와 p5.js 웹 인터페이스**를 활용하여,  
**LED 상태 제어, 가변저항 밝기 조절, 시스템 모드 토글(Emergency/All Blink)** 등을 구현한 **IoT 실습 예제**입니다.

---

## 📷 회로 구성도

다음은 전체 회로 연결 구성도입니다. 각 부품의 핀 연결을 쉽게 파악할 수 있습니다.

![회로 구성도](image.png)

### 🔌 연결 요약

| 구성 요소 | 연결 핀 |
|-----------|----------|
| RED LED   | D11 (PWM) |
| YELLOW LED| D9 (PWM)  |
| BLUE LED  | D10 (PWM) |
| 가변저항(POT) | A0 |
| Emergency 버튼 | D5 |
| All Blink 버튼 | D6 |
| System ON/OFF 버튼 | D7 |

> 각 버튼은 **INPUT_PULLUP** 방식으로 구성되어 있으며(외부 풀다운 저항이 필요 없음)
, **저항(220~330Ω)** 을 통해 LED를 보호합니다.

---

## 🛠 기능 설명

### ✅ Arduino 측 기능
- **TaskScheduler 라이브러리 기반 LED 시퀀스 제어**
  - RED → YELLOW → BLUE → BLUE_BLINK → YELLOW → (반복 순환)
- **특수 모드**
  - Emergency Mode : RED LED 깜빡임 (`B1`)
  - All Blink Mode : 모든 LED 동시 깜빡임 (`B2`)
  - System OFF Mode : Task 비활성화 (`B3`)
- **가변저항(POT)** 으로 실시간 LED 밝기 조절 (0~255)
- **시리얼 명령 수신 처리**
  - `RED_TIME:값` → RED 주기 설정
  - `YELLOW_TIME:값` → YELLOW 주기 설정
  - `BLUE_TIME:값` → BLUE 주기 설정

---

## 🌈 p5.js UI (웹 인터페이스)

브라우저에서 아두이노와 시리얼 연결 후, UI를 통해 **LED 상태를 시각화하고 주기를 제어**할 수 있습니다.

### 🎚 슬라이더 구성

| 슬라이더 | 설명 | 전송 명령 |
|---------|------|-----------|
| RED Period | RED 주기 조절 (0~5000ms) | `RED_TIME:값` |
| YELLOW Period | YELLOW 주기 조절 (0~5000ms) | `YELLOW_TIME:값` |
| BLUE Period | 고정 (사용자 조정 불가) | - |

### 📡 시리얼 통신 데이터 포맷 (Arduino → p5.js)

| 수신 메시지 | 설명 |
|-------------|------|
| `B:숫자` | LED 밝기값 (0~255) |
| `LED:RED`, `LED:YELLOW`, `LED:BLUE` 등 | 현재 LED 상태 |
| `LED_STATE:ON/OFF` | 깜빡임 ON/OFF 상태 |
| `B1` | Emergency Mode 활성화 |
| `B2` | All Blink Mode 활성화 |
| `B3` | 시스템 OFF 상태 |

---

## 🖥 UI 구성 설명 (p5.js)

- **밝기 게이지 바** : 가변저항 값 시각화
- **신호등 형태 LED 표시** : 현재 LED 상태 표현
- **시스템 상태 인디케이터 (LOOP, B1, B2, B3)** : 현재 시스템 모드 시각화
- **Connect to Arduino 버튼** : 시리얼 연결/해제

