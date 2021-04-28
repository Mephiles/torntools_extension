function newSlider(max = 100, min = 0) {
	const multiRangeContainer = document.newElement({type: "div", class: "multi-range-container"});
	const multiRange = document.newElement({type: "div", class: "multi-range"});
	const lowerSlider = document.newElement({
		type: "input",
		attributes: {
			type: "range",
			min: min,
			max: max,
			value: "0",
			step: "1",
			id: "lower",
		},
	});
	const rangeColor = document.newElement({type: "div", class: "range-color"});
	const upperSlider = document.newElement({
		type: "input",
		attributes: {
			type: "range",
			min: min,
			max: max,
			value: "100",
			step: "1",
			id: "upper",
		},
	});
	multiRange.appendChild(lowerSlider);
	multiRange.appendChild(rangeColor);
	multiRange.appendChild(upperSlider);
	multiRangeContainer.appendChild(multiRange);
	upperSlider.addEventListener("input", () => {
	lowerVal = parseInt(lowerSlider.value);
	upperVal = parseInt(upperSlider.value);
	if (upperVal < lowerVal + 1) {
		lowerSlider.value = upperVal - 1;
		if (lowerVal == lowerSlider.min) upperSlider.value = 1;
	}
	rangeColor.style.marginLeft = lowerSlider.value + '%';
	rangeColor.style.width = (upperSlider.value - lowerSlider.value) + '%';
	});
	lowerSlider.addEventListener("input", () => {
	lowerVal = parseInt(lowerSlider.value);
	upperVal = parseInt(upperSlider.value);
	if (lowerVal > upperVal - 1) {
		upperSlider.value = lowerVal + 1;
		if (upperVal == upperSlider.max) lowerSlider.value = parseInt(upperSlider.max) - 1;
	}
	rangeColor.style.marginLeft = lowerSlider.value + '%';
	rangeColor.style.width = (upperSlider.value - lowerSlider.value) + '%';
	});
	return multiRangeContainer;
}
