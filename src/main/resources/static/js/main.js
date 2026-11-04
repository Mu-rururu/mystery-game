import { GameStateManager } from "./gameStateManager.js";
import { ChoiceManager } from "./choiceManager.js";
import { VisualManager } from "./visualManager.js";
import { DialogueManager } from "./dialogue.js";
import { TransitionManager } from "./transition.js";
import { SceneManager } from "./sceneManager.js";
import { DialogueLogManager } from "./dialogueLogManager.js";
import { SaveManager } from "./saveManager.js";
import { InvestigationManager } from "./investigationManager.js";

// ========================================
// HTML 요소
// ========================================

const titleScreen =
    document.getElementById("title-screen");

const gameScreen =
    document.getElementById("game-screen");

const startButton =
    document.getElementById("start-button");

// CONTINUE 버튼
const continueButton =
    document.getElementById("continue-button");

// 마지막 저장 시각 표시 영역
const lastSaveTime =
    document.getElementById("last-save-time");

// SAVE 버튼
const saveButton =
    document.getElementById("save-button");

// LOAD 버튼
const loadButton =
    document.getElementById("load-button");

const speakerName =
    document.getElementById("speaker-name");

const dialogueText =
    document.getElementById("dialogue-text");

const dialogueBox =
    document.getElementById("dialogue-box");

const characterElement =
    document.getElementById("character");

const transitionOverlay =
    document.getElementById("transition-overlay");

const choiceContainer =
    document.getElementById("choice-container");

// Phase 1-8B: 대화 기록 UI
const logButton = document.getElementById("log-button");
const logOverlay = document.getElementById("log-overlay");
const logCloseButton = document.getElementById("log-close-button");
const logList = document.getElementById("log-list");

// ========================================
// 관리자 생성
// ========================================

const gameStateManager = new GameStateManager();

const dialogueLogManager = new DialogueLogManager();

const saveManager = new SaveManager();

// Phase 1-10A-④: 조사 시스템 관리자
const investigationManager = new InvestigationManager();

const visualManager = new VisualManager(
    characterElement,
    gameScreen
);

const choiceManager = new ChoiceManager(choiceContainer);

const dialogueManager = new DialogueManager(
    speakerName,
    dialogueText,
    characterElement,
    visualManager,
    choiceManager,
    gameStateManager,
	dialogueLogManager
);

// Phase 1-10C-④-B: 조사 시스템과 대화 시스템 연결
investigationManager.dialogueManager = dialogueManager;

const transitionManager = new TransitionManager(transitionOverlay);

const sceneManager = new SceneManager(
    dialogueManager,
    transitionManager,
    visualManager,
    gameStateManager,
    investigationManager
);

// 대화 기록창 열림 여부
let isLogOpen = false;

// CONTINUE 버튼 및 마지막 저장 시각 갱신
function updateContinueButton() {

    const saveData = saveManager.load();

    const hasSave = !!(
        saveData &&
        saveData.data &&
        saveData.data.gameState &&
        Array.isArray(saveData.data.dialogueLogs) &&
        saveData.data.dialogueProgress
    );

    continueButton.disabled = !hasSave;

    // 저장 정보가 없으면 시각 표시 숨기기
    if (!hasSave || !saveData.savedAt) {
        lastSaveTime.textContent = "";
        lastSaveTime.classList.add("hidden");
        return;
    }

    const savedDate = new Date(saveData.savedAt);

    // 저장 시각이 올바르지 않은 경우
    if (Number.isNaN(savedDate.getTime())) {
        lastSaveTime.textContent = "";
        lastSaveTime.classList.add("hidden");
        return;
    }

    // 한국 시간 형식으로 출력
    const formattedTime = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(savedDate);

    lastSaveTime.textContent =
        `마지막 저장: ${formattedTime}`;

    lastSaveTime.classList.remove("hidden");
}

// 최초 타이틀 화면에서 저장 데이터 확인
updateContinueButton();

// ========================================
// 게임 시작
// ========================================

async function startGame() {

    startButton.disabled = true;

    // 새 게임 시작 시 진행 상태 초기화
    gameStateManager.reset();
	// 대화 기록 초기화
	dialogueLogManager.reset();
	
    titleScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    await sceneManager.loadScene("prologue.json");
}

// ========================================
// Phase 1-9C-④: 저장된 게임 이어하기
// ========================================

