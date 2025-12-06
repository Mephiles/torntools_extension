declare global {
	interface NewElementOptions {
		type: keyof HTMLElementTagNameMap;
		id?: string;
		class?: string;
		text?: string;
		html?: string;
		value?: any | (() => any);
		href?: string;
		children?: HTMLElement[];
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
		newElement(options: NewElementOptions): HTMLElement;
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
}

export {};
