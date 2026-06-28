import { type CustomEventListener, EVENT_CHANNELS, type EventHandler, type EventPayloads } from "@common/utils/functions/events";

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
			listener(payload);
		}
	},

	registerListener<T extends keyof EventPayloads>(channel: T, listener: CustomEventListener<T>) {
		CUSTOM_LISTENERS[channel].push(listener);
	},
};