async function continueGame() {

    // 장면 전환이나 복원 작업 중 중복 실행 방지
    if (
        sceneManager.isLoading ||
        transitionManager.isTransitioning ||
        choiceManager.isAnimating ||
        choiceManager.isSelecting
    ) {
        console.warn("현재 게임을 불러올 수 없습니다.");
        return false;
    }

    // 이번 단계에서는 타이틀 화면에서만 실행
    if (titleScreen.classList.contains("hidden")) {
        console.warn("CONTINUE는 타이틀 화면에서 실행해 주세요.");
        return false;
    }

    const saveData = saveManager.load();

    if (!saveData || !saveData.data) {
        console.error("불러올 저장 데이터가 없습니다.");
        return false;
    }

    const {
        gameState,
        dialogueLogs,
        dialogueProgress
    } = saveData.data;

    // 저장 데이터 기본 구조 확인
    if (
        !gameState ||
        typeof gameState.currentScene !== "string" ||
        !Array.isArray(dialogueLogs) ||
        !dialogueProgress ||
        typeof dialogueProgress !== "object"
    ) {
        console.error("저장 데이터에 필요한 정보가 없습니다.");
        return false;
    }

    // 기존 상태 백업
    const previousState = gameStateManager.getState();
    const previousLogs = dialogueLogManager.getLogs();

    // 복원 성공 여부
    let success = false;

    try {

        // 게임 상태 복원
        if (!gameStateManager.restoreState(gameState)) {
            throw new Error("게임 상태 복원 실패");
        }

        // 대화 기록 복원
        if (!dialogueLogManager.restoreLogs(dialogueLogs)) {
            throw new Error("대화 기록 복원 실패");
        }

        // 저장된 장면 및 대화 위치 복원
        const sceneRestored = await sceneManager.restoreScene(
            gameState.currentScene,
            dialogueProgress
        );

        if (!sceneRestored) {
            throw new Error("장면 복원 실패");
        }

        // 복원이 성공했을 때만 게임 화면 표시
        titleScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");

        startButton.disabled = true;

        success = true;

        console.log("CONTINUE 성공");

        return true;

    } catch (error) {

        console.error("CONTINUE 실패:", error);

        // 이전 게임 상태와 LOG 복구
        gameStateManager.restoreState(previousState);
        dialogueLogManager.restoreLogs(previousLogs);

        return false;

    } finally {

        if (!success) {
            titleScreen.classList.remove("hidden");
            gameScreen.classList.add("hidden");
        }
    }
}

// ========================================
// Phase 1-9D-②: 게임 저장
// ========================================

function saveGame() {

    // LOG 창이 열려 있거나 장면 전환 중이면 저장 차단
    if (
        isLogOpen ||
        sceneManager.isLoading ||
        !sceneManager.isActive ||
        transitionManager.isTransitioning ||
        choiceManager.isAnimating ||
        choiceManager.isSelecting
    ) {
        console.warn("현재 상태에서는 게임을 저장할 수 없습니다.");
        return false;
    }

    // 현재 대화 진행 정보
    const dialogueProgress = dialogueManager.getProgress();

    if (!dialogueProgress) {
        console.error("저장할 대화 진행 정보가 없습니다.");
        return false;
    }

    // 저장할 데이터 구성
    const saveData = {
        gameState: gameStateManager.getState(),
        dialogueLogs: dialogueLogManager.getLogs(),
        dialogueProgress: dialogueProgress
    };

    // 기존 저장 데이터가 있다면 덮어쓰기 확인
    const existingSave = saveManager.load();

    if (existingSave) {
        const confirmed = confirm(
            "기존 저장 데이터를 덮어쓰시겠습니까?"
        );

        if (!confirmed) {
            console.log("저장을 취소했습니다.");
            return false;
        }
    }

    // 실제 저장 실행
    const saved = saveManager.save(saveData);

    if (saved) {
        console.log("게임 저장 성공");

        alert("게임이 저장되었습니다.");

        return true;
    }

    console.error("게임 저장 실패");

    alert("게임을 저장하지 못했습니다.");

    return false;
}

// ========================================
// Phase 1-9D-③-B: 게임 불러오기
// ========================================

