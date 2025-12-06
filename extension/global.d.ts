declare global {
	interface NewElementOptions {
		type: keyof HTMLElementTagNameMap;
		id?: string;
		class?: string;
		text?: string;
		html?: string;
		value?: any | (() => any);
		href?: string;
		children?: Node[];
		attributes?: Record<string, string> | (() => Record<string, string>);
		events?: Partial<{ [E in keyof GlobalEventHandlersEventMap]: (e: GlobalEventHandlersEventMap[E]) => void }>;
		style?: { [P in keyof CSSStyleDeclaration as P extends string ? (CSSStyleDeclaration[P] extends string ? P : never) : never]?: CSSStyleDeclaration[P] };
		dataset?: {
			[name: string]: string;
		};
	}

	interface FindOptions {
		text: string;
	}

	interface Document {
		newElement<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K];
		newElement<K extends keyof HTMLElementTagNameMap>(options: Omit<NewElementOptions, "type"> & { type: K }): HTMLElementTagNameMap[K];
		find(selector: string, options?: Partial<FindOptions>): HTMLElement;
		findAll(selector: string): NodeListOf<HTMLElement>;
		setClass(...classNames: string[]): void;
	}

	interface Element {
		find(selector: string, options?: Partial<FindOptions>): HTMLElement;
		findAll(selector: string): NodeListOf<HTMLElement>;
		setClass(...classNames: string[]): void;
	}

	interface DOMTokenList {
		contains(className: string): boolean;
		removeSpecial(className: string): void;
	}

	interface Number {
		roundNearest(multiple: number): number;
	}

	interface Array<T> {
		last(): T;
		insertAt(index: number, ...values: T[]): void;
		totalSum(): number;
		findHighest(): number;
		findLowest(): number;
		equals(other: T[]): boolean;
	}

	interface Object {
		equals(other: object): boolean;
	}

	interface JSON {
		isValid(str: string): boolean;
	}
}

export {};
