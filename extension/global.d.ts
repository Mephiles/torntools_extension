declare global {
	interface Window {
		initializeTooltip: (selector: string, additionalClass: string) => void;
		chat?: {
			r(id: string): void;
		};
	}

	interface JQuery<T> {
		slider(field: string, value: any): JQuery<T>;
	}
}

export {};
