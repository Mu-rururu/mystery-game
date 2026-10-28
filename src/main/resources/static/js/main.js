import { ChoiceManager } from "./choiceManager.js";
import { VisualManager } from "./visualManager.js";
import { DialogueManager } from "./dialogue.js";
import { TransitionManager } from "./transition.js";
import { SceneManager } from "./sceneManager.js";


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

// 캐릭터 및 배경 관리자
const visualManager = new VisualManager(
    characterElement,
    gameScreen
);

// 선택지 관리자
const choiceManager = new ChoiceManager(
    choiceContainer
);

// 대화 관리자
const dialogueManager = new DialogueManager(
    speakerName,
    dialogueText,
    characterElement,
    visualManager,
    choiceManager
);

// 화면 전환 관리자
const transitionManager = new TransitionManager(
    transitionOverlay
);

// 장면 관리자
const sceneManager = new SceneManager(
    dialogueManager,
    transitionManager,
    visualManager
);


// ========================================
// 게임 시작
// ========================================

async function startGame() {

    startButton.disabled = true;

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