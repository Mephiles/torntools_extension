import { executeScript } from "@common/utils/functions/dom";
import type { InformationRetriever, StatusIcons } from "@common/utils/functions/torn-injected";
import { browser } from "wxt/browser";

interface InformationRequest {
	type: keyof InformationRetriever;
}

interface InformationResponseEvent<T = any> {
	type: keyof InformationRetriever;
	data: T;
}

let injectReady: Promise<void> | null = null;

function ensureInjected(): Promise<void> {
	if (injectReady) return injectReady;

	injectReady = new Promise((resolve) => {
		document.addEventListener("tt-information-retriever-ready", () => resolve(), { once: true });
		executeScript(browser.runtime.getURL("/information-retriever--inject.js"), false);
	});

	return injectReady;
}

function retrieve<M extends keyof InformationRetriever>(type: M): ReturnType<InformationRetriever[M]> {
	return ensureInjected().then(
		() =>
			new Promise((resolve) => {
				document.addEventListener(
					`tt-information-response--${type}`,
					((event: CustomEvent<InformationResponseEvent>) => {
						resolve(event.detail.data);
					}) as EventListener,
					{ once: true },
				);

				document.dispatchEvent(new CustomEvent<InformationRequest>("tt-information-request", { detail: { type } }));
			}) as ReturnType<InformationRetriever[M]>,
	) as ReturnType<InformationRetriever[M]>;
}

export const ExtensionInformationRetriever: InformationRetriever = {
	getStatusIcons(): Promise<StatusIcons> {
		return retrieve("getStatusIcons");
	},
};
