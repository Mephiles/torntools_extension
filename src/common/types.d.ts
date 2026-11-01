/* oxlint-disable typescript/no-empty-object-type typescript/no-wrapper-object-types — defining global existing types */
export declare global {
	// Replaced at build time with `true` for development builds and `false` otherwise (see wxt.config.ts and tools/build-userscripts.ts).
	const __TT_DEV__: boolean;

	// Replaced at build time with this userscript's metadata (see tools/build-userscripts.ts).
	// TornPDA provides an empty GM.info.script, so these are the reliable source for the script's identity.
	// Undefined outside userscript builds.
	const __TT_SCRIPT_NAME__: string;
	const __TT_SCRIPT_NAMESPACE__: string;
	const __TT_SCRIPT_VERSION__: string;

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
