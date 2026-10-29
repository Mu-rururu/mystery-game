import { GameStateManager } from "./gameStateManager.js";
import { ChoiceManager } from "./choiceManager.js";
import { VisualManager } from "./visualManager.js";
import { DialogueManager } from "./dialogue.js";
import { TransitionManager } from "./transition.js";
import { SceneManager } from "./sceneManager.js";
import { DialogueLogManager } from "./dialogueLogManager.js";

// ========================================
// HTML 요소
// ========================================

const titleScreen =
    document.getElementById("title-screen");

const gameScreen =
    document.getElementById("game-screen");

const startButton =
    document.getElementById("start-button");

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


// ========================================
// 관리자 생성
// ========================================

const gameStateManager = new GameStateManager();

const dialogueLogManager = new DialogueLogManager();

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

const transitionManager = new TransitionManager(transitionOverlay);

const sceneManager = new SceneManager(
    dialogueManager,
    transitionManager,
    visualManager,
    gameStateManager
);

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
// 이벤트 등록
// ========================================

startButton.addEventListener("click", startGame);

dialogueBox.addEventListener("click", () => {

    if (
        sceneManager.isLoading ||
        !sceneManager.isActive ||
        transitionManager.isTransitioning
    ) {
        return;
    }

    dialogueManager.next();
});

// ========================================
// Phase 1-7: 게임 상태 테스트
// ========================================

// 개발 중 상태 확인용
window.gameStateManager = gameStateManager;
window.dialogueLogManager = dialogueLogManager;