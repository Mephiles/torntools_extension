import styles from "./alerts.module.css";
import { elementBuilder } from "./dom";
import { PHBoldCheckCircle, PHBoldInfo, PHBoldWarningCircle, PHX, PHBoldXCircle } from "@/utils/common/icons/phosphor-icons";

interface AlertOptions {
	title: string;
	text?: string;
	type: "success" | "error" | "info" | "warning";
	duration?: number;
}

export function displayAlert(options: AlertOptions): void {
	const container = createToastContainer();
	const duration = options.duration ?? 5000;

	const toast = elementBuilder({
		type: "div",
		class: [styles.toast, styles.show],
		children: [
			elementBuilder({
				type: "div",
				class: styles.toastContent,
				children: [
					elementBuilder({
						type: "div",
						class: styles.toastIcon,
						children: [getIconForType(options.type)],
					}),
					elementBuilder({
						type: "div",
						class: styles.toastMessage,
						children: [
							elementBuilder({
								type: "div",
								class: styles.toastTitle,
								text: options.title,
							}),
							...(options.text
								? [
										elementBuilder({
											type: "div",
											class: styles.toastText,
											text: options.text,
										}),
									]
								: []),
						],
					}),
				],
			}),
			elementBuilder({
				type: "button",
				class: styles.toastClose,
				attributes: { "aria-label": "Close toast" },
				children: [PHX()],
				events: {
					click: () => removeToast(toast),
				},
			}),
			elementBuilder({
				type: "div",
				class: styles.toastProgress,
			}),
		],
		dataset: {
			toastType: options.type,
		},
	});

	container.appendChild(toast);

	setupProgressBar(toast, duration);
}

function setupProgressBar(toast: HTMLElement, duration: number): void {
	const progressElement = toast.querySelector<HTMLElement>(`.${styles.toastProgress}`);
	if (!progressElement || duration <= 0) return;

	const iconElement = toast.querySelector(`.${styles.toastIcon} i`);
	if (iconElement) {
		const computedColor = getComputedStyle(iconElement).color;
		progressElement.style.setProperty("--progress-color", computedColor);
	}

	let startTime = Date.now();
	let isPaused = false;
	let animationId: number;
	let timeoutId: number;
	let totalPausedDuration = 0;
	let pausedTime = 0;

	const animateProgress = () => {
		if (isPaused) return;

		const currentTime = Date.now();
		const elapsed = currentTime - startTime - totalPausedDuration;
		const progress = Math.max(0, 1 - elapsed / duration);
		progressElement.style.setProperty("--progress-scale", progress.toString());

		if (progress > 0) {
			animationId = requestAnimationFrame(animateProgress);
		}
	};

	toast.addEventListener("mouseenter", () => {
		if (isPaused) return;

		isPaused = true;
		pausedTime = Date.now();
		cancelAnimationFrame(animationId);
		if (timeoutId) clearTimeout(timeoutId);
	});

	toast.addEventListener("mouseleave", () => {
		if (!isPaused) return;

		isPaused = false;
		const pauseDuration = Date.now() - pausedTime;
		totalPausedDuration += pauseDuration;
		const remainingTime = Math.max(0, duration - (Date.now() - startTime - totalPausedDuration));
		animateProgress();
		timeoutId = setTimeout(() => removeToast(toast), remainingTime);
	});

	animateProgress();
	timeoutId = setTimeout(() => removeToast(toast), duration);
}

function getIconForType(type: AlertOptions["type"]): Element {
	switch (type) {
		case "success":
			return PHBoldCheckCircle();
		case "error":
			return PHBoldXCircle();
		case "warning":
			return PHBoldWarningCircle();
		case "info":
		default:
			return PHBoldInfo();
	}
}

function createToastContainer(): HTMLElement {
	let container = document.querySelector(`.${styles.toastContainer}`) as HTMLElement;
	if (!container) {
		container = elementBuilder({ type: "div", class: styles.toastContainer });
		document.body.appendChild(container);
	}
	return container;
}

function removeToast(toast: HTMLElement): void {
	toast.classList.add(styles.removing);
	setTimeout(() => toast.remove(), 300);
}
