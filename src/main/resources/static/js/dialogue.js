export class DialogueManager {

    constructor(nameElement, textElement, characterElement) {

        this.nameElement = nameElement;
        this.textElement = textElement;
        this.characterElement = characterElement;

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

        this.characterElement.textContent = dialogue.character;

		this.characterElement.className = "";

		this.characterElement.classList.add("character-" + dialogue.character);
		
        this.currentText = dialogue.text;

        this.textElement.textContent = "";

        this.isTyping = true;

        let charIndex = 0;

        this.typingTimer = setInterval(() => {

            this.textElement.textContent += this.currentText.charAt(charIndex);

            charIndex++;

            if (charIndex >= this.currentText.length) {
                this.stopTyping();
            }

        }, 35);
    }

    // 다음 대사 진행
    next() {

		if (this.dialogues.length === 0) {
		    return;
		}
		
        if (this.isTyping) {

            this.stopTyping();

            this.textElement.textContent = this.currentText;

            return;
        }

        this.currentIndex++;

        if (this.currentIndex < this.dialogues.length) {

            this.showDialogue();

        } else {

            this.finishDialogue();
        }
    }

    // 타이핑 중지
    stopTyping() {

        if (this.typingTimer !== null) {

            clearInterval(this.typingTimer);

            this.typingTimer = null;
        }

        this.isTyping = false;
    }

	finishDialogue() {

	    this.stopTyping();

	    this.dialogues = [];
	    this.currentIndex = 0;

	    this.nameElement.textContent = "";
	    this.textElement.textContent = "";

	    this.characterElement.textContent = "";

	    if (this.onComplete) {

	        const callback = this.onComplete;

	        this.onComplete = null;

	        callback();
	    }
	}
}