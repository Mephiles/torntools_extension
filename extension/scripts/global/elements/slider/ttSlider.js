function createSlider(min, max, step, formatFn) {
	formatFn = formatFn || ((value) => value);

	let sliderChangesObserver;
	const config = { attributes: true, attributeFilter: ["data-low", "data-high"] };

	const slider = new DualRangeSlider({ min, max, step, valueLow: min, valueHigh: max });
	const from = document.newElement({
		type: "span",
		text: formatFn(min),
	});
	const to = document.newElement({
		type: "span",
		text: formatFn(max),
	});
	const sliderWrapper = document.newElement({
		type: "div",
		class: "tt-slider-wrapper",
		children: [
			slider.slider,
			document.newElement({
				type: "span",
				class: "tt-slider-label",
				children: [
					from,
					document.newElement({
						type: "span",
						text: " - ",
					}),
					to,
				],
			}),
		],
	});

	function setRange(range) {
		if (sliderChangesObserver) {
			sliderChangesObserver.disconnect();
		}

		slider.updateValue(slider.handles[0], range.from);
		slider.updateValue(slider.handles[1], range.to);
		_updateLabels();

		if (sliderChangesObserver) {
			sliderChangesObserver.observe(slider.slider, config);
		}
	}

	function getRange() {
		return {
			from: parseInt(slider.slider.dataset.low),
			to: parseInt(slider.slider.dataset.high),
		};
	}

	function onRangeChanged(callback) {
		sliderChangesObserver = new MutationObserver(() => {
			_updateLabels();
			callback();
		});
		sliderChangesObserver.observe(slider.slider, config);
	}

	function dispose() {
		if (sliderChangesObserver) {
			sliderChangesObserver.disconnect();
			sliderChangesObserver = undefined;
		}
	}

	function _updateLabels() {
		from.innerText = formatFn(parseInt(slider.slider.dataset.low));
		to.innerText = formatFn(parseInt(slider.slider.dataset.high));
	}

	return {
		element: sliderWrapper,
		setRange,
		getRange,
		onRangeChanged,
		dispose,
	};
}
