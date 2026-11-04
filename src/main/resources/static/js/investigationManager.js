
export class InvestigationManager {

    constructor() {

        // 현재 조사 모드 실행 여부
        this.isActive = false;

        // 현재 조사 장소 ID
        this.currentInvestigationId = null;

        // Phase 1-10C-②: 현재 조사 장소의 JSON 데이터
        this.investigationData = null;

        // Phase 1-10B-③: 조사 화면 UI 요소
        this.investigationContainer =
            document.getElementById("investigation-container");

        // Phase 1-10B-④: 조사 대상 버튼 영역
        this.hotspotsContainer =
            document.getElementById("investigation-hotspots");

        this.characterElement =
            document.getElementById("character");

        this.dialogueBox =
            document.getElementById("dialogue-box");

        // Phase 1-10C-④-A: 조사 대사 표시용 요소
        this.speakerNameElement = document.getElementById("speaker-name");
        this.dialogueTextElement = document.getElementById("dialogue-text");
        this.isShowingInvestigationDialogue = false;

        // 일반 조사에서는 안내 문구를 표시하지 않음
        this.investigationHint =
            document.getElementById("investigation-hint");

        this.investigationHint.classList.add("hidden");
    }

    // 조사 모드 시작
    startInvestigation(investigationId) {

        // 이미 조사 중이라면 중복 실행 방지
        if (this.isActive) {
            console.warn("이미 조사 모드가 실행 중입니다.");
            return false;
        }

        // 조사 장소 ID 검증
        if (
            typeof investigationId !== "string" ||
            investigationId.trim() === ""
        ) {
            console.error("올바르지 않은 조사 장소 ID입니다.");
            return false;
        }

        this.currentInvestigationId = investigationId;
        this.isActive = true;

        // 현재 장소의 조사 대상 생성
        this.createHotspots();

        // Phase 1-10C-②: 조사 장소의 대사 데이터 불러오기
        this.investigationData = null;
        this.loadInvestigationData(investigationId);

        // 조사 모드 UI 활성화
        this.investigationContainer.classList.remove("hidden");

        // 캐릭터와 일반 대화창 숨김
        this.characterElement.classList.add("hidden");
        this.dialogueBox.classList.add("hidden");

        console.log(
            "조사 모드 시작:",
            this.currentInvestigationId
        );

        return true;
    }

    // 조사 모드 종료
    endInvestigation() {

        if (!this.isActive) {
            console.warn("현재 실행 중인 조사가 없습니다.");
            return false;
        }

        console.log(
            "조사 모드 종료:",
            this.currentInvestigationId
        );

        this.isActive = false;
        this.currentInvestigationId = null;

        // 조사 모드 UI 종료
        this.investigationContainer.classList.add("hidden");

        // 일반 대화 UI 복원
        this.characterElement.classList.remove("hidden");
        this.dialogueBox.classList.remove("hidden");

        return true;
    }

    // 현재 조사 상태 반환
    getState() {

        return {
            isActive: this.isActive,
            investigationId: this.currentInvestigationId
        };
    }

    // Phase 1-10B-④: 조사 대상 버튼 생성
    createHotspots() {

        // 이전 조사 대상 제거
        this.hotspotsContainer.replaceChildren();

        // 현재는 첫 번째 교실 조사만 지원
        if (this.currentInvestigationId !== "classroom_001") {
            return;
        }

        const targets = [
            { id: "desk", name: "책상" },
            { id: "blackboard", name: "칠판" },
            { id: "door", name: "교실 문" },
            { id: "window", name: "창문" }
        ];

        targets.forEach(target => {

            const button = document.createElement("button");

            button.type = "button";
            button.className = "investigation-hotspot";
            button.dataset.targetId = target.id;
            button.textContent = "🔍 " + target.name;

            // Phase 1-10B-⑥: 조사 대상 클릭 이벤트
            button.addEventListener("click", () => {
                this.handleHotspotClick(target.id);
            });
            this.hotspotsContainer.appendChild(button);
        });
        console.log("조사 대상 생성 완료:", targets.length);
    }

