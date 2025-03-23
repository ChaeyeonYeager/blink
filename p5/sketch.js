// 신호등 비전 컨트롤

let port;  // 시리얼 포트 객체를 저장할 변수
let connectBtn;  // 아두이노 연결 버튼 객체
let currentSignal = "None";  // 현재 수신한 시리얼 신호를 저장
let brightness = 0;  // 아두이노에서 전달받은 밝기 값 (0~255 범위)

let handPose;  // ml5.js의 handPose 모델 객체 (손 제스처 인식용)
let video;     // 웹캠 영상 객체
let hands = [];  // 인식된 손 정보(keypoints)를 저장할 배열

// LED 주기 조절용 슬라이더 변수 선언
let redSlider, yellowSlider, blueSlider;
// 초기 주기값 설정
let redPeriod = 2000;      // 빨간 LED 주기 (기본 2000ms)
let yellowPeriod = 500;    // 노란 LED 주기 (기본 500ms)
let bluePeriod = 2000;     // 파란 LED 주기 (고정값 2000ms)

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

// 제스처 조절용 업데이트 쿨다운 (중복 조절 방지)
let lastRedAdjustTime = 0;
let lastYellowAdjustTime = 0;
let lastBlueAdjustTime = 0;
// 새로 추가: 왼쪽손 주먹 관련 기본 제스처 쿨다운
let lastBasicGestureTime = 0;

// 영상 관련 변수
let videoOffsetX = 780;
let videoOffsetY = 20;
let videoDisplayWidth = 400;
let videoDisplayHeight = 300;
let videoOriginalWidth = 640;
let videoOriginalHeight = 480;

handPose = ml5.handPose();

function setup() {
  createCanvas(1200, 600);  // 캔버스 생성

  port = createSerial();   // 시리얼 포트 객체 생성
  let usedPorts = usedSerialPorts();  // 이전에 사용한 포트 목록 확인
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 9600);  // 자동으로 첫 번째 포트를 열고 통신 시작
  }

  // 아두이노 연결 버튼 생성
  connectBtn = createButton("Connect to Arduino");
  connectBtn.position(10, height - 40);
  connectBtn.mousePressed(connectBtnClick);

  video = createCapture(VIDEO, {flipped:true});
  video.size(videoOriginalWidth, videoOriginalHeight);
  video.hide();
  handPose.detectStart(video, gotHands);

  // 빨간 LED 주기 슬라이더 생성
  redSlider = createSlider(0, 5000, redPeriod, 100);
  redSlider.position(10, 10);
  redSlider.size(300);
  redSlider.input(changeRedPeriod);

  // 노란 LED 주기 슬라이더 생성
  yellowSlider = createSlider(0, 5000, yellowPeriod, 100);
  yellowSlider.position(10, 50);
  yellowSlider.size(300);
  yellowSlider.input(changeYellowPeriod);

  // 파란 LED 주기 슬라이더 생성 
  blueSlider = createSlider(0, 5000, bluePeriod, 100);
  blueSlider.position(10, 90);
  blueSlider.size(300);
  blueSlider.input(changeBluePeriod);

  textSize(18);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(500);

  // 시리얼 데이터 읽기
  let count = 0;
  while (port.available() > 0 && count < 10) {
    let data = port.readUntil("\n").trim();
    if (data.length > 0) {
      parseSerialData(data);
    }
    count++;
  }

  // 상태 메시지를 1초 이상 못 받으면 상태 초기화
  if (millis() - lastStateMessageTime > 1000) {
    stateIndicators.B1 = false;
    stateIndicators.B2 = false;
    stateIndicators.B3 = false;
  }
  if (!stateIndicators.B1 && !stateIndicators.B2 && !stateIndicators.B3) {
    stateIndicators.loop = true;
  } else {
    stateIndicators.loop = false;
  }

  drawBrightnessGauge(brightness);

  // 텍스트 정보 출력
  fill(0);
  textAlign(LEFT, TOP);
  text("Brightness: " + brightness, 10, 180);
  text("Red Period: " + redPeriod + " ms", 320, 30);
  text("Yellow Period: " + yellowPeriod + " ms", 320, 70);
  text("Blue Period: " + bluePeriod + " ms", 320, 110);

  drawTrafficLight();
  drawStateCircles();

  image(video, videoOffsetX, videoOffsetY, videoDisplayWidth, videoDisplayHeight);
  // 손 keypoint 그리기
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    // 해당 손의 키포인트(손가락 관절 등) 개수만큼 반복
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j]; // 현재 키포인트를 가져옴
      fill(255, 0, 0);  // 키포인트를 빨간색으로 채움
      noStroke();
      // 좌우 반전 적용 (keypoint.x 값 반전)
      // 좌우 반전을 적용하여 화면에 올바르게 표시되도록 처리
      // 원래 좌표는 왼쪽이 0, 오른쪽이 최대값인데,
      // 좌우 반전을 위해 x좌표를 뒤집어줌
      let scaledX = videoOffsetX + (videoDisplayWidth - (keypoint.x * videoDisplayWidth / videoOriginalWidth));
      let scaledY = videoOffsetY + (keypoint.y * videoDisplayHeight / videoOriginalHeight);
      circle(scaledX, scaledY, 10);
    }
  }

  // 손 제스처를 통한 LED 주기 조절 및 상태 전환 기능 처리
  processGestures();
}

