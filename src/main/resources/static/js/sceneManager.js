export class SceneManager {

	constructor(
	    dialogueManager,
	    transitionManager,
	    visualManager,
	    gameStateManager
	) {

        this.dialogueManager = dialogueManager;
        this.transitionManager = transitionManager;
		this.visualManager = visualManager;
		this.gameStateManager = gameStateManager;
		
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
				
				// 현재 장면 기록
				this.gameStateManager.setCurrentScene(fileName);

			    this.visualManager.hideCharacter();

			    this.visualManager.setBackground(
			        sceneData.background
			    );

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

// 저장된 장면 및 대화 위치 복원
	async restoreScene(fileName, savedProgress) {

		if (
			this.isLoading ||
			this.transitionManager.isTransitioning
		) {
			console.warn("장면 전환 중에는 복원할 수 없습니다.");
			return false;
		}

		if (
			typeof fileName !== "string" ||
			fileName.trim() === ""
		) {
			console.error("복원할 장면 파일명이 올바르지 않습니다.");
			return false;
		}

		if (
			!savedProgress ||
			typeof savedProgress !== "object" ||
			Array.isArray(savedProgress)
		) {
			console.error("복원할 대화 진행 정보가 올바르지 않습니다.");
			return false;
		}

		const choiceManager = this.dialogueManager.choiceManager;

		// 선택지 애니메이션 중에는 복원하지 않음
		if (
			choiceManager.isAnimating ||
			choiceManager.isSelecting
		) {
			console.warn("선택지 애니메이션 중에는 복원할 수 없습니다.");
			return false;
		}

		// 복원 전 장면 활성화 상태 보관
		const previousIsActive = this.isActive;

		this.isLoading = true;

		try {

			// 1. 저장된 장면 JSON 불러오기
			const sceneData = await this.fetchScene(fileName);

			if (
				!Array.isArray(sceneData.dialogues) ||
				sceneData.dialogues.length === 0
			) {
				throw new Error("장면의 대화 데이터가 올바르지 않습니다.");
			}

			// 2. 저장된 대화 위치 사전 검증
			const {
				currentIndex,
				isInBranch,
				branchIndex,
				branchChoiceId,
				isTyping,
				isChoicePending
			} = savedProgress;

			if (
				!Number.isInteger(currentIndex) ||
				currentIndex < 0 ||
				currentIndex >= sceneData.dialogues.length ||
				typeof isInBranch !== "boolean" ||
				!Number.isInteger(branchIndex) ||
				branchIndex < 0 ||
				typeof isTyping !== "boolean" ||
				typeof isChoicePending !== "boolean"
			) {
				throw new Error("저장된 대화 진행 위치가 올바르지 않습니다.");
			}

			if (isInBranch) {

				if (typeof branchChoiceId !== "string") {
					throw new Error("분기 선택지 ID가 올바르지 않습니다.");
				}

				const parentDialogue = sceneData.dialogues[currentIndex];

				const branch =
					parentDialogue?.branches?.[branchChoiceId];

				if (
					!Array.isArray(branch) ||
					branchIndex >= branch.length
				) {
					throw new Error("저장된 분기 대화를 찾을 수 없습니다.");
				}
			}

			// 3. 검증에 성공한 경우에만 기존 장면 교체
			this.isActive = false;

			this.currentScene = sceneData;

			this.gameStateManager.setCurrentScene(fileName);

			this.visualManager.hideCharacter();
			this.visualManager.setBackground(sceneData.background);

			// 4. 대화 데이터 준비
			this.dialogueManager.stopTyping();

			this.dialogueManager.dialogues = sceneData.dialogues;

			this.dialogueManager.onComplete =
				() => this.onSceneComplete();

			// 5. 저장된 대화 위치 복원
			const restored =
				this.dialogueManager.restoreProgress(savedProgress);

			if (!restored) {
				throw new Error("대화 진행 위치 복원 실패");
			}

			// 6. 장면 활성화
			this.isActive = true;

			console.log("장면 복원 성공:", fileName);

			return true;

		} catch (error) {

			console.error("장면 복원 오류:", error);

			// 장면이 비활성화된 채로 남는 문제 방지
			this.isActive = previousIsActive;

			return false;

		} finally {
			this.isLoading = false;
		}
	}

    // 현재 장면 종료
	async onSceneComplete() {

	    if (!this.isActive || this.isLoading) return;

	    this.isActive = false;

	    // 현재 장면 완료 기록
	    const completedScene = this.gameStateManager.getState().currentScene;

	    if (completedScene) {
	        this.gameStateManager.completeEvent(completedScene);
	    }

	    const nextEvent = this.currentScene?.nextEvent;

	    if (!nextEvent) {
	        console.log("모든 장면 종료");
	        return;
	    }

	    const useTransition = nextEvent.transition === "fade";

	    await this.loadScene(
	        nextEvent.scene,
	        useTransition,
	        nextEvent.duration ?? 800
	    );
	}
}