    // Phase 1-10C-②: 조사 JSON 데이터 불러오기
    async loadInvestigationData(investigationId) {

        try {
            const response = await fetch(
                `/data/investigations/${investigationId}.json`
            );

            if (!response.ok) {
                throw new Error(
                    `조사 데이터 요청 실패: HTTP ${response.status}`
                );
            }

            const data = await response.json();

            // 요청한 조사 장소와 JSON 내부 ID가 일치하는지 확인
            if (
                data.investigationId !== investigationId ||
                !data.targets ||
                typeof data.targets !== "object" ||
                Array.isArray(data.targets)
            ) {
                throw new Error("조사 JSON 데이터 구조가 올바르지 않습니다.");
            }

            this.investigationData = data;

            console.log(
                "조사 데이터 로딩 완료:",
                data.investigationId
            );

            console.log(
                "조사 대상 목록:",
                Object.keys(data.targets)
            );

            return true;

        } catch (error) {

            this.investigationData = null;

            console.error(
                "조사 데이터 로딩 실패:",
                error
            );

            return false;
        }
    }

    // Phase 1-10B-⑥: 조사 대상 클릭 처리
    handleHotspotClick(targetId) {

        if (this.isShowingInvestigationDialogue) {
            return;
        }

        // 조사 모드가 아니라면 클릭 무시
        if (!this.isActive) {
            console.warn("조사 모드가 활성화되지 않았습니다.");
            return;
        }

        // 현재 화면에 존재하는 조사 대상인지 확인
        const targetButton = [
            ...this.hotspotsContainer.querySelectorAll(
                ".investigation-hotspot"
            )
        ].find(button => button.dataset.targetId === targetId);

        if (!targetButton) {
            console.warn("존재하지 않는 조사 대상:", targetId);
            return;
        }

        console.log("조사 대상 선택:", targetId);

        // Phase 1-10C-③: 선택한 대상의 조사 대사 검색
        const dialogues = this.getTargetDialogues(targetId);

        if (!dialogues) {
            return;
        }

        console.log(
            "조사 대사 검색 성공:",
            targetId,
            "대사 개수:",
            dialogues.length
        );

        console.log(
            "조사 대사 내용:",
            dialogues.map(dialogue => dialogue.text)
        );

        // Phase 1-10C-④-A: 조사 대사 화면 표시
        this.showInvestigationDialogue(dialogues);
    }

    // Phase 1-10C-③: 조사 대상별 대사 검색
    getTargetDialogues(targetId) {

        // JSON 로딩이 완료되지 않았다면 검색 중단
        if (!this.investigationData) {
            console.warn("조사 데이터가 아직 준비되지 않았습니다.");
            return null;
        }

        // 해당 조사 대상의 데이터 검색
        const targetData =
            this.investigationData.targets[targetId];

        if (!targetData) {
            console.warn("조사 대상 데이터가 없습니다:", targetId);
            return null;
        }

        // 대사 배열 검증
        if (
            !Array.isArray(targetData.dialogues) ||
            targetData.dialogues.length === 0
        ) {
            console.warn("조사 대사가 없습니다:", targetId);
            return null;
        }

        return targetData.dialogues;
    }

    // Phase 1-10C-④-B: 기존 DialogueManager로 조사 대사 출력
    showInvestigationDialogue(dialogues) {

        if (
            !this.isActive ||
            this.isShowingInvestigationDialogue ||
            !this.dialogueManager ||
            !Array.isArray(dialogues) ||
            dialogues.length === 0
        ) {
            return false;
        }

        // 조사 대사 출력 상태 활성화
        this.isShowingInvestigationDialogue = true;

        // 조사 버튼 숨기기
        this.hotspotsContainer.classList.add("hidden");

        // 기존 대화창 표시
        this.dialogueBox.classList.remove("hidden");

        console.log("조사 대사 출력 시작:", dialogues.length);

        // 기존 타이핑 및 대사 진행 시스템 사용
        this.dialogueManager.loadDialogues(
            dialogues,
            () => {
                console.log("조사 대사 출력 완료");

                // Phase 1-10C-④-C: 조사 화면으로 복귀
                this.returnToInvestigation();
            }
        );
        return true;
    }

    // Phase 1-10C-④-C: 조사 대사 종료 후 조사 화면 복귀
    returnToInvestigation() {

        // 조사 모드가 종료된 상태라면 복귀하지 않음
        if (!this.isActive) {
            console.warn("조사 모드가 활성화되지 않았습니다.");
            return false;
        }

        // 조사 대화 상태 해제
        this.isShowingInvestigationDialogue = false;

        // 대화창 숨기기
        this.dialogueBox.classList.add("hidden");

        // 조사 버튼 다시 표시
        this.hotspotsContainer.classList.remove("hidden");

        console.log(
            "조사 화면 복귀 완료:",
            this.currentInvestigationId
        );

        return true;
    }
}
