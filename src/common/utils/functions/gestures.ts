const TAP_MOVE_THRESHOLD_PX = 8;
const SYNTHETIC_CLICK_SUPPRESS_MS = 500;

type ClickHandler = (event: MouseEvent) => void | Promise<void>;

/**
 * Mobile browsers can emit a synthetic click after a touch sequence even when the
 * user was trying to swipe/scroll. Use this for destructive/one-tap actions so a
 * swipe that starts on the element is not treated as an activation.
 */
export function createSwipeSafeClickEvents(onClick: ClickHandler) {
	let touchStart: { x: number; y: number } | null = null;
	let touchMoved = false;
	let suppressNextClick = false;
	let suppressTimeout: ReturnType<typeof window.setTimeout> | undefined;

	function clearSuppressClick() {
		suppressNextClick = false;
		if (suppressTimeout !== undefined) {
			window.clearTimeout(suppressTimeout);
			suppressTimeout = undefined;
		}
	}

	function markSuppressNextClick() {
		suppressNextClick = true;
		if (suppressTimeout !== undefined) window.clearTimeout(suppressTimeout);
		suppressTimeout = window.setTimeout(clearSuppressClick, SYNTHETIC_CLICK_SUPPRESS_MS);
	}

	function clearTouch() {
		touchStart = null;
		touchMoved = false;
	}

	return {
		touchstart(event: TouchEvent) {
			if (event.touches.length !== 1) {
				clearTouch();
				return;
			}

			const touch = event.touches[0];
			touchStart = { x: touch.clientX, y: touch.clientY };
			touchMoved = false;
		},
		touchmove(event: TouchEvent) {
			if (!touchStart || event.touches.length !== 1) return;

			const touch = event.touches[0];
			const movedX = Math.abs(touch.clientX - touchStart.x);
			const movedY = Math.abs(touch.clientY - touchStart.y);

			if (Math.max(movedX, movedY) >= TAP_MOVE_THRESHOLD_PX) touchMoved = true;
		},
		touchend() {
			if (touchMoved) markSuppressNextClick();
			clearTouch();
		},
		touchcancel() {
			clearTouch();
		},
		click(event: MouseEvent) {
			if (suppressNextClick) {
				clearSuppressClick();
				event.preventDefault();
				event.stopPropagation();
				return;
			}

			return onClick(event);
		},
	};
}
