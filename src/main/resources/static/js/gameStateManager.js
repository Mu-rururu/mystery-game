export class GameStateManager {

    constructor() {
        this.reset();
    }

    // 게임 상태 초기화
    reset() {

        this.state = {
            chapter: 1,
            phase: "prologue",
            currentScene: null,
            flags: {},
            choices: {},
            evidence: [],
            completedEvents: []
        };
    }

    // 현재 챕터 설정
    setChapter(chapter) {
        this.state.chapter = chapter;
    }

    // 현재 진행 파트 설정
    setPhase(phase) {
        this.state.phase = phase;
    }

    // 현재 장면 설정
    setCurrentScene(sceneId) {
        this.state.currentScene = sceneId;
    }

    // 플래그 저장
    setFlag(flagId, value = true) {
        this.state.flags[flagId] = value;
    }

    // 플래그 확인
    getFlag(flagId) {
        return this.state.flags[flagId] ?? false;
    }

    // 선택 결과 저장
    recordChoice(choiceKey, choiceId) {
        this.state.choices[choiceKey] = choiceId;
    }

    // 선택 결과 확인
    getChoice(choiceKey) {
        return this.state.choices[choiceKey] ?? null;
    }

    // 증거 획득
    addEvidence(evidenceId) {

        if (!this.state.evidence.includes(evidenceId)) {
            this.state.evidence.push(evidenceId);
        }
    }

    // 증거 보유 여부 확인
    hasEvidence(evidenceId) {
        return this.state.evidence.includes(evidenceId);
    }

    // 이벤트 완료 기록
    completeEvent(eventId) {

        if (!this.state.completedEvents.includes(eventId)) {
            this.state.completedEvents.push(eventId);
        }
    }

    // 이벤트 완료 여부 확인
    isEventCompleted(eventId) {
        return this.state.completedEvents.includes(eventId);
    }

    // 전체 상태 확인
    getState() {
        return structuredClone(this.state);
    }

    // 저장된 게임 상태 복원
    restoreState(savedState) {

        if (
            !savedState ||
            typeof savedState !== "object" ||
            Array.isArray(savedState)
        ) {
            console.error("올바르지 않은 게임 상태 데이터입니다.");
            return false;
        }

        // 필요한 데이터 구조 확인
        if (
            !Number.isInteger(savedState.chapter) ||
            typeof savedState.phase !== "string" ||
            (savedState.currentScene !== null &&
                typeof savedState.currentScene !== "string") ||
            !savedState.flags ||
            typeof savedState.flags !== "object" ||
            Array.isArray(savedState.flags) ||
            !savedState.choices ||
            typeof savedState.choices !== "object" ||
            Array.isArray(savedState.choices) ||
            !Array.isArray(savedState.evidence) ||
            !Array.isArray(savedState.completedEvents)
        ) {
            console.error("게임 상태 데이터 구조가 올바르지 않습니다.");
            return false;
        }

        // 기존 상태를 저장 데이터로 교체
        this.state = structuredClone(savedState);

        return true;
    }
}