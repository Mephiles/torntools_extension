declare global {
	interface Window {
		initializeTooltip: (selector: string, additionalClass: string) => void;
		chat?: {
			r(id: string): void;
		};
	}

	interface NewElementOptions {
		type: keyof HTMLElementTagNameMap;
		id?: string;
		class?: string | string[];
		text?: string | number;
		html?: string;
		value?: any | (() => any);
		href?: string;
		children?: (string | Node)[];
		attributes?: Record<string, string | number | boolean> | (() => Record<string, string | number | boolean>);
		events?: Partial<{ [E in keyof GlobalEventHandlersEventMap]: (e: GlobalEventHandlersEventMap[E]) => void }>;
		style?: { [P in keyof CSSStyleDeclaration as P extends string ? (CSSStyleDeclaration[P] extends string ? P : never) : never]?: CSSStyleDeclaration[P] };
		dataset?: {
			[name: string]: string | object | boolean | number;
		};
	}

	interface FindOptions {
		text: string;
	}

	interface Document {
		newElement<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K];
		newElement<K extends keyof HTMLElementTagNameMap>(options: Omit<NewElementOptions, "type"> & { type: K }): HTMLElementTagNameMap[K];
		find<T extends Element = HTMLElement>(selector: string, options?: Partial<FindOptions>): T | null;
		findAll<T extends Element = HTMLElement>(selector: string): NodeListOf<T>;
		setClass(...classNames: string[]): void;
	}

	interface Element {
		find<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: Partial<FindOptions>): HTMLElementTagNameMap[K] | null;
		find<T extends Element = HTMLElement>(selector: string, options?: Partial<FindOptions>): T | null;
		findAll<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: Partial<FindOptions>): NodeListOf<HTMLElementTagNameMap[K]>;
		findAll<T extends Element = HTMLElement>(selector: string): NodeListOf<T>;
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

	type RecursivePartial<T> = {
		[P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object | undefined ? RecursivePartial<T[P]> : T[P];
	};
	type Writable<T> = T extends object ? { -readonly [K in keyof T]: Writable<T[K]> } : T;

	interface JQuery<T> {
		slider(field: string, value: any): JQuery<T>;
	}
}

export {};
