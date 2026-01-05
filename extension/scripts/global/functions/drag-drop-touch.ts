"use strict";

/**
 * Based on https://github.com/drag-drop-touch-js/dragdroptouch/tree/07edc6d96c029dd83e98c09b8128816bf1438511
 * Licensed under the MIT license.
 */

interface DragDropTouchConfiguration {
	allowDragScroll: boolean;
	contextMenuDelayMS: number;
	dragImageOpacity: number;
	dragScrollPercentage: number;
	dragScrollSpeed: number;
	dragThresholdPixels: number;
	forceListen: boolean;
	isPressHoldMode: boolean;
	pressHoldDelayMS: number;
	pressHoldMargin: number;
	pressHoldThresholdPixels: number;
}

interface Point {
	x: number;
	y: number;
}

// Using the native TouchEvent interface instead of extending it
type TouchEventWithTouches = TouchEvent & {
	touches: TouchList;
};

type DropEffect = "none" | "copy" | "move" | "link" | "all";
type EffectAllowed = "none" | "copy" | "copyLink" | "copyMove" | "link" | "linkMove" | "move" | "all";

const DefaultConfiguration: DragDropTouchConfiguration = {
	allowDragScroll: true,
	contextMenuDelayMS: 900,
	dragImageOpacity: 0.5,
	dragScrollPercentage: 10,
	dragScrollSpeed: 10,
	dragThresholdPixels: 5,
	forceListen: false,
	isPressHoldMode: false,
	pressHoldDelayMS: 400,
	pressHoldMargin: 25,
	pressHoldThresholdPixels: 0,
};

/**
 * Object used to hold the data that is being dragged during drag and drop operations.
 *
 * It may hold one or more data items of different types. For more information about
 * drag and drop operations and data transfer objects, see
 * <a href="https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer">HTML Drag and Drop API</a>.
 *
 * This object is created automatically by the @see:DragDropTouch and is
 * accessible through the @see:dataTransfer property of all drag events.
 */
class DragDTO {
	private _dropEffect: DropEffect;
	private _effectAllowed: EffectAllowed;
	private _data: Record<string, any>;
	private _dragDropTouch: DragDropTouch;

	constructor(dragDropTouch: DragDropTouch) {
		this._dropEffect = "move";
		this._effectAllowed = "all";
		this._data = {};
		this._dragDropTouch = dragDropTouch;
	}

	get dropEffect(): DropEffect {
		return this._dropEffect;
	}

	set dropEffect(value: DropEffect) {
		this._dropEffect = value;
	}

	get effectAllowed(): EffectAllowed {
		return this._effectAllowed;
	}

	set effectAllowed(value: EffectAllowed) {
		this._effectAllowed = value;
	}

	get types(): string[] {
		return Object.keys(this._data);
	}

	clearData(type: string | null): void {
		if (type !== null) {
			delete this._data[type.toLowerCase()];
		} else {
			this._data = {};
		}
	}

	getData(type: string): any {
		const lcType = type.toLowerCase();
		let data = this._data[lcType];
		if (lcType === "text" && data == null) {
			data = this._data["text/plain"]; // getData("text") also gets ("text/plain")
		}
		return data; // @see https://github.com/Bernardo-Castilho/dragdroptouch/pull/61/files
	}

	setData(type: string, value: any): void {
		this._data[type.toLowerCase()] = value;
	}

	setDragImage(img: HTMLElement, offsetX: number, offsetY: number): void {
		this._dragDropTouch.setDragImage(img, offsetX, offsetY);
	}
}

function pointFrom(e: TouchEventWithTouches, page: boolean = false): Point {
	const touch = e.touches[0];
	return {
		x: page ? touch.pageX : touch.clientX,
		y: page ? touch.pageY : touch.clientY,
	};
}

function copyProps(dst: any, src: any, props: string[]): void {
	for (let i = 0; i < props.length; i++) {
		let p = props[i];
		dst[p] = src[p];
	}
}