function gotHands(results) {
  hands = results;
}

// 시리얼 데이터 분석 함수
function parseSerialData(data) {

  // 수신된 시리얼 데이터를 currentSignal에 저장
  currentSignal = data;

  if (data.startsWith("B:")) {
    // "B:" 이후의 숫자 부분만 잘라서 정수로 변환해 brightness에 저장
    brightness = int(data.substring(2).trim());
    return;
  }

  if (data.startsWith("LED:")) {
    // "LED:" 이후 문자열을 대문자로 변환하여 ledMode에 저장
    // 예: "LED:BLINK" → ledMode = "BLINK"
    ledMode = data.substring(4).trim().toUpperCase();
    return;
  }

  if (data.startsWith("LED_STATE:")) {
    // "LED_STATE:" 이후 문자열을 대문자로 변환하여 ledBlinkState에 저장
    let state = data.substring(10).trim().toUpperCase();
    ledBlinkState = (state === "ON");
    return;
  }

  if (data === "B1") {
     // B1 상태: B1만 true, 나머지는 false
    stateIndicators.B1 = true;
    stateIndicators.B2 = false;
    stateIndicators.B3 = false;
    // 상태 변경 시간 기록
    lastStateMessageTime = millis();
  } else if (data === "B2") {
    // B2 상태: B2만 true, 나머지는 false
    stateIndicators.B1 = false;
    stateIndicators.B2 = true;
    stateIndicators.B3 = false;

    lastStateMessageTime = millis();
  } else if (data === "B3") {
    // B3 상태: B3만 true, 나머지는 false
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
  text("Brightness Gauge", 320, 150);
  fill(200);
  rect(320, 160, 300, 20);
  let w = map(val, 0, 255, 0, 300);
  fill(100, 200, 100);
  rect(320, 160, w, 20);
}

// 신호등 그리기 함수
function drawTrafficLight() {
  let x = width / 2;
  let y = 250;
  let blinkOn = ledBlinkState;

  noFill();
  stroke(0);
  strokeWeight(2);
  ellipse(x, y, 60);
  ellipse(x, y + 70, 60);
  ellipse(x, y + 140, 60);

  noStroke();
  // 빨간 LED
  let redOn = false;
  if (ledMode === "RED") redOn = true;
  else if (ledMode === "RED_BLINK") redOn = blinkOn;
  else if (ledMode === "ALL" || ledMode === "ALL_BLINK")
    redOn = (ledMode === "ALL") || (ledMode === "ALL_BLINK" && blinkOn);
  fill(redOn ? color(255, 0, 0) : color(100));
  ellipse(x, y, 60);

  // 노란 LED
  let yellowOn = false;
  if (ledMode === "YELLOW") yellowOn = true;
  else if (ledMode === "YELLOW_BLINK") yellowOn = blinkOn;
  else if (ledMode === "ALL" || ledMode === "ALL_BLINK")
    yellowOn = (ledMode === "ALL") || (ledMode === "ALL_BLINK" && blinkOn);
  fill(yellowOn ? color(255, 255, 0) : color(100));
  ellipse(x, y + 70, 60);

  // 파란 LED
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
  textAlign(CENTER, CENTER);

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
    port.open(9600);
  } else {
    port.close();
  }
}

