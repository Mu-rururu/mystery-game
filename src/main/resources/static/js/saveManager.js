export class SaveManager {

    constructor() {
        this.storageKey = "mystery_game_save";
        this.saveVersion = 1;
    }

    // 게임 데이터 저장
    save(data) {

        try {

            const saveData = {
                version: this.saveVersion,
                savedAt: new Date().toISOString(),
                data: structuredClone(data)
            };

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(saveData)
            );

            return true;

        } catch (error) {

            console.error("게임 저장 실패:", error);
            return false;
        }
    }

    // 저장된 게임 데이터 불러오기
    load() {

        try {

            const savedString = localStorage.getItem(
                this.storageKey
            );

            if (savedString === null) {
                return null;
            }

            const saveData = JSON.parse(savedString);

            // 저장 파일 버전 확인
            if (saveData.version !== this.saveVersion) {
                console.warn("지원하지 않는 저장 데이터 버전입니다.");
                return null;
            }

            return structuredClone(saveData);

        } catch (error) {

            console.error("게임 불러오기 실패:", error);
            return null;
        }
    }

    // 저장 데이터 존재 여부
    hasSave() {

        return localStorage.getItem(this.storageKey) !== null;
    }

    // 저장 데이터 삭제
    deleteSave() {

        try {

            localStorage.removeItem(this.storageKey);
            return true;

        } catch (error) {

            console.error("저장 데이터 삭제 실패:", error);
            return false;
        }
    }
}