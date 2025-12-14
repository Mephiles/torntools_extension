function usingFirefox(): boolean {
	return navigator.userAgent.includes("Firefox");
}

function hasSilentSupport(): boolean {
	if (navigator.userAgentData) {
		return navigator.userAgentData.brands.some(({ brand }) => brand === "Chromium");
	} else return !usingFirefox();
}

function hasInteractionSupport(): boolean {
	if (navigator.userAgentData) {
		return navigator.userAgentData.brands.some(({ brand }) => brand === "Chromium");
	} else return !usingFirefox();
}
