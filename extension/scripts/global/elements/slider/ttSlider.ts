interface DualRangeSliderOptions {
	min: number;
	max: number;
	step: number;
	valueLow: number;
	valueHigh: number;
}

class DualRangeSlider {
	private readonly options: DualRangeSliderOptions;
	private readonly uuid: string;
	private startPos: number;
	slider: HTMLElement | undefined;
	private activeHandle: HTMLElement | undefined;
	private handles: HTMLElement[];
	private readonly moveTouchListener = this.moveTouch.bind(this);
	private readonly moveListener = this.move.bind(this);

	constructor(options: Partial<DualRangeSliderOptions> = {}) {
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
		this.handles = [];

		this._createElement();
	}

	_createElement() {
		this.slider = elementBuilder({
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
		this.handles = findAllElements(".handle", this.slider);

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

	startMoveTouch(event: TouchEvent) {
		const handleRect = (event.target as HTMLElement).getBoundingClientRect();
		this.startPos = event.touches[0].clientX - handleRect.x;
		this.activeHandle = event.target as HTMLElement;
		window.addEventListener("touchmove", this.moveTouchListener);
	}

	startMove(event: MouseEvent) {
		this.startPos = event.offsetX;
		this.activeHandle = event.target as HTMLElement;
		window.addEventListener("mousemove", this.moveListener);
	}

	moveKeyboard(event: KeyboardEvent) {
		if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

		const handle = this.slider.find(`.handle[for="${(event.target as Element).id}"]`);
		if (!handle) return;

		let value = parseInt(handle.dataset.value);

		if (event.key === "ArrowLeft") value -= this.options.step;
		else if (event.key === "ArrowRight") value += this.options.step;

		this.updateValue(handle, value);
	}

	moveTouch(event: TouchEvent) {
		this.move({ clientX: event.touches[0].clientX });
	}

	move(event: { clientX: number }) {
		const parentRect = this.slider.getBoundingClientRect();
		const handleRect = this.activeHandle.getBoundingClientRect();

		const position = Math.max(Math.min(event.clientX - parentRect.x - this.startPos, parentRect.width - handleRect.width / 2), 0 - handleRect.width / 2);

		this.updateValue(this.activeHandle, this.calculateValue((position + handleRect.width / 2) / parentRect.width));
	}

	calculateValue(percentage: number) {
		return Math.round(percentage * (this.options.max - this.options.min) + this.options.min);
	}

	updateValue(handle: HTMLElement, value: number) {
		value = roundNearest(Math.max(Math.min(value, this.options.max), this.options.min), this.options.step);
		handle.dataset.value = value.toString();

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

		this.updateHighlight("left", low);
		this.updateHighlight("right", high);

		this.slider.dataset.low = low.toString();
		this.slider.dataset.high = high.toString();
	}

	updateHighlight(side: string, value: number) {
		const rangeWidth = this.slider.getBoundingClientRect().width || 150;
		const handleWidth = this.handles[0].getBoundingClientRect().width || 21;

		const percentage = (value - this.options.min) / (this.options.max - this.options.min);

		this.slider.style.setProperty(`--${side}`, percentage * rangeWidth - handleWidth / 2 + "px");
	}
}