async function loadGame() {

    // 게임 진행 중이 아니거나 다른 작업 중이면 차단
    if (
        isLogOpen ||
        sceneManager.isLoading ||
        !sceneManager.isActive ||
        transitionManager.isTransitioning ||
        choiceManager.isAnimating ||
        choiceManager.isSelecting
    ) {
        console.warn("현재 상태에서는 게임을 불러올 수 없습니다.");
        return false;
    }

    // 저장 데이터 확인
    const saveData = saveManager.load();

    if (!saveData || !saveData.data) {
        console.warn("불러올 저장 데이터가 없습니다.");
        alert("저장된 게임이 없습니다.");
        return false;
    }

    // 저장된 게임을 불러오기 전에 확인
    const confirmed = confirm(
        "저장된 게임을 불러오시겠습니까?\n\n" +
        "저장하지 않은 현재 진행 상황은 사라집니다."
    );

    if (!confirmed) {
        console.log("불러오기를 취소했습니다.");
        return false;
    }

    const {
        gameState,
        dialogueLogs,
        dialogueProgress
    } = saveData.data;

    // 저장 데이터 기본 구조 검증
    if (
        !gameState ||
        typeof gameState.currentScene !== "string" ||
        !Array.isArray(dialogueLogs) ||
        !dialogueProgress ||
        typeof dialogueProgress !== "object" ||
        Array.isArray(dialogueProgress)
    ) {
        console.error("저장 데이터가 올바르지 않습니다.");
        alert("저장 데이터를 불러올 수 없습니다.");
        return false;
    }

    // 기존 상태 백업
    const previousState = gameStateManager.getState();
    const previousLogs = dialogueLogManager.getLogs();

    // 현재 대화 및 장면 위치 백업
    const previousScene =
        gameStateManager.getState().currentScene;

    const previousProgress =
        dialogueManager.getProgress();

    try {

        // 저장된 장면 및 대화 위치 복원
        const sceneRestored = await sceneManager.restoreScene(
            gameState.currentScene,
            dialogueProgress
        );

        if (!sceneRestored) {
            throw new Error("장면 복원 실패");
        }

        // 저장된 게임 상태 복원
        const stateRestored =
            gameStateManager.restoreState(gameState);

        if (!stateRestored) {
            throw new Error("게임 상태 복원 실패");
        }

        // 저장된 LOG 기록 복원
        const logsRestored =
            dialogueLogManager.restoreLogs(dialogueLogs);

        if (!logsRestored) {
            throw new Error("LOG 기록 복원 실패");
        }

        console.log("게임 불러오기 성공");

        return true;

    } catch (error) {

        console.error("게임 불러오기 실패:", error);

        // 기존 게임 상태 복원
        gameStateManager.restoreState(previousState);
        dialogueLogManager.restoreLogs(previousLogs);

        // 장면이 변경된 경우 이전 위치로 복원 시도
        if (previousScene && previousProgress) {

            const rollbackSucceeded =
                await sceneManager.restoreScene(
                    previousScene,
                    previousProgress
                );

            if (!rollbackSucceeded) {
                console.error("이전 장면 복원에도 실패했습니다.");
            }
        }

        alert("게임을 불러오지 못했습니다.");

        return false;
    }
}

// 대화 기록 목록 출력
function renderDialogueLogs() {

    const logs = dialogueLogManager.getLogs();

    logList.replaceChildren();

    for (const log of logs) {

        const entry = document.createElement("div");
        entry.className = "log-entry";

        const speaker = document.createElement("div");
        speaker.className = "log-speaker";
        speaker.textContent = log.speaker;

        const text = document.createElement("div");
        text.className = "log-text";
        text.textContent = log.text;

        entry.appendChild(speaker);
        entry.appendChild(text);

        logList.appendChild(entry);
    }

    // 가장 최근 대사로 스크롤
    logList.scrollTop = logList.scrollHeight;
}

// LOG 화면이 열려 있는 동안 선택지 입력 차단
function disableChoiceButtons() {

    const buttons =
        choiceContainer.querySelectorAll(".choice-item");

    buttons.forEach(button => {
        button.disabled = true;
    });
}

// LOG 화면을 닫으면 선택지 입력 복구
function enableChoiceButtons() {

    const buttons =
        choiceContainer.querySelectorAll(".choice-item");

    buttons.forEach(button => {
        button.disabled = false;
    });
}

