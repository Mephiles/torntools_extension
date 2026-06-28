import { isCustomEvent } from "@common/utils/functions/dom";
import type { CustomEventListener, EventHandler, EventPayloads } from "@common/utils/functions/events";

export const ScriptEventHandler: EventHandler & { eventRoot: EventTarget } = {
	triggerEvent<T extends keyof EventPayloads>(channel: T, payload?: EventPayloads[T]) {
		document.dispatchEvent(new CustomEvent<EventPayloads[T]>(`TT_${channel}`, { detail: payload }));
		window.dispatchEvent(new CustomEvent<EventPayloads[T]>(`TT_${channel}`, { detail: payload }));
		unsafeWindow.dispatchEvent(new CustomEvent<EventPayloads[T]>(`TT_${channel}`, { detail: payload }));
	},

	registerListener<T extends keyof EventPayloads>(channel: T, listener: CustomEventListener<T>) {
		document.addEventListener(`TT_${channel}`, (event: Event) => {
			if (!isCustomEvent<EventPayloads[T]>(event)) return;

			listener(event.detail);
		});
		window.addEventListener(`TT_${channel}`, (event: Event) => {
			if (!isCustomEvent<EventPayloads[T]>(event)) return;

			listener(event.detail);
		});
		unsafeWindow.addEventListener(`TT_${channel}`, (event: Event) => {
			if (!isCustomEvent<EventPayloads[T]>(event)) return;

			listener(event.detail);
		});
	},

	get eventRoot() {
		return document;
	},
};
