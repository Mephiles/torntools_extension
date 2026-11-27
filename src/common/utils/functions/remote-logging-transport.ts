import type { DeviceInfo } from "./device";
import { createRemoteLoggingId } from "./remote-logging";
import type { RemoteLoggingState } from "./remote-logging";
import type { SerializedLogEntry } from "./remote-logging-entry";

export interface RemoteLogEnvironment {
	release: string;
	environment: string;
	device: DeviceInfo;
}

export function getRemoteLoggingEnvelopeUrl(dsn: string): string {
	const url = new URL(dsn);
	const publicKey = url.username;
	const projectId = url.pathname.replace(/^\/+/, "").split("/")[0];

	return `${url.protocol}//${url.host}/api/${projectId}/envelope/?sentry_key=${encodeURIComponent(publicKey)}&sentry_version=7`;
}

export function createRemoteLoggingEvent(entry: SerializedLogEntry, state: RemoteLoggingState, environment: RemoteLogEnvironment, eventId = createEventId()) {
	const page = entry.url ? getUrlPath(entry.url) : undefined;
	const { browser, os, device } = environment.device;

	return {
		event_id: eventId,
		timestamp: entry.timestamp / 1000,
		level: entry.level === "warn" ? "warning" : "error",
		platform: "javascript",
		logger: entry.section ?? "torntools",
		message: { formatted: entry.message },
		release: environment.release,
		environment: environment.environment,
		tags: {
			install_id: state.installId ?? "unknown",
			session_id: state.sessionId ?? "unknown",
			section: entry.section ?? "global",
			browser: browser.name,
			...(browser.major && { browser_version: browser.major }),
			os: os.name,
			...(os.version && { os_version: os.version }),
			device: device.type,
			...(page && { page }),
		},
		...(state.installId && { user: { id: state.installId } }),
		extra: {
			...(entry.data && { data: entry.data }),
			...(entry.stack && { stack: entry.stack }),
			...(entry.url && { url: entry.url }),
			...entry.extraData,
		},
		contexts: {
			browser: { name: browser.name, ...(browser.version && { version: browser.version }) },
			os: { name: os.name, ...(os.version && { version: os.version }) },
			device: { type: device.type, ...(device.family && { family: device.family }), ...(device.model && { model: device.model }) },
		},
		sdk: { name: "torntools.remote-logging", version: "1" },
		...(entry.stack ? {} : { fingerprint: ["{{ default }}", entry.section ?? "torntools", entry.message] }),
	};
}

export function createRemoteLoggingEnvelope(events: readonly object[], dsn: string, sentAt = new Date().toISOString()): string {
	const encoder = new TextEncoder();
	const lines = [JSON.stringify({ sent_at: sentAt, dsn })];

	for (const event of events) {
		const payload = JSON.stringify(event);
		lines.push(JSON.stringify({ type: "event", length: encoder.encode(payload).length }), payload);
	}

	return lines.join("\n");
}

function createEventId(): string {
	return createRemoteLoggingId().replaceAll("-", "");
}

function getUrlPath(url: string): string {
	try {
		return new URL(url, "https://torntools.invalid").pathname;
	} catch {
		return url;
	}
}
