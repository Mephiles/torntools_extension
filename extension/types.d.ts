/** biome-ignore-all lint/complexity/noBannedTypes: Defining global existing types. */
export declare global {
	function setTimeout(handler: Function, timeout?: number): number;
	function setInterval(handler: Function, timeout?: number): number;
}
