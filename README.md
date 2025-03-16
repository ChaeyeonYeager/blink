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