function newForwardableEvent(
	type: string,
	srcEvent: TouchEventWithTouches,
	target: HTMLElement
): Event & { button: number; which: number; buttons: number; dataTransfer?: DragDTO } {
	const _kbdProps = ["altKey", "ctrlKey", "metaKey", "shiftKey"];
	const _ptProps = ["pageX", "pageY", "clientX", "clientY", "screenX", "screenY", "offsetX", "offsetY"];
	const evt = new Event(type, {
		bubbles: true,
		cancelable: true,
	}) as Event & { button: number; which: number; buttons: number; dataTransfer?: DragDTO };
	const touch = srcEvent.touches[0];
	evt.button = 0;
	evt.which = evt.buttons = 1;
	copyProps(evt, srcEvent, _kbdProps);
	copyProps(evt, touch, _ptProps);
	setOffsetAndLayerProps(evt, target);
	return evt;
}

function setOffsetAndLayerProps(e: any, target: HTMLElement): void {
	const rect = target.getBoundingClientRect();
	if (e.offsetX === undefined) {
		e.offsetX = e.clientX - rect.x;
		e.offsetY = e.clientY - rect.y;
	}
	if (e.layerX === undefined) {
		e.layerX = e.pageX - rect.left;
		e.layerY = e.pageY - rect.top;
	}
}

function copyStyle(src: HTMLElement, dst: HTMLElement): void {
	// remove potentially troublesome attributes
	removeTroublesomeAttributes(dst);

	// copy canvas content
	if (src instanceof HTMLCanvasElement) {
		const cDst = dst as HTMLCanvasElement;
		cDst.width = src.width;
		cDst.height = src.height;
		cDst.getContext("2d")!.drawImage(src, 0, 0);
	}

	// copy style (without transitions)
	copyComputedStyles(src, dst);
	dst.style.pointerEvents = "none";

	// and repeat for all children
	for (let i = 0; i < src.children.length; i++) {
		copyStyle(src.children[i] as HTMLElement, dst.children[i] as HTMLElement);
	}
}

function copyComputedStyles(src: HTMLElement, dst: HTMLElement): void {
	let cs = getComputedStyle(src);
	for (let i = 0; i < cs.length; i++) {
		const key = cs[i];
		if (key.includes("transition")) continue;
		dst.style[key] = cs[key];
	}
	Object.keys(dst.dataset).forEach((key) => delete dst.dataset[key]);
}

function removeTroublesomeAttributes(dst: HTMLElement): void {
	["id", "class", "style", "draggable"].forEach(function (att) {
		dst.removeAttribute(att);
	});
}

/**
 * Defines a class that adds support for touch-based HTML5 drag/drop operations.
 *
 * The @see:DragDropTouch class listens to touch events and raises the
 * appropriate HTML5 drag/drop events as if the events had been caused
 * by mouse actions.
 *
 * The purpose of this class is to enable using existing, standard HTML5
 * drag/drop code on mobile devices running IOS or Android.
 *
 * To use, include the DragDropTouch.js file on the page. The class will
 * automatically start monitoring touch events and will raise the HTML5
 * drag drop events (`dragstart`, `dragenter`, `dragleave`, `drop`, `dragend`) which
 * should be handled by the application.
 *
 * For details and examples on HTML drag and drop, see
 * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations.
 */
