declare global {
	interface Window {
		initializeTooltip: (selector: string, additionalClass: string) => void;
		chat?: {
			r(id: string): void;
		};
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
