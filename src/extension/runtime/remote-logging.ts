import { RUNTIME_INFORMATION, ttStorage } from "@common/utils/context";
import { api } from "@common/utils/data/database";
import { getDeviceInfo } from "@common/utils/functions/device";
import { setLogSink } from "@common/utils/functions/logger";
import type { LogSinkEvent } from "@common/utils/functions/logger";
import { REMOTE_LOGGING_DSN, isRemoteLoggingSessionActive } from "@common/utils/functions/remote-logging";
import { mapStackInLogEntry, sanitizePageUrl, serializeLogEntry } from "@common/utils/functions/remote-logging-entry";
import type { SerializedLogEntry } from "@common/utils/functions/remote-logging-entry";
import { createRemoteLoggingEnvelope, createRemoteLoggingEvent, getRemoteLoggingEnvelopeUrl } from "@common/utils/functions/remote-logging-transport";
import type { RemoteLogEnvironment } from "@common/utils/functions/remote-logging-transport";
import { BACKGROUND_SERVICE } from "@/services/proxy-services";
import { getRemoteLoggingState } from "./remote-logging-state";

const MAX_QUEUE_SIZE = 20;
const MAX_BATCH_SIZE = 10;

let queue: SerializedLogEntry[] = [];
let flushing = false;
let sourceMapper: ((stack: string) => string) | null = null;

/** Registers the source map mapper applied to remote log stacks; only the background has the source map. */
export function setSourceMapper(mapper: (stack: string) => string): void {
	sourceMapper = mapper;
}

export function registerRemoteLoggingSink(isBackground: boolean): void {
	setLogSink((entry) => void forwardRemoteLog(entry, isBackground));
}

async function forwardRemoteLog(entry: LogSinkEvent, isBackground: boolean): Promise<void> {
	try {
		if (!isRemoteLoggingSessionActive(await getRemoteLoggingState())) return;

		// The background has no Torn page, so don't attach a meaningless extension URL.
		const serialized = serializeLogEntry(entry, await getApiKeys(), isBackground ? undefined : currentPageUrl());

		if (isBackground) enqueueRemoteLog(serialized);
		else await BACKGROUND_SERVICE.remoteLog(serialized);
	} catch {
		// Remote logging must never break the caller.
	}
}

export function enqueueRemoteLog(entry: SerializedLogEntry): void {
	if (queue.length >= MAX_QUEUE_SIZE) queue.shift();
	queue.push(entry);
	void flushRemoteLogs();
}

async function flushRemoteLogs(): Promise<void> {
	if (flushing || queue.length === 0) return;
	flushing = true;

	try {
		while (queue.length > 0) {
			const state = await getRemoteLoggingState();
			if (!isRemoteLoggingSessionActive(state) || !state.installId || !state.sessionId) {
				queue = [];
				return;
			}

			const batch = queue.splice(0, MAX_BATCH_SIZE);
			const environment = getRemoteLogEnvironment();

			const events = batch
				.map((entry) => {
					try {
						const mapped = sourceMapper ? mapStackInLogEntry(entry, sourceMapper) : entry;
						return createRemoteLoggingEvent(mapped, state, environment);
					} catch {
						return null;
					}
				})
				.filter((event) => event !== null);

			if (events.length === 0) continue;

			try {
				await fetch(getRemoteLoggingEnvelopeUrl(REMOTE_LOGGING_DSN), {
					method: "POST",
					headers: { "Content-Type": "application/x-sentry-envelope" },
					body: createRemoteLoggingEnvelope(events, REMOTE_LOGGING_DSN),
				});
			} catch {
				// Deliberately not retried or persisted.
			}
		}
	} catch {
		queue = [];
	} finally {
		flushing = false;
		if (queue.length > 0) void flushRemoteLogs();
	}
}

function currentPageUrl(): string | undefined {
	return typeof location !== "undefined" ? sanitizePageUrl(location.href) : undefined;
}

function getRemoteLogEnvironment(): RemoteLogEnvironment {
	return {
		release: `torntools@${RUNTIME_INFORMATION.getVersion()}`,
		environment: typeof __TT_DEV__ !== "undefined" && __TT_DEV__ ? "development" : "production",
		device: getDeviceInfo(),
	};
}

async function getApiKeys(): Promise<string[]> {
	const apiData = api ?? (await ttStorage.get("api").catch(() => undefined));

	return Object.values(apiData ?? {})
		.map((service) => service?.key)
		.filter((key): key is string => typeof key === "string" && key.length > 0);
}
