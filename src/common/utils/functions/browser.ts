export function usingFirefox(): boolean {
	return navigator.userAgent.includes("Firefox");
}

export function hasSilentSupport(): boolean {
	if (navigator.userAgentData) {
		return navigator.userAgentData.brands.some(({ brand }) => brand === "Chromium");
	} else return !usingFirefox();
}

export function hasInteractionSupport(): boolean {
	if (navigator.userAgentData) {
		return navigator.userAgentData.brands.some(({ brand }) => brand === "Chromium");
	} else return !usingFirefox();
}