// 슬라이더 입력 함수들
function changeRedPeriod() {
  redPeriod = redSlider.value();
  port.write("RED_TIME:" + redPeriod + "\n");
}

function changeYellowPeriod() {
  yellowPeriod = yellowSlider.value();
  port.write("YELLOW_TIME:" + yellowPeriod + "\n");
}

function changeBluePeriod() {
  bluePeriod = blueSlider.value();
  port.write("BLUE_TIME:" + bluePeriod + "\n");
}

// ─────────────────────────────
// 손 제스처를 통한 LED 주기 조절 및 상태 전환 기능
// ─────────────────────────────
// ─────────────────────────────
// 손 제스처를 통한 LED 주기 조절 및 버튼 기능 전환
// ─────────────────────────────
function processGestures() {
  // 두 손 모두 검출되었는지 확인
  if (hands.length < 2) return; // 한 손만 있으면 아무 동작 안 함

  let leftHand = null;
  let rightHand = null;
  
  // ─────────────────────────────
  // [2] 왼손/오른손 구분
  // (기준: 화면의 중앙값을 기준으로 x좌표가 더 크면 왼손, 작으면 오른손)
  // ─────────────────────────────
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let wrist = hand.keypoints[0];
    // 원본 영상 기준: x가 320보다 크면 왼손, 작으면 오른손 (사람 기준)
    if (wrist.x > videoOriginalWidth / 2) {
      leftHand = hand;
    } else {
      rightHand = hand;
    }
  }

   // 두 손 모두 정확히 분류되지 않으면 처리 중단
  if (!leftHand || !rightHand) return;

  let currentTime = millis();

  // ─────────────────────────────
  // [3] 왼손의 펼쳐진 손가락 개수 계산 (엄지 제외)
  // tip(끝) y좌표 < pip(중간 관절) y좌표 → 손가락이 펴진 상태
  // ─────────────────────────────
  let leftFingerCount = 0;
  // 인덱스: tip(8) vs pip(6)
  if (leftHand.keypoints[8].y < leftHand.keypoints[6].y) leftFingerCount++;
  // 중지: tip(12) vs pip(10)
  if (leftHand.keypoints[12].y < leftHand.keypoints[10].y) leftFingerCount++;
  // 약지: tip(16) vs pip(14)
  if (leftHand.keypoints[16].y < leftHand.keypoints[14].y) leftFingerCount++;
  // 새끼: tip(20) vs pip(18)
  if (leftHand.keypoints[20].y < leftHand.keypoints[18].y) leftFingerCount++;

  // ─────────────────────────────
  // [4] 왼손이 주먹(손가락 0개)이면 → 오른손 제스처로 버튼 기능 조작
  // ─────────────────────────────
  if (leftFingerCount === 0) {
    // 오른손의 확장된 손가락 개수 계산 (thumb 제외)
    let rightFingerCount = 0;
    if (rightHand.keypoints[8].y < rightHand.keypoints[6].y) rightFingerCount++;  // 검지
    if (rightHand.keypoints[12].y < rightHand.keypoints[10].y) rightFingerCount++;  // 중지 
    if (rightHand.keypoints[16].y < rightHand.keypoints[14].y) rightFingerCount++;  // 약지
    if (rightHand.keypoints[20].y < rightHand.keypoints[18].y) rightFingerCount++;    // 새끼

    // 쿨다운 설정: 최소 0.5초 간격으로만 동작 변경 가능
    if (typeof lastButtonAdjustTime === 'undefined') {
      lastButtonAdjustTime = 0;
    }
    if (currentTime - lastButtonAdjustTime > 500) {
      // 버튼 기능 제어 - 손가락 개수에 따라 모드 변경
      if (rightFingerCount === 0) {
        // 오른손 주먹 → 기본동작(loop) 전환 (즉, B1/B2/B3 해제)
        port.write("LOOP\n");
        stateIndicators.loop = true;
        stateIndicators.B1 = false;
        stateIndicators.B2 = false;
        stateIndicators.B3 = false;
        console.log("Loop Mode");
      } else if (rightFingerCount === 1) {
        // 오른손 손가락 1개 → B1 동작
        port.write("B1\n");
        stateIndicators.loop = false;
        stateIndicators.B1 = true;
        stateIndicators.B2 = false;
        stateIndicators.B3 = false;
        console.log("B1 Mode");
      } else if (rightFingerCount === 2) {
        // 오른손 손가락 2개 → B2 동작
        port.write("B2\n");
        stateIndicators.loop = false;
        stateIndicators.B1 = false;
        stateIndicators.B2 = true;
        stateIndicators.B3 = false;
        console.log("B2 Mode");
      } else if (rightFingerCount === 3) {
        // 오른손 손가락 3개 → B3 동작
        port.write("B3\n");
        stateIndicators.loop = false;
        stateIndicators.B1 = false;
        stateIndicators.B2 = false;
        stateIndicators.B3 = true;
        console.log("B3 Mode");
      }
      lastButtonAdjustTime = currentTime;
    }
    // 버튼 동작 처리 후 다른 제스처는 무시
    return;
  }
  
  // ─────────────────────────────
  // [5] 오른손 제스처 분석 (Thumbs Up / Down)
  // → LED 주기 조절 제스처로 사용
  // ─────────────────────────────
  let rWrist = rightHand.keypoints[0];  // 손목
  let thumbTip = rightHand.keypoints[4]; // 엄지 손가락 끝
  let gesture = null; 
  let gestureThreshold = 30; // 손목과 엄지 끝 y좌표 차이 기준
  if ((rWrist.y - thumbTip.y) > gestureThreshold) {
    gesture = "up"; // 엄지가 손목보다 위에 있음 → Thumbs up
  } else if ((thumbTip.y - rWrist.y) > gestureThreshold) {
    gesture = "down"; // 엄지가 손목보다 아래에 있음 → Thumbs down
  }
  if (!gesture) return;// 제스처가 명확하지 않으면 동작하지 않음

  // ─────────────────────────────
  // [6] LED 주기 조절 - 왼손 손가락 개수에 따라 대상 색상 결정
  // ─────────────────────────────
  let step = 100; // 조절 단위 (ms)
  
  // 왼손 손가락 1개 → 빨간 LED 주기 조절
  if (leftFingerCount === 1 && currentTime - lastRedAdjustTime > 500) {
    if (gesture === "up") {
      redPeriod = min(redPeriod + step, 5000);  // 최대 5000ms 제한
    } else if (gesture === "down") {
      redPeriod = max(redPeriod - step, 0); // 최소 0ms 제한
    }
    redSlider.value(redPeriod); // 슬라이더 갱신
    port.write("RED_TIME:" + redPeriod + "\n"); // 아두이노에 주기 전송
    lastRedAdjustTime = currentTime;
  }
  // 왼손 손가락 2개 → 노란 LED 주기 조절
  else if (leftFingerCount === 2 && currentTime - lastYellowAdjustTime > 500) {
    if (gesture === "up") {
      yellowPeriod = min(yellowPeriod + step, 5000);
    } else if (gesture === "down") {
      yellowPeriod = max(yellowPeriod - step, 0);
    }
    yellowSlider.value(yellowPeriod);
    port.write("YELLOW_TIME:" + yellowPeriod + "\n");
    lastYellowAdjustTime = currentTime;
  }
  // 왼손 손가락 3개 → 파란 LED 주기 조절
  else if (leftFingerCount === 3 && currentTime - lastBlueAdjustTime > 500) {
    if (gesture === "up") {
      bluePeriod = min(bluePeriod + step, 5000);
    } else if (gesture === "down") {
      bluePeriod = max(bluePeriod - step, 0);
    }
    blueSlider.value(bluePeriod);
    port.write("BLUE_TIME:" + bluePeriod + "\n");
    lastBlueAdjustTime = currentTime;
  }
}
