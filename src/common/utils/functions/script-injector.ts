export interface ScriptInjector {
	injectFetch(): void;
	injectXHR(): void;
}
