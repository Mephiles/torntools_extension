import { formatTime } from "@/utils/common/functions/formatting";

export let countdownTimers: HTMLElement[] = [];
export const countTimers: HTMLElement[] = [];

export function updateTimers() {
	const now = Date.now();

	countdownTimers.forEach((countdown, index) => {
		// Rewritten so the timers don't desync when the tab is inactive
		// old method left in as a fallback for timers that haven't yet been updated
		let seconds: number;

		if (countdown.dataset.end) {
			seconds = parseInt(((parseInt(countdown.dataset.end) - now) / 1000).toString());
		} else {
			seconds = parseInt(countdown.dataset.seconds ?? "0") - 1;
		}

		if (seconds <= 0) {
			countdown.textContent = countdown.dataset.doneText || "Ready";
			delete countdown.dataset.seconds;
			countdownTimers.splice(index, 1);
		} else {
			countdown.textContent = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
			countdown.dataset.seconds = seconds.toString();
		}
	});
	countTimers.forEach((countdown) => {
		const seconds = parseInt(countdown.dataset.seconds);

		countdown.textContent = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
	});
}

export function removeCountdownTimer(predicate: (timer: HTMLElement) => boolean) {
	countdownTimers = countdownTimers.filter((timer) => predicate(timer));
}
