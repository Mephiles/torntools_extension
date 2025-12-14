window.addEventListener("tt-efficient-rehab", (event) => {
	const $slider = $("#rehub-progress .ui-slider");
	const rehabPercentages = JSON.parse($slider.attr("data-percentages")) || [];

	const { ticks } = event.detail;
	if (!(ticks in rehabPercentages)) {
		console.warn("TornTools - Failed to update the rehab amount due to it being an invalid amount of ticks");
		return;
	}

	const percentage = rehabPercentages[ticks];
	const sliderWidth = !rehabPercentages[2]
		? +$slider.get(0).clientWidth
		: (+$slider.get(0).clientWidth / (100 - rehabPercentages[1])) * (percentage - rehabPercentages[1]) || 0;

	$slider.slider("value", percentage).slider("option", "slide")({}, { value: $slider.slider("value") });
	$slider.find(".range-slider-track").css("left", sliderWidth);
});
window.dispatchEvent(new CustomEvent("tt-injected--efficient-rehab"));
