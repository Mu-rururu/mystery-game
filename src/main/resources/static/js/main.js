// HTML 요소 가져오기
const titleScreen = document.getElementById("title-screen");
const gameScreen = document.getElementById("game-screen");

const startButton = document.getElementById("start-button");

const speakerName = document.getElementById("speaker-name");
const dialogueText = document.getElementById("dialogue-text");
const dialogueBox = document.getElementById("dialogue-box");


// 테스트용 대화 데이터
const dialogues = [
    {
        speaker: "주인공",
        text: "여기는... 어디지?"
    },
    {
        speaker: "???",
        text: "드디어 깨어났구나."
    },
    {
        speaker: "주인공",
        text: "누구야? 모습을 보여!"
    },
    {
        speaker: "???",
        text: "곧 모든 것을 알게 될 거야."
    }
];


// 현재 대화 위치
let dialogueIndex = 0;


// 게임 시작
function startGame() {

    titleScreen.classList.add("hidden");

    gameScreen.classList.remove("hidden");

    dialogueIndex = 0;

    showDialogue();
}


// 대화 출력
function showDialogue() {

    const dialogue = dialogues[dialogueIndex];

    speakerName.textContent = dialogue.speaker;

    dialogueText.textContent = dialogue.text;
}


// 다음 대화
function nextDialogue() {

    dialogueIndex++;

    if (dialogueIndex < dialogues.length) {

        showDialogue();

    } else {

        speakerName.textContent = "SYSTEM";

        dialogueText.textContent =
            "대화가 종료되었습니다.";

        dialogueBox.removeEventListener(
            "click",
            nextDialogue
        );
    }
}


// 이벤트 연결
startButton.addEventListener("click", startGame);

dialogueBox.addEventListener("click", nextDialogue);