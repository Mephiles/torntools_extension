import { setRuntimeInformation } from "@common/utils/context";
import { DEFAULT_RUNTIME_INFORMATION } from "@common/utils/functions/context-interfaces";
import { RequestListenerInjector } from "@common/utils/functions/script-injector";
import { getStatusIcons } from "@common/utils/functions/torn-injected";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	setRuntimeInformation(DEFAULT_RUNTIME_INFORMATION);
	new RequestListenerInjector(registerInformationRetriever).inject();
});

function registerInformationRetriever() {
	const handlers: Record<string, () => unknown> = {
		getStatusIcons,
	};

	document.addEventListener("tt-information-request", (event: CustomEventInit<{ type: string }>) => {
		const { type } = event.detail;
		const handler = handlers[type];
		if (!handler) return;

		const data = handler();
		document.dispatchEvent(new CustomEvent(`tt-information-response--${type}`, { detail: { type, data } }));
	});

	document.dispatchEvent(new CustomEvent("tt-information-retriever-ready"));
}
