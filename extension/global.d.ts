declare global {
	interface Window {
		initializeTooltip: (selector: string, additionalClass: string) => void;
		chat?: {
			r(id: string): void;
		};
	}

	interface FindOptions {
		text: string;
	}

	interface Document {
		find<T extends Element = HTMLElement>(selector: string, options?: Partial<FindOptions>): T | null;
	}

	interface Element {
		find<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: Partial<FindOptions>): HTMLElementTagNameMap[K] | null;
		find<T extends Element = HTMLElement>(selector: string, options?: Partial<FindOptions>): T | null;
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
