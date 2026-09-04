export class ElementNotFoundError extends Error {
	constructor(selector: string) {
		super(`No element found for selector ${selector}`);
		this.name = "ElementNotFoundError";
	}
}

export function findAllElements<K extends keyof HTMLElementTagNameMap>(tagName: K, parent?: ParentNode): HTMLElementTagNameMap[K][];
export function findAllElements<T extends Element = HTMLElement>(selector: string, parent?: ParentNode): T[];
export function findAllElements(selector: string, parent: ParentNode = document): Element[] {
	return Array.from(parent.querySelectorAll(selector));
}

export function findElement<K extends keyof HTMLElementTagNameMap>(tagName: K, parent?: ParentNode): HTMLElementTagNameMap[K];
export function findElement<T extends Element = HTMLElement>(selector: string, parent?: ParentNode): T;
export function findElement<K extends keyof HTMLElementTagNameMap>(tagName: K, optional: true): HTMLElementTagNameMap[K] | null;
export function findElement<T extends Element = HTMLElement>(selector: string, optional: true): T | null;
export function findElement<K extends keyof HTMLElementTagNameMap>(tagName: K, parent: ParentNode, optional: true): HTMLElementTagNameMap[K] | null;
export function findElement<T extends Element = HTMLElement>(selector: string, parent: ParentNode, optional: true): T | null;
export function findElement<T extends Element = Element>(
	selector: string,
	parentOrOptional: ParentNode | boolean = document,
	optionalParameter = false,
): T | null {
	const parent = typeof parentOrOptional === "boolean" ? document : parentOrOptional;
	const optional = typeof parentOrOptional === "boolean" ? parentOrOptional : optionalParameter;

	const element = parent.querySelector<T>(selector);
	if (!element && !optional) throw new ElementNotFoundError(selector);

	return element;
}

export function findElementWithText<K extends keyof HTMLElementTagNameMap>(tag: K, text: string): HTMLElementTagNameMap[K];
export function findElementWithText<K extends keyof HTMLElementTagNameMap>(tag: K, text: string, optional: true): HTMLElementTagNameMap[K] | null;
export function findElementWithText(tag: string, text: string): HTMLElement;
export function findElementWithText(tag: string, text: string, optional: true): HTMLElement | null;
export function findElementWithText<T = Node>(tag: string, text: string, optional = false): T | null {
	const node = document.evaluate(`//${tag}[contains(text(), '${text}')]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	if (!node) {
		if (!optional) throw new ElementNotFoundError(`//${tag}[contains(text(), '${text}')]`);
		else return null;
	}

	return node as T;
}
