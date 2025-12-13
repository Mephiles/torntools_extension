interface BaseElement<T extends Node = HTMLElement> {
	element: T;
	dispose: () => void;
}