class DragDropTouch {
	private readonly configuration: DragDropTouchConfiguration;
	private _dragRoot: Document | HTMLElement;
	private readonly _dropRoot: Document | HTMLElement | ShadowRoot;
	private _dragSource: HTMLElement | null;
	private _lastTouch: TouchEventWithTouches | null;
	private _lastTarget: HTMLElement | null;
	private _ptDown: Point | null;
	private _isDragEnabled: boolean;
	private _isDropZone: boolean;
	private _dataTransfer: DragDTO;
	private _img: HTMLElement | null;
	private _imgCustom: HTMLElement | null;
	private _imgOffset: Point;
	private _pressHoldIntervalId: number | null;
	/**
	 * Deal with shadow DOM elements.
	 *
	 * Previous implementation used `document.elementFromPoint` to find the dropped upon
	 * element. This, however, doesn't "pierce" the shadow DOM. So instead, we can
	 * provide a drop tree element to search within. It would be nice if `elementFromPoint`
	 * were implemented on this node (arbitrarily), but it only appears on documents and
	 * shadow roots. So here we simply walk up the DOM tree until we find that method.
	 *
	 * In fact this does NOT restrict dropping to just the root provided-- but the whole
	 * tree. I'm not sure that this is a general solution, but works for my specific and
	 * the general one.
	 *
	 * @param dragRoot
	 * @param dropRoot
	 * @param options
	 */
	constructor(dragRoot: Document | HTMLElement = document, dropRoot: Document | HTMLElement = document, options?: Partial<DragDropTouchConfiguration>) {
		this.configuration = { ...DefaultConfiguration, ...(options || {}) };
		this._dragRoot = dragRoot;
		this._dropRoot = dropRoot;
		while (((this._dropRoot as any).elementFromPoint === undefined || !(this._dropRoot instanceof HTMLElement)) && this._dropRoot.parentNode) {
			this._dropRoot = this._dropRoot.parentNode as Document | HTMLElement | ShadowRoot;
		}
		this._dragSource = null;
		this._lastTouch = null;
		this._lastTarget = null;
		this._ptDown = null;
		this._isDragEnabled = false;
		this._isDropZone = false;
		this._dataTransfer = new DragDTO(this);
		this._img = null;
		this._imgCustom = null;
		this._imgOffset = { x: 0, y: 0 };
		this.listen();
	}

	listen(): void {
		if (navigator.maxTouchPoints === 0 && !this.configuration.forceListen) {
			return;
		}

		const opt = { passive: false, capture: false };

		this._dragRoot.addEventListener(`touchstart`, this._touchstart.bind(this) as EventListener, opt);
		this._dragRoot.addEventListener(`touchmove`, this._touchmove.bind(this) as EventListener, opt);
		this._dragRoot.addEventListener(`touchend`, this._touchend.bind(this) as EventListener);
		this._dragRoot.addEventListener(`touchcancel`, this._touchend.bind(this) as EventListener);
	}

	setDragImage(img: HTMLElement, offsetX: number, offsetY: number): void {
		this._imgCustom = img;
		this._imgOffset = { x: offsetX, y: offsetY };
	}

	private _touchstart(e: TouchEventWithTouches): void {
		if (this._shouldHandle(e)) {
			this._reset();
			let src = this._closestDraggable(e.target as HTMLElement);
			if (src) {
				// give caller a chance to handle the hover/move events
				if (
					e.target &&
					!this._dispatchEvent(e, `mousemove`, e.target as HTMLElement) &&
					!this._dispatchEvent(e, `mousedown`, e.target as HTMLElement)
				) {
					// get ready to start dragging
					this._dragSource = src;
					this._ptDown = pointFrom(e);
					this._lastTouch = e;

					// show context menu if the user hasn't started dragging after a while
					setTimeout(() => {
						if (this._dragSource === src && this._img === null) {
							if (this._dispatchEvent(e, `contextmenu`, src)) {
								this._reset();
							}
						}
					}, this.configuration.contextMenuDelayMS);

					if (this.configuration.isPressHoldMode) {
						this._pressHoldIntervalId = setTimeout(() => {
							this._isDragEnabled = true;
							this._touchmove(e);
						}, this.configuration.pressHoldDelayMS);
					}

					// We need this in case we're dealing with simulated touch events,
					// in which case the touch start and touch end won't have automagically
					// turned into click events by the browser.
					else if (!e.isTrusted) {
						if (e.target !== this._lastTarget) {
							this._lastTarget = e.target as HTMLElement;
						}
					}
				}
			}
		}
	}

