// Define the types here for now because they aren't picked up from the minified script we have here.
declare global {
	class Chart {
		constructor(item: any, userConfig: any);
		set options(arg: any);
		get options(): any;
		update(mode?: any): void;
		get data(): any;
	}
}

export {};