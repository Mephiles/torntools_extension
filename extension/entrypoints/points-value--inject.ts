declare global {
	interface Window {
		initializeTooltip(selector: string, tooltipClass: string): void;
	}
}

export default defineUnlistedScript(() => {
	window.initializeTooltip(".tt-points-value", "white-tooltip");
});
