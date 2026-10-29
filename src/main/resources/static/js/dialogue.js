export class DialogueManager {

	constructor(
	    nameElement,
	    textElement,
	    characterElement,
	    visualManager,
	    choiceManager,
		gameStateManager,
		dialogueLogManager
	) {

        this.nameElement = nameElement;
        this.textElement = textElement;
        this.characterElement = characterElement;
		this.visualManager = visualManager;
		this.choiceManager = choiceManager;
		this.gameStateManager = gameStateManager;
		this.dialogueLogManager = dialogueLogManager;
		
		// 현재 선택지 처리 상태
		this.isChoicePending = false;
		
		// 선택지 분기 대화 상태
		this.branchDialogues = [];
		this.branchIndex = 0;
		this.isInBranch = false;
		
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
		
		this.branchDialogues = [];
		this.branchIndex = 0;
		this.isInBranch = false;

        if (this.dialogues.length > 0) {
            this.showDialogue();
        } else {
            this.finishDialogue();
        }
    }

	// 현재 출력할 대사 가져오기
	getCurrentDialogue() {

	    if (this.isInBranch) {
	        return this.branchDialogues[this.branchIndex];
	    }

	    return this.dialogues[this.currentIndex];
	}
	
    // 현재 대사 출력
	showDialogue() {

	    this.stopTyping();

	    const dialogue = this.getCurrentDialogue();

	    if (!dialogue) {
	        return;
	    }

	    this.nameElement.textContent = dialogue.speaker;

	    this.visualManager.applyVisual(dialogue.visual);

	    this.currentText = dialogue.text;

	    this.textElement.textContent = "";

	    // 새로운 대사를 대화 기록에 저장
	    this.dialogueLogManager.addLog(
	        dialogue.speaker,
	        dialogue.text
	    );

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

	    const dialogue = this.getCurrentDialogue();

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

	    console.log("선택한 항목:", choiceId);

	    this.isChoicePending = false;

	    const dialogue = this.getCurrentDialogue();

	    // 선택지 ID가 설정되어 있다면 결과 저장
	    if (dialogue?.choiceKey) {
	        this.gameStateManager.recordChoice(
	            dialogue.choiceKey,
	            choiceId
	        );
	    }

	    // 선택 결과에 따른 분기 대화
	    const selectedBranch = dialogue?.branches?.[choiceId];

	    if (Array.isArray(selectedBranch) && selectedBranch.length > 0) {

	        this.branchDialogues = selectedBranch;
	        this.branchIndex = 0;
	        this.isInBranch = true;

	        this.showDialogue();
	        return;
	    }
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

	    // 분기 대사 진행 중인 경우
	    if (this.isInBranch) {

	        this.branchIndex++;

	        // 아직 출력할 분기 대사가 남아 있다면
	        if (this.branchIndex < this.branchDialogues.length) {

	            this.showDialogue();
	            return;
	        }

	        // 분기 대사가 모두 끝났다면
	        this.branchDialogues = [];
	        this.branchIndex = 0;
	        this.isInBranch = false;
	    }

	    // 공통 대사 진행
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

		// 분기 상태 초기화
		this.branchDialogues = [];
		this.branchIndex = 0;
		this.isInBranch = false;
		this.isChoicePending = false;
		
	    this.nameElement.textContent = "";
	    this.textElement.textContent = "";

	    if (this.onComplete) {

	        const callback = this.onComplete;

	        this.onComplete = null;

	        callback();
	    }
	}
}