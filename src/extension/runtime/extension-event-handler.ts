import { isCustomEvent } from "@common/utils/functions/dom.ts";
import { EVENT_CHANNELS } from "@common/utils/functions/events";
import type { CustomEventListener, EventHandler, EventPayloads } from "@common/utils/functions/events";

const CUSTOM_LISTENERS: { [K in keyof EventPayloads]: CustomEventListener<K>[] } = (() => {
	const listeners: Partial<{ [K in keyof EventPayloads]: CustomEventListener<K>[] }> = {};

	for (const channel of Object.values(EVENT_CHANNELS)) {
		listeners[channel] = [];
	}

	return listeners as { [K in keyof EventPayloads]: CustomEventListener<K>[] };
})();

export const ExtensionEventHandler: EventHandler = {
	triggerEvent<T extends keyof EventPayloads>(channel: T, payload?: EventPayloads[T]) {
		for (const listener of CUSTOM_LISTENERS[channel]) {
			listener(payload as EventPayloads[T]);
		}
	},

	registerListener<T extends keyof EventPayloads>(channel: T, listener: CustomEventListener<T>) {
		CUSTOM_LISTENERS[channel].push(listener);
	},

	triggerEventCrossWorld<T extends keyof EventPayloads>(target: EventTarget, channel: T, payload?: EventPayloads[T]) {
		target.dispatchEvent(new CustomEvent(channel, { detail: payload !== undefined ? JSON.stringify(payload) : undefined }));
	},

	registerListenerCrossWorld<T extends keyof EventPayloads>(target: EventTarget, channel: T, listener: CustomEventListener<T>) {
		target.addEventListener(channel, (event: Event) => {
			if (!isCustomEvent<EventPayloads[T] | string>(event)) return;

			const rawDetail = event.detail;
			if (typeof rawDetail === "string") listener(JSON.parse(rawDetail));
			else listener(rawDetail);
		});
	},
};
