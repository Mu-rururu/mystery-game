export class DialogueLogManager {

    constructor() {
        this.reset();
    }

    // 대화 기록 초기화
    reset() {
        this.logs = [];
    }

    // 대화 기록 추가
    addLog(speaker, text) {

        if (typeof text !== "string" || text.trim() === "") {
            return;
        }

        this.logs.push({
            speaker: speaker ?? "",
            text: text
        });
    }

    // 전체 대화 기록 조회
    getLogs() {
        return structuredClone(this.logs);
    }

    // 기록 개수 조회
    getLogCount() {
        return this.logs.length;
    }

    // 저장된 대화 기록 복원
    restoreLogs(savedLogs) {

        if (!Array.isArray(savedLogs)) {
            console.error("올바르지 않은 대화 기록 데이터입니다.");
            return false;
        }

        // 각 대화 기록의 데이터 구조 확인
        const isValid = savedLogs.every(log => {

            return (
                log !== null &&
                typeof log === "object" &&
                typeof log.speaker === "string" &&
                typeof log.text === "string"
            );
        });

        if (!isValid) {
            console.error("대화 기록 데이터 구조가 올바르지 않습니다.");
            return false;
        }

        // 기존 기록을 저장 데이터로 교체
        this.logs = structuredClone(savedLogs);

        return true;
    }
}