import "@common/utils/global/globalStyle.css";
import "@common/utils/global/globalVariables.css";
import { setEventHandler, setFeatureManager, setInformationRetriever, setRuntimeInformation } from "@common/utils/context";
import type { RuntimeInformation, TTWindow } from "@common/utils/functions/context-interfaces";
import { isCustomEvent } from "@common/utils/functions/dom";
import { type CustomEventListener, type EventHandler, type EventPayloads } from "@common/utils/functions/events";
import { getStatusIcons, type InformationRetriever } from "@common/utils/functions/torn-injected";
import { ScriptFeatureManager } from "@userscripts/runtime/script-feature-manager";
import { isPDA } from "@userscripts/utils/script-utils.ts";

export function registerCoreUserscriptContext() {
	setRuntimeInformation(UserscriptRuntimeInformation);
	setFeatureManager(new ScriptFeatureManager());
	setEventHandler(ScriptEventHandler);
	setInformationRetriever(ScriptInformationRetriever);

	initializeScriptTheme();
}

function initializeScriptTheme() {
	document.documentElement.style.setProperty("--tt-theme-color", "#fff");
	document.documentElement.style.setProperty("--tt-theme-background", "var(--tt-background-green)");
}

const UserscriptRuntimeInformation: RuntimeInformation = {
	getWindow(): TTWindow {
		return unsafeWindow;
	},

	getVersion(): string {
		return GM.info.version;
	},

	isUserscript(): boolean {
		return true;
	},

	reloadWindow(force?: boolean) {
		if (isPDA()) void window.flutter_inappwebview.callHandler("reloadPage");
		else location.reload(force);
	},
};

const ScriptEventHandler: EventHandler & { eventRoot: EventTarget } = {
	triggerEvent<T extends keyof EventPayloads>(channel: T, payload?: EventPayloads[T]) {
		document.dispatchEvent(new CustomEvent<EventPayloads[T]>(`TT_${channel}`, { detail: payload }));
	},

	registerListener<T extends keyof EventPayloads>(channel: T, listener: CustomEventListener<T>) {
		document.addEventListener(`TT_${channel}`, (event: Event) => {
			if (!isCustomEvent<EventPayloads[T]>(event)) return;

			listener(event.detail);
		});
	},

	get eventRoot() {
		return document;
	},

	triggerEventCrossWorld<T extends keyof EventPayloads>(target: EventTarget, channel: T, payload?: EventPayloads[T]) {
		target.dispatchEvent(new CustomEvent(`TT_${channel}`, { detail: payload }));
	},

	registerListenerCrossWorld<T extends keyof EventPayloads>(target: EventTarget, channel: T, listener: CustomEventListener<T>) {
		target.addEventListener(`TT_${channel}`, (event: Event) => {
			if (!isCustomEvent<EventPayloads[T]>(event)) return;

			listener(event.detail);
		});
	},
};

const ScriptInformationRetriever: InformationRetriever = {
	getStatusIcons: async () => getStatusIcons(),
};