	private _touchmove(e: TouchEventWithTouches): void {
		if (this._shouldCancelPressHoldMove(e)) {
			this._reset();
			return;
		}

		if (this._shouldHandleMove(e) || this._shouldHandlePressHoldMove(e)) {
			// see if target wants to handle move
			let target = this._getTarget(e);
			if (target && this._dispatchEvent(e, `mousemove`, target)) {
				this._lastTouch = e;
				e.preventDefault();
				return;
			}

			// start dragging
			if (this._dragSource && !this._img && this._shouldStartDragging(e)) {
				if (this._dispatchEvent(this._lastTouch, `dragstart`, this._dragSource)) {
					this._dragSource = null;
					return;
				}
				this._createImage(e);
				this._dispatchEvent(e, `dragenter`, target);
			}

			// continue dragging
			if (this._img && this._dragSource) {
				this._lastTouch = e;
				e.preventDefault();

				this._dispatchEvent(e, `drag`, this._dragSource);
				if (target !== this._lastTarget) {
					if (this._lastTarget) this._dispatchEvent(this._lastTouch, `dragleave`, this._lastTarget);
					this._dispatchEvent(e, `dragenter`, target);
					this._lastTarget = target;
				}
				this._moveImage(e);
				this._isDropZone = this._dispatchEvent(e, `dragover`, target);

				// Allow scrolling if the screen edges were marked as "hot regions".
				if (this.configuration.allowDragScroll) {
					const delta = this._getHotRegionDelta(e);
					globalThis.scrollBy(delta.x, delta.y);
				}
			}
		}
	}

	private _touchend(e: TouchEventWithTouches): void {
		if (!(this._lastTouch && e.target && this._lastTarget)) {
			this._reset();
			return;
		}

		if (this._shouldHandle(e)) {
			if (this._dispatchEvent(this._lastTouch!, `mouseup`, e.target as HTMLElement)) {
				e.preventDefault();
				return;
			}

			// user clicked the element but didn't drag, so clear the source and simulate a click
			if (!this._img) {
				this._dragSource = null;
				this._dispatchEvent(this._lastTouch!, `click`, e.target as HTMLElement);
			}

			// finish dragging
			this._destroyImage();
			if (this._dragSource) {
				if (e.type.indexOf(`cancel`) < 0 && this._isDropZone) {
					this._dispatchEvent(this._lastTouch, `drop`, this._lastTarget);
				}
				this._dispatchEvent(this._lastTouch, `dragend`, this._dragSource);
				this._reset();
			}
		}
	}

	private _shouldHandle(e: TouchEventWithTouches): boolean {
		// Force disable when touching the sidebar.
		if (findParent(e.target as Node, { id: "sidebar", maxAttempts: 6 })) {
			return false;
		}

		return e && !e.defaultPrevented && e.touches && e.touches.length < 2;
	}

	private _shouldHandleMove(e: TouchEventWithTouches): boolean {
		return !this.configuration.isPressHoldMode && this._shouldHandle(e);
	}

	private _shouldHandlePressHoldMove(e: TouchEventWithTouches): boolean {
		return this.configuration.isPressHoldMode && this._isDragEnabled && e && e.touches && e.touches.length > 0;
	}

	private _shouldCancelPressHoldMove(e: TouchEventWithTouches): boolean {
		return this.configuration.isPressHoldMode && !this._isDragEnabled && this._getDelta(e) > this.configuration.pressHoldMargin;
	}

	private _shouldStartDragging(e: TouchEventWithTouches): boolean {
		let delta = this._getDelta(e);
		if (this.configuration.isPressHoldMode) {
			return delta >= this.configuration.pressHoldThresholdPixels;
		}
		return delta > this.configuration.dragThresholdPixels;
	}

	private _reset(): void {
		this._destroyImage();
		this._dragSource = null;
		this._lastTouch = null;
		this._lastTarget = null;
		this._ptDown = null;
		this._isDragEnabled = false;
		this._isDropZone = false;
		this._dataTransfer = new DragDTO(this);
		clearTimeout(this._pressHoldIntervalId);
	}

