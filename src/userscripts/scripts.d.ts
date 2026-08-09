/// <reference types="vite-plugin-monkey/global" />

declare module "*.css?inline" {
	const css: string;
	export default css;
}

declare module "*.svg?raw" {
	const svg: string;
	export default svg;
}

export declare global {
	const PDA_storage: PDAStorage;

	interface PDAStorage {
		get<T = unknown>(key: string, def?: T): Promise<T>;
		getMany(keys: string[]): Promise<Record<string, unknown>>;
		loadAll(): Promise<Record<string, unknown>>;
		list(): Promise<string[]>;
		set(key: string, value: any): Promise<void>;
		setMany(data: Record<string, unknown>): Promise<void>;
		delete(key: string): Promise<void>;
		usage(): Promise<{ used: number; quota: number }>;
	}

	interface Window {
		flutter_inappwebview: FlutterWebview;
	}

	interface FlutterWebview {
		callHandler<T = void>(handler: string, ...args: unknown): Promise<T>;
	}
}
