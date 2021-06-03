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

class DualRangeSlider {
	constructor(options = {}) {
		this.options = {
			min: 0,
			max: 100,
			step: 1,
			valueLow: options.min || 0,
			valueHigh: options.max || 100,
			...options,
		};

		this.uuid = getUUID();
		this.startPos = 0;

		this._createElement();
	}

	_createElement() {
		this.slider = document.newElement({
			type: "div",
			class: "tt-dual-range",
			html: `	
				<label for="handle-left_${this.uuid}" class="handle left"></label>
				<span class="highlight"></span>
				<label for="handle-right_${this.uuid}" class="handle right"></label>
				<div class="dump">
					<input id="handle-left_${this.uuid}"/>
					<input id="handle-right_${this.uuid}"/>
				</div>
			`,
		});
		this.handles = [...this.slider.findAll(".handle")];

		this.handles.forEach((handle) => {
			const input = this.slider.find(`#${handle.getAttribute("for")}`);

			handle.addEventListener("mousedown", this.startMove.bind(this));
			handle.addEventListener("touchstart", this.startMoveTouch.bind(this));

			handle.addEventListener("click", () => input.focus());

			input.addEventListener("focus", () => handle.classList.add("focus"));
			input.addEventListener("blur", () => handle.classList.remove("focus"));
			input.addEventListener("keydown", this.moveKeyboard.bind(this));
		});

		this.updateValue(this.handles[0], this.options.valueLow);
		this.updateValue(this.handles[1], this.options.valueHigh);

		window.addEventListener("mouseup", this.stopMove.bind(this));
		window.addEventListener("touchend", this.stopMove.bind(this));
		window.addEventListener("touchcancel", this.stopMove.bind(this));
		window.addEventListener("touchleave", this.stopMove.bind(this));
	}

	startMoveTouch(event) {
		const handleRect = event.target.getBoundingClientRect();
		this.startPos = event.touches[0].clientX - handleRect.x;
		this.activeHandle = event.target;
		this.moveTouchListener = this.moveTouch.bind(this);
		window.addEventListener("touchmove", this.moveTouchListener);
	}

	startMove(event) {
		this.startPos = event.offsetX;
		this.activeHandle = event.target;
		this.moveListener = this.move.bind(this);
		window.addEventListener("mousemove", this.moveListener);
	}

	moveKeyboard(event) {
		if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

		const handle = this.slider.find(`.handle[for="${event.target.id}"]`);
		if (!handle) return;

		let value = parseInt(handle.dataset.value);

		if (event.key === "ArrowLeft") value -= this.options.step;
		else if (event.key === "ArrowRight") value += this.options.step;

		this.updateValue(handle, value);
	}

	moveTouch(event) {
		this.move({ clientX: event.touches[0].clientX });
	}

	move(event) {
		const parentRect = this.slider.getBoundingClientRect();
		const handleRect = this.activeHandle.getBoundingClientRect();

		const position = Math.max(Math.min(event.clientX - parentRect.x - this.startPos, parentRect.width - handleRect.width / 2), 0 - handleRect.width / 2);

		this.updateValue(this.activeHandle, calculateValue.bind(this)((position + handleRect.width / 2) / parentRect.width));

		function calculateValue(percentage) {
			return Math.round(percentage * (this.options.max - this.options.min) + this.options.min);
		}
	}

	updateValue(handle, value) {
		value = Math.max(Math.min(value, this.options.max), this.options.min).roundNearest(this.options.step);
		handle.dataset.value = value;

		this.updateValues();
	}

	stopMove() {
		window.removeEventListener("mousemove", this.moveListener);
		window.removeEventListener("touchmove", this.moveTouchListener);
	}

	updateValues() {
		const valueLeft = parseInt(this.handles[0].dataset.value);
		const valueRight = parseInt(this.handles[1].dataset.value);

		const low = Math.min(valueLeft, valueRight);
		const high = Math.max(valueLeft, valueRight);

		updateHighlight.bind(this)("left", low);
		updateHighlight.bind(this)("right", high);

		this.slider.dataset.low = low;
		this.slider.dataset.high = high;

		function updateHighlight(side, value) {
			const rangeWidth = this.slider.getBoundingClientRect().width || 150;
			const handleWidth = this.handles[0].getBoundingClientRect().width || 21;

			const percentage = (value - this.options.min) / (this.options.max - this.options.min);

			this.slider.style.setProperty(`--${side}`, percentage * rangeWidth - handleWidth / 2 + "px");
		}
	}
}
