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
}