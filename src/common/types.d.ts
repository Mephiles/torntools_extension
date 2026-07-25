/** biome-ignore-all lint/complexity/noBannedTypes: Defining global existing types. */
export declare global {
	function setTimeout(handler: Function, timeout?: number): number;
	function setInterval(handler: Function, timeout?: number): number;

	interface Window {
		// Firefox-only object to expose changes to the window done by page scripts.
		wrappedJSObject?: Window;
	}

	interface Location {
		// Firefox-only parameter to bust the reload cache.
		// Also seems to do something in Torn PDA.
		reload(forceGet?: boolean): void;
	}
}
