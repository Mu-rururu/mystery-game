export class DialogueManager {

	constructor(
	    nameElement,
	    textElement,
	    characterElement,
	    visualManager,
	    choiceManager
	) {

        this.nameElement = nameElement;
        this.textElement = textElement;
        this.characterElement = characterElement;
		this.visualManager = visualManager;
		this.choiceManager = choiceManager;

		// 현재 선택지 처리 상태
		this.isChoicePending = false;
		
        this.dialogues = [];
        this.currentIndex = 0;

        this.isTyping = false;
        this.typingTimer = null;

        this.currentText = "";
        this.onComplete = null;
    }

    // 대화 데이터 설정
    loadDialogues(dialogues, onComplete = null) {

        this.stopTyping();

		this.dialogues = dialogues;
		this.currentIndex = 0;
		this.onComplete = onComplete;

		this.isChoicePending = false;

        if (this.dialogues.length > 0) {
            this.showDialogue();
        } else {
            this.finishDialogue();
        }
    }

    // 현재 대사 출력
    showDialogue() {

        this.stopTyping();

        const dialogue = this.dialogues[this.currentIndex];

        this.nameElement.textContent = dialogue.speaker;

        this.visualManager.applyVisual(dialogue.visual);
		
        this.currentText = dialogue.text;

        this.textElement.textContent = "";

        this.isTyping = true;

        let charIndex = 0;

        this.typingTimer = setInterval(() => {

            this.textElement.textContent += this.currentText.charAt(charIndex);

            charIndex++;

            if (charIndex >= this.currentText.length) {
                this.stopTyping();
				this.onTypingComplete();
            }
        }, 35);
    }

	// 대사 타이핑 완료 후 실행
	onTypingComplete() {

	    const dialogue = this.dialogues[this.currentIndex];

	    if (!dialogue) {
	        return;
	    }

	    // 선택지가 없으면 기존 대화 방식 유지
	    if (!Array.isArray(dialogue.choices) ||
	        dialogue.choices.length === 0) {
	        return;
	    }

	    // 중복 실행 방지
	    if (this.isChoicePending) {
	        return;
	    }

	    this.isChoicePending = true;

	    // 선택지 표시
	    this.choiceManager.showChoices(
	        dialogue.choices,
	        (choiceId) => this.onChoiceComplete(choiceId)
	    );
	}
	
	// 선택지 퇴장 완료 후 실행
	onChoiceComplete(choiceId) {

	    console.log("대화 시스템에서 받은 선택:", choiceId);

	    this.isChoicePending = false;

	    // Phase 1-6B에서는 모든 선택지가 공통 대사로 진행
	    this.advanceDialogue();
	}
	
	// 대화창 클릭 처리
	next() {

	    if (this.dialogues.length === 0) {
	        return;
	    }

	    // 선택지가 표시 중이면 대화 진행 차단
	    if (this.isChoicePending) {
	        return;
	    }

	    // 타이핑 중 클릭하면 문장 전체 표시
	    if (this.isTyping) {
	        this.stopTyping();
	        this.textElement.textContent = this.currentText;

	        // 타이핑을 건너뛰어도 선택지는 표시해야 함
	        this.onTypingComplete();
	        return;
	    }
	    // 일반 대사 진행
	    this.advanceDialogue();
	}
	
    // 타이핑 중지
    stopTyping() {

        if (this.typingTimer !== null) {

            clearInterval(this.typingTimer);

            this.typingTimer = null;
        }

        this.isTyping = false;
    }
	
	// 실제 다음 대사 진행
	advanceDialogue() {

	    this.currentIndex++;

	    if (this.currentIndex < this.dialogues.length) {
	        this.showDialogue();
	    } else {
	        this.finishDialogue();
	    }
	}

	finishDialogue() {

	    this.stopTyping();

	    this.dialogues = [];
	    this.currentIndex = 0;

	    this.nameElement.textContent = "";
	    this.textElement.textContent = "";

	    if (this.onComplete) {

	        const callback = this.onComplete;

	        this.onComplete = null;

	        callback();
	    }
	}
}