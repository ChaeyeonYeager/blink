let port;  // 시리얼 포트 객체를 저장할 변수
let connectBtn;  // 아두이노 연결 버튼 객체
let currentSignal = "None";  // 현재 수신한 시리얼 신호를 저장
let brightness = 0;  // 아두이노에서 전달받은 밝기 값 (0~255 범위)

// LED 주기 조절용 슬라이더 변수 선언
let redSlider, yellowSlider, blueSlider;
// 초기 주기값 설정
let redPeriod = 2000;      // 빨간 LED 주기 (기본 2000ms)
let yellowPeriod = 500;    // 노란 LED 주기 (기본 500ms)
let bluePeriod = 2000;     // 파란 LED 주기는 고정값 2000ms

// 아두이노에서 전달받은 LED 상태 저장 변수
let ledMode = "OFF"; // LED 모드 초기값

// 시스템 상태 인디케이터를 위한 객체 (p5.js UI 표시용)
let stateIndicators = {
  loop: true,   // 기본 루프 모드
  B1: false,    // Emergency 상태
  B2: false,    // 전체 깜빡임 상태
  B3: false     // 시스템 OFF 상태
};

// 마지막 상태 메시지를 받은 시간 기록 변수
let lastStateMessageTime = 0;

// 아두이노에서 받은 깜빡임 ON/OFF 상태 저장
let ledBlinkState = true;

function setup() {
  createCanvas(700, 600);  // 캔버스 생성 (700x600 크기)

  port = createSerial();   // 시리얼 포트 객체 생성
  let usedPorts = usedSerialPorts();  // 이전에 사용한 포트 목록 확인
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 9600);  // 자동으로 첫 번째 포트를 열고 통신 시작
  }

  // 아두이노 연결 버튼 생성
  connectBtn = createButton("Connect to Arduino");
  connectBtn.position(10, height - 40);  // 버튼 위치 설정
  connectBtn.mousePressed(connectBtnClick); // 버튼 클릭 시 이벤트 연결

  // 빨간 LED 주기 슬라이더 생성
  redSlider = createSlider(0, 5000, redPeriod, 100); // 범위: 0~5000ms, 기본값: 2000ms
  redSlider.position(10, 10);  // 슬라이더 위치
  redSlider.size(300);        // 슬라이더 길이
  redSlider.input(changeRedPeriod);  // 슬라이더 값 변경 시 이벤트

  // 노란 LED 주기 슬라이더 생성
  yellowSlider = createSlider(0, 5000, yellowPeriod, 100);
  yellowSlider.position(10, 50);
  yellowSlider.size(300);
  yellowSlider.input(changeYellowPeriod);

  // 파란 LED 주기 슬라이더 생성 (고정값, 사용자가 조절 불가)
  blueSlider = createSlider(0, 5000, 2000, 100);
  blueSlider.position(10, 90);
  blueSlider.size(300);
  blueSlider.attribute('disabled', ''); // 슬라이더 비활성화 처리

  textSize(18);           // 텍스트 크기 설정
  textAlign(CENTER, CENTER); // 텍스트 정렬 중앙 설정
}

function draw() {
  background(230);  // 배경색 밝은 회색으로 설정

  // 시리얼 데이터를 최대 10줄까지 반복해서 읽음
  let count = 0;
  while (port.available() > 0 && count < 10) {
    let data = port.readUntil("\n").trim();  // 줄 단위로 읽고 공백 제거
    if (data.length > 0) {
      parseSerialData(data); // 시리얼 데이터 파싱 처리
    }
    count++;
  }

  // 상태 메시지를 1초 이상 못 받으면 상태 초기화
  if (millis() - lastStateMessageTime > 1000) {
    stateIndicators.B1 = false;
    stateIndicators.B2 = false;
    stateIndicators.B3 = false;
  }

  // 어떤 상태도 아니면 loop 상태로 간주
  if (!stateIndicators.B1 && !stateIndicators.B2 && !stateIndicators.B3) {
    stateIndicators.loop = true;
  } else {
    stateIndicators.loop = false;
  }

  drawBrightnessGauge(brightness); // 밝기 게이지 그리기

  // 텍스트 정보 출력
  fill(0);
  textAlign(LEFT, TOP);
  text("Brightness: " + brightness, 10, 180);
  text("Red Period: " + redPeriod + " ms", 320, 30);
  text("Yellow Period: " + yellowPeriod + " ms", 320, 70);
  text("Blue Period: " + bluePeriod + " ms", 320, 110);

  drawTrafficLight();     // 신호등 출력
  drawStateCircles();     // 시스템 상태 출력
}

