export function isPDA() {
	// @ts-ignore: We don't really use this function, we just check its presence to mark this as PDA.
	return typeof PDA_evaluateJavascript === "function";
}
