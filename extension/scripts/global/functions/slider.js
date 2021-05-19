function newSlider(min = 0, max = 100) {
	const uuid = getUUID();

	const ttDualRange = document.newElement({
		type: "div",
		class: "tt-dual-range",
		html: `	
			<label for="handle-left_${uuid}" class="handle left"></label>
			<span class="highlight"></span>
			<label for="handle-right_${uuid}" class="handle right"></label>
			<div class="dump">
				<input id="handle-left_${uuid}"/>
				<input id="handle-right_${uuid}"/>
			</div>
		`,
		dataset: { max, min },
	});
	new DualRangeSlider(ttDualRange);
	return ttDualRange;
}

class DualRangeSlider {
	constructor(rangeElement) {
		this.range = rangeElement;
		this.min = Number(rangeElement.dataset.min);
		this.max = Number(rangeElement.dataset.max);
		this.handles = [...this.range.findAll(".handle")];
		this.startPos = 0;
		this.handles.forEach((handle) => {
			const input = rangeElement.find(`#${handle.getAttribute("for")}`);

			handle.addEventListener("mousedown", this.startMove.bind(this));
			handle.addEventListener("touchstart", this.startMoveTouch.bind(this));

			handle.addEventListener("click", () => input.focus());

			input.addEventListener("focus", () => handle.classList.add("focus"));
			input.addEventListener("blur", () => handle.classList.remove("focus"));
			input.addEventListener("keydown", this.moveKeyboard.bind(this));
		});
		window.addEventListener("mouseup", this.stopMove.bind(this));
		window.addEventListener("touchend", this.stopMove.bind(this));
		window.addEventListener("touchcancel", this.stopMove.bind(this));
		window.addEventListener("touchleave", this.stopMove.bind(this));
		const rangeRect = this.range.getBoundingClientRect();
		const handleRect = this.handles[0].getBoundingClientRect();
		this.range.style.setProperty("--x-1", "0px");
		this.range.style.setProperty("--x-2", rangeRect.width - handleRect.width / 2 + "px");
		this.handles[0].dataset.value = this.range.dataset.min;
		this.handles[1].dataset.value = this.range.dataset.max;
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

		const handle = this.range.find(`.handle[for="${event.target.id}"]`);
		if (!handle) return;

		let value = parseInt(handle.dataset.value);

		if (event.key === "ArrowLeft") value--;
		else if (event.key === "ArrowRight") value++;

		this.updateValue(handle, value);
	}

	moveTouch(event) {
		this.move({ clientX: event.touches[0].clientX });
	}

	move(event) {
		const isLeft = this.activeHandle.classList.contains("left");
		const property = isLeft ? "--x-1" : "--x-2";
		const parentRect = this.range.getBoundingClientRect();
		const handleRect = this.activeHandle.getBoundingClientRect();
		let newX = event.clientX - parentRect.x - this.startPos;
		if (isLeft) {
			const otherX = parseInt(this.range.style.getPropertyValue("--x-2"));
			newX = Math.min(newX, otherX);
			newX = Math.max(newX, 0 - handleRect.width / 2);
		} else {
			const otherX = parseInt(this.range.style.getPropertyValue("--x-1"));
			newX = Math.max(newX, otherX);
			newX = Math.min(newX, parentRect.width - handleRect.width / 2);
		}
		this.activeHandle.dataset.value = this.calculateHandleValue((newX + handleRect.width / 2) / parentRect.width);
		this.range.style.setProperty(property, newX + "px");
	}

	calculateHandleValue(percentage) {
		return Math.round(percentage * (this.max - this.min) + this.min);
	}

	updateValue(handle, value) {
		const isLeft = handle.classList.contains("left");
		const property = isLeft ? "--x-1" : "--x-2";

		value = Math.max(Math.min(value, this.max), this.min);

		if (isLeft) value = Math.min(value, parseInt(this.handles[1].dataset.value));
		else value = Math.max(value, parseInt(this.handles[0].dataset.value));

		handle.dataset.value = value;
		// TODO - Recognize minimum value.
		this.range.style.setProperty(property, (value * 150) / this.max - 13 + "px");
	}

	stopMove() {
		window.removeEventListener("mousemove", this.moveListener);
		window.removeEventListener("touchmove", this.moveTouchListener);
	}
}