function openDialogueLog() {

    // 이미 LOG 화면이 열려 있다면 중복 실행 방지
    if (isLogOpen) {
        return;
    }

    // 장면 전환 및 선택지 애니메이션 중 LOG 사용 제한
    if (
        sceneManager.isLoading ||
        !sceneManager.isActive ||
        transitionManager.isTransitioning ||
        choiceManager.isAnimating ||
        choiceManager.isSelecting
    ) {
        return;
    }

    // 대사 타이핑 일시정지
    dialogueManager.pauseTyping();

    // 선택지 입력 차단
    disableChoiceButtons();

    // 대화 기록 목록 출력
    renderDialogueLogs();

    // LOG 화면 표시
    logOverlay.classList.remove("hidden");

    isLogOpen = true;
}

function closeDialogueLog() {

    if (!isLogOpen) {
        return;
    }

    logOverlay.classList.add("hidden");

    isLogOpen = false;

    // 선택지 입력 복구
    enableChoiceButtons();

    // 일시정지했던 타이핑 재개
    dialogueManager.resumeTyping();
}

// ========================================
// 이벤트 등록
// ========================================

startButton.addEventListener("click", startGame);

// CONTINUE 버튼
continueButton.addEventListener("click", continueGame);

// SAVE 버튼
saveButton.addEventListener("click", saveGame);

// LOAD 버튼
loadButton.addEventListener("click", loadGame);

dialogueBox.addEventListener("click", () => {

    // 일반 스토리 또는 조사 대사 출력 중에만 진행 허용
    const canAdvanceDialogue =
        sceneManager.isActive ||
        (
            investigationManager.isActive &&
            investigationManager.isShowingInvestigationDialogue
        );

    if (
        isLogOpen ||
        sceneManager.isLoading ||
        !canAdvanceDialogue ||
        transitionManager.isTransitioning
    ) {
        return;
    }

    dialogueManager.next();
});

document.addEventListener("keydown", (event) => {
    // 스페이스바만 처리
    if (event.code !== "Space") return;

    // 버튼이나 입력창에 포커스가 있을 때는 무시
    const activeElement = document.activeElement;

    if (
        activeElement?.matches(
            "button, input, textarea, select, [contenteditable]"
        )
    ) return;

    // 스페이스바의 기본 스크롤 동작 방지
    event.preventDefault();

    // 키를 누르고 있을 때 반복 입력 방지
    if (event.repeat) return;

    const canAdvanceDialogue =
        sceneManager.isActive ||
        (investigationManager.isActive &&
            investigationManager.isShowingInvestigationDialogue);

    if (
        isLogOpen ||
        sceneManager.isLoading ||
        !canAdvanceDialogue ||
        transitionManager.isTransitioning
    ) return;

    dialogueManager.next();
});

// LOG 버튼
logButton.addEventListener("click", openDialogueLog);

// 닫기 버튼
logCloseButton.addEventListener("click", closeDialogueLog);

// ESC 키로 닫기
document.addEventListener("keydown", (event) => {

    if (event.key === "Escape" && isLogOpen) {

        closeDialogueLog();

        // LOG 버튼에 남아 있는 키보드 포커스 해제
        if (document.activeElement === logButton) {
            logButton.blur();
        }
    }

});

// ========================================
// Phase 1-7: 게임 상태 테스트
// ========================================

// 개발 중 상태 확인용
window.gameStateManager = gameStateManager;
window.dialogueLogManager = dialogueLogManager;
window.saveManager = saveManager;
// 대화 진행 상태 테스트용
window.dialogueManager = dialogueManager;
// Phase 1-9C-①: 저장된 상태 및 LOG 복원 테스트
window.testRestoreSave = function() {

    const saveData = saveManager.load();

    if (!saveData || !saveData.data) {
        console.error("복원할 저장 데이터가 없습니다.");
        return false;
    }

    const { gameState, dialogueLogs } = saveData.data;

    // 데이터가 모두 유효한지 먼저 확인
    if (!gameState || !Array.isArray(dialogueLogs)) {
        console.error("저장 데이터에 필요한 정보가 없습니다.");
        return false;
    }

    const stateRestored =
        gameStateManager.restoreState(gameState);

    const logsRestored =
        dialogueLogManager.restoreLogs(dialogueLogs);

    if (!stateRestored || !logsRestored) {
        console.error("저장 데이터 복원 실패");
        return false;
    }

    console.log("게임 상태 및 LOG 기록 복원 성공");

    return true;
};
window.sceneManager = sceneManager;
// Phase 1-9C-④: CONTINUE 테스트용
window.continueGame = continueGame;
// Phase 1-10A-④: 조사 상태 확인용
window.investigationManager = investigationManager;