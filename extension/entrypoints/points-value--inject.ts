export default defineUnlistedScript(() => {
	// @ts-expect-error Bundling Migration
	window.initializeTooltip(".tt-points-value", "white-tooltip");
});
