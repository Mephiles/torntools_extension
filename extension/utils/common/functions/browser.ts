export function usingFirefox(): boolean {
	return navigator.userAgent.includes("Firefox");
}

export function hasSilentSupport(): boolean {
	// @ts-expect-error Not part of the standard.
	if (navigator.userAgentData) {
		// @ts-expect-error Not part of the standard.
		return navigator.userAgentData.brands.some(({ brand }) => brand === "Chromium");
	} else return !usingFirefox();
}

export function hasInteractionSupport(): boolean {
	// @ts-expect-error Not part of the standard.
	if (navigator.userAgentData) {
		// @ts-expect-error Not part of the standard.
		return navigator.userAgentData.brands.some(({ brand }) => brand === "Chromium");
	} else return !usingFirefox();
}