// 시리얼 데이터 분석 함수
function parseSerialData(data) {
  currentSignal = data; // 현재 받은 신호 저장

  // 밝기 데이터 수신 시 처리
  if (data.startsWith("B:")) {
    brightness = int(data.substring(2).trim()); // 숫자만 추출하여 저장
    return;
  }

  // LED 모드 데이터 수신 시 처리
  if (data.startsWith("LED:")) {
    ledMode = data.substring(4).trim().toUpperCase(); // 대문자 변환 후 저장
    return;
  }

  // 깜빡임 상태 수신 시 처리
  if (data.startsWith("LED_STATE:")) {
    let state = data.substring(10).trim().toUpperCase();
    ledBlinkState = (state === "ON"); // ON이면 true, 아니면 false
    return;
  }

  // 상태 메시지 처리 (B1/B2/B3)
  if (data === "B1") {
    stateIndicators.B1 = true;
    stateIndicators.B2 = false;
    stateIndicators.B3 = false;
    lastStateMessageTime = millis(); // 수신 시간 기록
  } else if (data === "B2") {
    stateIndicators.B1 = false;
    stateIndicators.B2 = true;
    stateIndicators.B3 = false;
    lastStateMessageTime = millis();
  } else if (data === "B3") {
    stateIndicators.B1 = false;
    stateIndicators.B2 = false;
    stateIndicators.B3 = true;
    lastStateMessageTime = millis();
  }
}

// 밝기 게이지 그리기 함수
function drawBrightnessGauge(val) {
  fill(0);
  textAlign(LEFT, TOP);
  text("Brightness Gauge", 320, 150);  // 텍스트 표시
  fill(200);
  rect(320, 160, 300, 20); // 게이지 바 배경
  let w = map(val, 0, 255, 0, 300); // 밝기값을 너비로 매핑
  fill(100, 200, 100);
  rect(320, 160, w, 20); // 실제 밝기값 표시
}

// 신호등 그리기 함수
function drawTrafficLight() {
  let x = width / 2;
  let y = 250;

  let blinkOn = ledBlinkState; // 깜빡임 상태 저장

  noFill();
  stroke(0);
  strokeWeight(2);
  ellipse(x, y, 60);       // Red
  ellipse(x, y + 70, 60);  // Yellow
  ellipse(x, y + 140, 60); // Blue

  noStroke();

  // 각 LED별 ON/OFF 상태 결정 및 색상 설정
  let redOn = false;
  if (ledMode === "RED") redOn = true;
  else if (ledMode === "RED_BLINK") redOn = blinkOn;
  else if (ledMode === "ALL" || ledMode === "ALL_BLINK")
    redOn = (ledMode === "ALL") || (ledMode === "ALL_BLINK" && blinkOn);
  fill(redOn ? color(255, 0, 0) : color(100));
  ellipse(x, y, 60);

  let yellowOn = false;
  if (ledMode === "YELLOW") yellowOn = true;
  else if (ledMode === "YELLOW_BLINK") yellowOn = blinkOn;
  else if (ledMode === "ALL" || ledMode === "ALL_BLINK")
    yellowOn = (ledMode === "ALL") || (ledMode === "ALL_BLINK" && blinkOn);
  fill(yellowOn ? color(255, 255, 0) : color(100));
  ellipse(x, y + 70, 60);

  let blueOn = false;
  if (ledMode === "BLUE") blueOn = true;
  else if (ledMode === "BLUE_BLINK") blueOn = blinkOn;
  else if (ledMode === "ALL" || ledMode === "ALL_BLINK")
    blueOn = (ledMode === "ALL") || (ledMode === "ALL_BLINK" && blinkOn);
  fill(blueOn ? color(0, 0, 255) : color(100));
  ellipse(x, y + 140, 60);
}

// 시스템 상태 원형 표시 함수
function drawStateCircles() {
  let baseX = 40;
  let baseY = 450;
  let gap = 60;

  textAlign(CENTER, CENTER); // 텍스트 중앙정렬

  fill(stateIndicators.loop ? color(0, 255, 0) : color(150));
  ellipse(baseX, baseY, 60);
  fill(0);
  text("LOOP", baseX, baseY);

  fill(stateIndicators.B1 ? color(0, 255, 0) : color(150));
  ellipse(baseX + gap, baseY, 60);
  fill(0);
  text("B1", baseX + gap, baseY);

  fill(stateIndicators.B2 ? color(0, 255, 0) : color(150));
  ellipse(baseX + gap * 2, baseY, 60);
  fill(0);
  text("B2", baseX + gap * 2, baseY);

  fill(stateIndicators.B3 ? color(0, 255, 0) : color(150));
  ellipse(baseX + gap * 3, baseY, 60);
  fill(0);
  text("B3", baseX + gap * 3, baseY);
}

// 아두이노 연결 버튼 클릭 처리 함수
function connectBtnClick() {
  if (!port.opened()) {
    port.open(9600); // 포트 열기
  } else {
    port.close();    // 포트 닫기
  }
}

// 빨간 LED 주기 변경 시 실행 함수
function changeRedPeriod() {
  redPeriod = redSlider.value(); // 슬라이더 값 저장
  port.write("RED_TIME:" + redPeriod + "\n"); // 아두이노에 전송
}

// 노란 LED 주기 변경 시 실행 함수
function changeYellowPeriod() {
  yellowPeriod = yellowSlider.value();
  port.write("YELLOW_TIME:" + yellowPeriod + "\n"); // 아두이노에 전송
}
