export interface JQuery {
	attr(name: string): string | undefined;
	slider(method: "value"): number;
	slider(method: "value", value: number): this;
	slider(method: "option", optionName: string): (event: any, ui: { value: number }) => void;
	keyup(): this;
	focusout(): this;
}