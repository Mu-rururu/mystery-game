export class SceneManager {

    constructor(dialogueManager, transitionManager) {

        this.dialogueManager = dialogueManager;

        this.transitionManager = transitionManager;

        this.currentScene = null;

        this.isLoading = false;
        this.isActive = false;
    }

    // 장면 데이터 불러오기
    async fetchScene(fileName) {

        const response = await fetch("/data/" + fileName);

        if (!response.ok) {

            throw new Error(
                "장면 데이터를 불러오지 못했습니다: " + fileName
            );
        }

        return await response.json();
    }

    // 장면 실행
    async loadScene(fileName, useTransition = false, duration = 800) {

        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.isActive = false;

        try {

            const sceneData = await this.fetchScene(fileName);

            const applyScene = async () => {

                this.currentScene = sceneData;

                this.dialogueManager.loadDialogues(
                    sceneData.dialogues,
                    () => this.onSceneComplete()
                );
            };

            if (useTransition) {

                await this.transitionManager.transition(
                    applyScene,
                    duration
                );

            } else {

                await applyScene();
            }

            this.isActive = true;

        } catch (error) {

            console.error("장면 로딩 오류:", error);

            alert("장면을 불러오는 중 오류가 발생했습니다.");

        } finally {

            this.isLoading = false;
        }
    }

    // 현재 장면 종료
    async onSceneComplete() {

        if (!this.isActive || this.isLoading) {
            return;
        }

        this.isActive = false;

        const nextEvent = this.currentScene?.nextEvent;

        if (!nextEvent) {

            console.log("모든 장면 종료");

            return;
        }

        const useTransition =
            nextEvent.transition === "fade";

        await this.loadScene(
            nextEvent.scene,
            useTransition,
            nextEvent.duration ?? 800
        );
    }
}