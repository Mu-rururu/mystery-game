export class TransitionManager {

    constructor(overlayElement) {

        this.overlay = overlayElement;

        this.isTransitioning = false;
    }

    // 지정한 시간 동안 투명도 변경
    async animateOpacity(opacity, duration) {

        const animation = this.overlay.animate(
            [
                { opacity: getComputedStyle(this.overlay).opacity },
                { opacity: opacity }
            ],
            {
                duration: duration,
                easing: "ease-in-out",
                fill: "forwards"
            }
        );

        await animation.finished;

        this.overlay.style.opacity = opacity;

        animation.cancel();
    }

    // 화면 어둡게
    async fadeOut(duration = 800) {

        await this.animateOpacity(1, duration);
    }

    // 화면 밝게
    async fadeIn(duration = 800) {

        await this.animateOpacity(0, duration);
    }

    // 화면 전환 실행
    async transition(callback, duration = 800) {

        if (this.isTransitioning) {
            return;
        }

        this.isTransitioning = true;

        try {

            // 화면 어둡게
            await this.fadeOut(duration);

            // 검은 화면에서 다음 장면 준비
            await callback();

            // 화면 밝게
            await this.fadeIn(duration);

        } finally {

            this.isTransitioning = false;
        }
    }
}