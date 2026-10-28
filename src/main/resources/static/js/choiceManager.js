export class ChoiceManager {

    constructor(containerElement) {
        this.container = containerElement;
        this.isAnimating = false;
        this.isSelecting = false;
        this.entryDelay = 150;
        this.animationDuration = 300;
        this.selectionHighlightDuration = 150;
		this.onChoiceSelected = null;
    }

    // 지정된 시간만큼 대기
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 선택지 표시
    async showChoices(choices, onChoiceSelected = null) {

        if (this.isAnimating || this.isSelecting) {
            return;
        }

        this.isAnimating = true;
		this.onChoiceSelected = onChoiceSelected;
        this.container.replaceChildren();
		
        this.container.classList.remove("hidden");

        const buttons = [];

        for (const choice of choices) {

            const button = document.createElement("button");

            button.type = "button";
            button.className = "choice-item";
            button.textContent = choice.text;
            button.disabled = true;
            this.container.appendChild(button);
            buttons.push(button);
        }

        // 첫 번째 선택지부터 순차적으로 등장
        const animations = buttons.map((button, index) => {

            return (async () => {

                await this.wait(index * this.entryDelay);

                button.classList.add("entering");

                await this.wait(this.animationDuration);

            })();
        });

        await Promise.all(animations);

        // 모든 선택지 등장 완료 후 클릭 활성화
        buttons.forEach((button, index) => {

            button.disabled = false;

            button.addEventListener("click", () => {

                this.selectChoice(choices[index], button);
            });
        });

        this.isAnimating = false;
    }

    // 선택지 클릭 처리
    async selectChoice(choice, selectedButton) {

        if (this.isAnimating || this.isSelecting) {
            return;
        }

        this.isSelecting = true;

        const buttons =
            [...this.container.querySelectorAll(".choice-item")];

        // 중복 선택 방지
        buttons.forEach(button => {
            button.disabled = true;
        });

        // 선택한 항목 강조
        selectedButton.classList.add("selected");

        await this.wait(this.selectionHighlightDuration);

        // 기존 등장 애니메이션 제거
        buttons.forEach(button => {
            button.classList.remove("entering");
        });

        // 첫 번째 선택지부터 순차적으로 퇴장
        const animations = buttons.map((button, index) => {

            return (async () => {

                await this.wait(index * this.entryDelay);

                button.classList.add("exiting");

                await this.wait(this.animationDuration);

            })();
        });

        await Promise.all(animations);

        this.container.replaceChildren();
        this.container.classList.add("hidden");

		this.isSelecting = false;

		console.log("선택한 항목:", choice.id);

		// 선택지 퇴장 완료 후 결과 전달
		const callback = this.onChoiceSelected;
		this.onChoiceSelected = null;

		if (callback) {
		    callback(choice.id);
		}
    }
}