	private _getDelta(e: TouchEventWithTouches): number {
		// if there is no active touch we don't need to calculate anything.
		if (!this._ptDown) return 0;

		// Determine how `far` from the event coordinate our
		// original touch coordinate was.
		const { x, y } = this._ptDown;
		const p = pointFrom(e);
		return ((p.x - x) ** 2 + (p.y - y) ** 2) ** 0.5;
	}

	private _getHotRegionDelta(e: TouchEventWithTouches): Point {
		const { clientX: x, clientY: y } = e.touches[0];
		const { innerWidth: w, innerHeight: h } = globalThis;
		const { dragScrollPercentage, dragScrollSpeed } = this.configuration;
		const v1 = dragScrollPercentage / 100;
		const v2 = 1 - v1;
		const dx = x < w * v1 ? -dragScrollSpeed : x > w * v2 ? +dragScrollSpeed : 0;
		const dy = y < h * v1 ? -dragScrollSpeed : y > h * v2 ? +dragScrollSpeed : 0;
		return { x: dx, y: dy };
	}

	private _getTarget(e: TouchEventWithTouches): HTMLElement | null {
		let pt = pointFrom(e),
			el = (this._dropRoot as any).elementFromPoint(pt.x, pt.y);
		while (el && getComputedStyle(el).pointerEvents === "none") {
			el = el.parentElement;
		}
		return el;
	}

	private _createImage(e: TouchEventWithTouches): void {
		// just in case...
		if (this._img) {
			this._destroyImage();
		}
		// create drag image from custom element or drag source
		let src = this._imgCustom || this._dragSource;
		this._img = src.cloneNode(true) as HTMLElement;
		copyStyle(src, this._img);
		this._img.style.top = this._img.style.left = `-9999px`;
		// if creating from drag source, apply offset and opacity
		if (!this._imgCustom) {
			let rc = src.getBoundingClientRect(),
				pt = pointFrom(e);
			this._imgOffset = { x: pt.x - rc.left, y: pt.y - rc.top };
			this._img.style.opacity = `${this.configuration.dragImageOpacity}`;
		}
		// add image to document
		this._moveImage(e);
		document.body.appendChild(this._img);
	}

	private _destroyImage(): void {
		if (this._img && this._img.parentElement) {
			this._img.parentElement.removeChild(this._img);
		}
		this._img = null;
		this._imgCustom = null;
	}

	private _moveImage(e: TouchEventWithTouches): void {
		requestAnimationFrame(() => {
			if (this._img) {
				let pt = pointFrom(e, true),
					s = this._img.style;
				s.position = `absolute`;
				s.pointerEvents = `none`;
				s.zIndex = `999999`;
				s.left = `${Math.round(pt.x - this._imgOffset.x)}px`;
				s.top = `${Math.round(pt.y - this._imgOffset.y)}px`;
			}
		});
	}

	private _dispatchEvent(srcEvent: TouchEventWithTouches, type: string, target: HTMLElement): boolean {
		if (!(srcEvent && target)) return false;
		const evt = newForwardableEvent(type, srcEvent, target);

		// DragEvents need a data transfer object
		evt.dataTransfer = this._dataTransfer;
		target.dispatchEvent(evt);
		return evt.defaultPrevented;
	}

	private _closestDraggable(element: HTMLElement): HTMLElement | null {
		for (let e = element; e !== null; e = e.parentElement) {
			if (e.draggable) {
				return e;
			}
		}
		return null;
	}
}

/**
 * Offer users a setup function rather than the class itself
 *
 * @param dragRoot
 * @param dropRoot
 * @param options
 */
function enableDragDropTouch(dragRoot: Document | HTMLElement, dropRoot: Document | HTMLElement, options?: Partial<DragDropTouchConfiguration>): DragDropTouch {
	return new DragDropTouch(dragRoot, dropRoot, options);
}

enableDragDropTouch(document, document, {
	forceListen: true,
});
