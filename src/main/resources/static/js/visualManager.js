export class VisualManager {

    constructor(characterElement, gameScreen) {

        this.characterElement = characterElement;
        this.gameScreen = gameScreen;

        this.currentCharacter = null;
        this.currentExpression = null;

        // 이미지가 없는 경우 사용할 임시 배경색
        this.backgroundColors = {
            classroom: "#343449",
            hallway: "#3d3540",
            bedroom: "#263746"
        };

        // 이미지 경로 설정
        this.characterBasePath = "/assets/characters/";
        this.backgroundBasePath = "/assets/backgrounds/";

        // 캐릭터 이미지 요소 생성
        this.characterImage = document.createElement("img");

        this.characterImage.className = "character-image";
        this.characterImage.alt = "";

        this.characterElement.replaceChildren(this.characterImage);

        // 이미지 로딩 요청을 구분하기 위한 번호
        this.characterRequestId = 0;
        this.backgroundRequestId = 0;
    }

    // 배경 이미지 설정
    setBackground(background) {

        const requestId = ++this.backgroundRequestId;

        const fallbackColor = this.backgroundColors[background] || "#202030";

        // 이미지가 없는 경우를 대비한 기본 색상
        this.gameScreen.style.backgroundColor = fallbackColor;
        this.gameScreen.style.backgroundImage = "none";

        if (!background) return;

        const imagePath = this.backgroundBasePath + background + ".jpg";

        const image = new Image();

        image.onload = () => {

            if (requestId !== this.backgroundRequestId) {
                return;
            }

            this.gameScreen.style.backgroundImage = `url("${imagePath}")`;

            this.gameScreen.style.backgroundSize = "cover";
            this.gameScreen.style.backgroundPosition = "center";
            this.gameScreen.style.backgroundRepeat = "no-repeat";
        };

        image.onerror = () => {

            if (requestId !== this.backgroundRequestId) {
                return;
            }

            console.warn(
                "배경 이미지를 찾을 수 없습니다:",
                imagePath
            );
        };

        image.src = imagePath;
    }

    // 캐릭터 이미지 표시
    showCharacter(character, expression = "normal") {

        this.currentCharacter = character;
        this.currentExpression = expression;

        const requestId = ++this.characterRequestId;

        this.characterElement.style.display = "flex";

        // 기존 이미지가 남아 보이지 않도록 초기화
        this.characterImage.style.display = "none";
        this.characterImage.removeAttribute("src");

        // 기존 임시 색상 클래스 제거
        this.characterElement.className = "";

		const oldPlaceholder = this.characterElement.querySelector(".placeholder-text");

		if (oldPlaceholder) {
		    oldPlaceholder.remove();
		}
		
        if (!character) {
            this.hideCharacter();
            return;
        }

        const imagePath = this.characterBasePath + character + "/" + expression + ".png";

        const normalPath = this.characterBasePath + character + "/normal.png";

        const defaultPath = "/assets/defaults/character.png";

        const image = new Image();

        image.onload = () => {
            if (requestId !== this.characterRequestId) {
                return;
            }
            this.characterImage.src = image.src;
            this.characterImage.style.display = "block";
        };

        image.onerror = () => {
            if (requestId !== this.characterRequestId) {
                return;
            }
            console.warn("캐릭터 이미지를 찾을 수 없습니다:", image.src);

            // 표정 이미지가 없으면 기본 표정 사용
            if (image.src.endsWith("/" + expression + ".png")&& expression !== "normal") {
                image.src = normalPath;
                return;
            }

            // 기본 표정도 없으면 공통 기본 이미지 사용
            if (!image.src.endsWith("/defaults/character.png")) {
                image.src = defaultPath;
                return;
            }
            // 공통 기본 이미지까지 없으면 임시 표시
            this.showPlaceholder(character, expression);
        };
        image.src = imagePath;
    }

    // 모든 이미지가 없을 때 임시 캐릭터 표시
	showPlaceholder(character, expression) {

	    this.characterImage.style.display = "none";

	    // 기존 텍스트가 있으면 제거
	    const oldPlaceholder = this.characterElement.querySelector(".placeholder-text");

	    if (oldPlaceholder) {
	        oldPlaceholder.remove();
	    }

	    const placeholder = document.createElement("div");

	    placeholder.className = "placeholder-text";
	    placeholder.textContent = character + "\n(" + expression + ")";

	    this.characterElement.appendChild(placeholder);
	    this.characterElement.classList.add("character-placeholder");
	}

    // 캐릭터 숨기기
    hideCharacter() {
        this.characterRequestId++;
        this.currentCharacter = null;
        this.currentExpression = null;
        this.characterElement.style.display = "none";
    }

    // JSON의 visual 데이터 처리
    applyVisual(visual) {
        if (!visual || visual.action === "keep") return;
        switch (visual.action) {
			
            case "show":
                this.showCharacter(visual.character, visual.expression || "normal");
                break;

            case "hide":
                this.hideCharacter();
                break;
				
            default:
                console.warn("알 수 없는 visual action:", visual.action);
        }
    }
}