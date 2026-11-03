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

		// 현재 진행 중인 분기의 선택지 ID
		this.branchChoiceId = null;

        this.dialogues = [];
        this.currentIndex = 0;

		this.isTyping = false;
		this.typingTimer = null;

		// 현재 출력한 글자 위치
		this.charIndex = 0;

		// 타이핑 일시정지 상태
		this.isPaused = false;

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

		this.branchChoiceId = null;

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

	// 현재 대화 진행 상태 반환
	getProgress() {

		// 진행 중인 대화가 없다면 null 반환
		if (this.dialogues.length === 0) {
			return null;
		}

		return {
			currentIndex: this.currentIndex,
			isInBranch: this.isInBranch,
			branchIndex: this.branchIndex,
			branchChoiceId: this.branchChoiceId,

			// 현재 타이핑 중인지 기록
			isTyping: this.isTyping,

			// 선택지 표시 상태
			isChoicePending: this.isChoicePending
		};
	}

	// 저장된 대화 진행 위치 복원
	restoreProgress(savedProgress) {

		// 선택지 애니메이션 중에는 복원 차단
		if (
			this.choiceManager.isAnimating ||
			this.choiceManager.isSelecting
		) {
			console.warn("선택지 애니메이션 중에는 복원할 수 없습니다.");
			return false;
		}

		if (
			!savedProgress ||
			typeof savedProgress !== "object" ||
			Array.isArray(savedProgress)
		) {
			console.error("올바르지 않은 대화 진행 데이터입니다.");
			return false;
		}

		// 현재 대화 데이터가 준비되어 있는지 확인
		if (!Array.isArray(this.dialogues) || this.dialogues.length === 0) {
			console.error("복원할 대화 데이터가 없습니다.");
			return false;
		}

		const {
			currentIndex,
			isInBranch,
			branchIndex,
			branchChoiceId,
			isTyping,
			isChoicePending
		} = savedProgress;

		// 기본 진행 위치 검증
		if (
			!Number.isInteger(currentIndex) ||
			currentIndex < 0 ||
			currentIndex >= this.dialogues.length ||
			typeof isInBranch !== "boolean" ||
			!Number.isInteger(branchIndex) ||
			branchIndex < 0 ||
			typeof isTyping !== "boolean" ||
			typeof isChoicePending !== "boolean"
		) {
			console.error("대화 진행 데이터 구조가 올바르지 않습니다.");
			return false;
		}

		// 분기 대화 데이터 검증
		let restoredBranch = [];

		if (isInBranch) {

			if (typeof branchChoiceId !== "string") {
				console.error("분기 선택지 ID가 올바르지 않습니다.");
				return false;
			}

			const parentDialogue = this.dialogues[currentIndex];

			restoredBranch = parentDialogue?.branches?.[branchChoiceId];

			if (
				!Array.isArray(restoredBranch) ||
				branchIndex >= restoredBranch.length
			) {
				console.error("분기 대화 데이터를 찾을 수 없습니다.");
				return false;
			}
		}

		// 기존 타이핑 중지
		this.stopTyping();

		// 이전 선택지 UI 초기화
		this.choiceManager.container.replaceChildren();
		this.choiceManager.container.classList.add("hidden");
		this.choiceManager.onChoiceSelected = null;

		// 저장된 진행 위치 적용
		this.currentIndex = currentIndex;
		this.isInBranch = isInBranch;
		this.branchIndex = isInBranch ? branchIndex : 0;
		this.branchChoiceId = isInBranch ? branchChoiceId : null;
		this.branchDialogues = isInBranch ? restoredBranch : [];
		this.isChoicePending = false;

		// 현재 대사를 LOG 중복 없이 출력
		this.showDialogue(false);

		// 저장 시 타이핑이 끝난 상태였다면 전체 문장 표시
		if (!isTyping) {

			this.stopTyping();

			this.textElement.textContent = this.currentText;

			// 선택지가 표시된 상태였다면 다시 표시
			if (isChoicePending) {
				this.onTypingComplete();
			}
		}

		return true;
	}

    // 현재 대사 출력
	showDialogue(addToLog = true) {

	    this.stopTyping();

	    const dialogue = this.getCurrentDialogue();

	    if (!dialogue) {
	        return;
	    }

	    this.nameElement.textContent = dialogue.speaker;

	    this.visualManager.applyVisual(dialogue.visual);

	    this.currentText = dialogue.text;

	    this.textElement.textContent = "";

		// 일반 진행에서만 LOG에 기록 추가
		// 저장 데이터 복원 시에는 중복 기록 방지
		if (addToLog) {
			this.dialogueLogManager.addLog(
				dialogue.speaker,
				dialogue.text
			);
		}

		// 새로운 대사이므로 타이핑 위치 초기화
		this.charIndex = 0;
		this.isPaused = false;

		// 타이핑 시작
		this.startTyping();
	}

	// 현재 위치부터 타이핑 시작
	startTyping() {

		if (this.typingTimer !== null || this.isPaused) {
			return;
		}

		this.isTyping = true;

		// 빈 문자열도 정상적으로 완료 처리
		if (this.charIndex >= this.currentText.length) {
			this.stopTyping();
			this.onTypingComplete();
			return;
		}

		this.typingTimer = setInterval(() => {

			this.textElement.textContent +=
				this.currentText.charAt(this.charIndex);

			this.charIndex++;

			if (this.charIndex >= this.currentText.length) {

				this.stopTyping();
				this.onTypingComplete();
			}
		}, 35);
	}

	// 타이핑 일시정지
	pauseTyping() {

		if (!this.isTyping || this.isPaused) {
			return;
		}

		if (this.typingTimer !== null) {
			clearInterval(this.typingTimer);
			this.typingTimer = null;
		}

		this.isPaused = true;
	}

	// 일시정지한 타이핑 재개
	resumeTyping() {

		if (!this.isPaused) {
			return;
		}

		this.isPaused = false;

		this.startTyping();
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

			// 선택한 분기 ID 기록
			this.branchChoiceId = choiceId;

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
		this.isPaused = false;
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
			this.branchChoiceId = null;
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
		this.branchChoiceId = null;

	    this.nameElement.textContent = "";
	    this.textElement.textContent = "";

	    if (this.onComplete) {

	        const callback = this.onComplete;

	        this.onComplete = null;

	        callback();
	    }
	}
}