유튜브: https://youtu.be/lmoJ5ljFtD8?feature=shared

이 프로젝트는 **여러 LED(빨강, 노랑, 파랑)**를 Task 기반으로 제어하며, 가변저항 밝기 조절, 특수 모드(비상/전체 깜빡임), 시리얼 명령 처리 기능이 포함된 시스템입니다.

💡 주요 기능 요약
TaskScheduler 활용: RED → YELLOW → BLUE → BLUE_BLINK → YELLOW → 반복
가변저항 밝기 제어: 아날로그 입력값(01023)을 LED 밝기(0255)로 변환
특수 모드
Emergency Mode: RED LED 깜빡임
All Blink Mode: 모든 LED 동시에 깜빡임
System ON/OFF: 전체 Task 중지/재시작
시리얼 명령 제어
RED_TIME:1000 → RED Task 주기 변경
YELLOW_TIME:500 → YELLOW Task 주기 변경
BLUE_TIME:1500 → BLUE Task 주기 변경
상태 시리얼 전송
LED 상태 (LED:RED, LED:YELLOW 등)
밝기 상태 (B:128)
모드 상태 (B1: Emergency, B2: All Blink, B3: System OFF)

 p5.js 인터페이스: 아두이노 LED 상태 시각화 및 제어
이 코드는 Arduino와 시리얼 통신으로 연결된 LED 상태를 웹 브라우저에서 시각화하고, 슬라이더를 통해 주기를 실시간으로 조정하는 p5.js 기반 UI입니다.

📌 주요 기능
시리얼 포트 연결 / 해제 버튼 제공
LED 주기 슬라이더 제공 (RED, YELLOW)
아두이노로부터 수신한 밝기(B:) 및 LED 상태(LED:) 시각화
Emergency 모드 / All Blink 모드 / System OFF 상태 시각화 (B1, B2, B3)
LED 깜빡임 상태 표시 (LED_STATE:) 반영
가변저항 밝기 게이지 UI 제공




아래는 본 프로젝트의 실제 회로 배선도입니다.

![회로 구성도](blink/image.png)

- 빨간 LED → D11
- 노란 LED → D9
- 파란 LED → D10
- 가변저항(POT) → A0
- 버튼 1 (Emergency) → D5
- 버튼 2 (All Blink) → D6
- 버튼 3 (System ON/OFF) → D7
- 각 LED 및 버튼은 **풀다운 또는 풀업 저항**을 사용하여 안정적으로 동작합니다.
