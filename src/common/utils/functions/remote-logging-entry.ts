import { ElementNotFoundError } from "@common/utils/functions/find-elements.ts";
import type { LogSinkEvent } from "./logger";

export interface SerializedLogEntry {
	level: "warn" | "error";
	section: string | null;
	timestamp: number;
	message: string;
	data?: string;
	url?: string;
	stack?: string;
	extraData: Record<string, unknown>;
}

const SENSITIVE_URL_PARAM = /([?&#](?:api_?key|key|access_?token|token|auth|password|secret|rfcv|_rfcv|csrf_?token|csrf|_token)=)[^&#\s"']+/gi;
const FULL_URL = /\b(?:https?|file|chrome-extension|moz-extension):\/\/[^\s"'<>)]+/gi;

export function serializeLogEntry(entry: LogSinkEvent, secrets: readonly string[], url?: string): SerializedLogEntry {
	const messageParts: string[] = [];
	const dataArgs: unknown[] = [];
	let stack: string | undefined;
	const extraData: Record<string, unknown> = {};

	for (const arg of entry.args) {
		if (typeof arg === "string") {
			messageParts.push(arg);
		} else if (arg instanceof Error) {
			messageParts.push(`${arg.name}: ${arg.message}`);
			extraData.name = arg.name;
			if (arg.stack) stack ??= arg.stack;

			if (arg instanceof ElementNotFoundError) {
				extraData.parent = arg.parent ?? null;
				extraData.selector = arg.selector;
			}
		} else {
			dataArgs.push(arg);
		}
	}

	const data = dataArgs.length ? safeStringify(dataArgs) : undefined;

	// Redact before truncating: a secret cut in half by a limit no longer matches, and half a key would be sent.
	const redacted = redactRemoteLogEntry(
		{
			level: entry.level,
			section: entry.section,
			timestamp: entry.timestamp,
			message: messageParts.length ? messageParts.join(" ") : (data ?? "Log event"),
			...(data && { data }),
			...(url && { url }),
			...(stack && { stack }),
			extraData,
		},
		secrets,
	);

	return {
		...redacted,
		message: redacted.message.slice(0, 4_000),
		...(redacted.data && { data: redacted.data.slice(0, 4_000) }),
		...(redacted.stack && { stack: redacted.stack.slice(0, 10_000) }),
		extraData: {
			...redacted.extraData,
			...(typeof redacted.extraData.parent === "string" && { parent: redacted.extraData.parent.slice(0, 2_000) }),
		},
	};
}

export function mapStackInLogEntry(entry: SerializedLogEntry, mapStack: (stack: string) => string): SerializedLogEntry {
	if (!entry.stack) return entry;

	try {
		const stack = mapStack(entry.stack);
		return stack ? { ...entry, stack } : entry;
	} catch {
		return entry;
	}
}

export function redactRemoteLogEntry(entry: SerializedLogEntry, secrets: readonly string[]): SerializedLogEntry {
	const redactUrl = (value: string) => {
		let result = value;

		for (const secret of secrets) {
			if (!secret) continue;

			result = result.split(secret).join("[redacted]");
		}

		return redactUrlSecrets(result);
	};
	const redactText = (value: string) => sanitizeUrlsInText(redactUrl(value));

	return {
		...entry,
		message: redactText(entry.message),
		...(entry.data && { data: redactText(entry.data) }),
		...(entry.stack && { stack: redactText(entry.stack) }),
		...(entry.url && { url: sanitizePageUrl(redactUrl(entry.url)) }),
		extraData: Object.fromEntries(
			Object.entries(entry.extraData ?? {}).map(([key, value]) => [key, typeof value === "string" ? redactText(value) : value]),
		),
	};
}

export function sanitizePageUrl(url: string): string {
	try {
		const parsed = new URL(url);
		const origin = parsed.origin === "null" ? "" : parsed.origin;
		return redactUrlSecrets(`${origin}${parsed.pathname}${parsed.search}${parsed.hash}`);
	} catch {
		return redactUrlSecrets(url);
	}
}

function redactUrlSecrets(value: string): string {
	return value.replaceAll(SENSITIVE_URL_PARAM, "$1[redacted]");
}

function sanitizeUrlsInText(value: string): string {
	return value.replaceAll(FULL_URL, (url) => sanitizePageUrl(url));
}

function safeStringify(value: unknown): string {
	const seen = new WeakSet<object>();

	try {
		return JSON.stringify(
			value,
			(_key, item) => {
				if (typeof item === "bigint") return item.toString();
				if (typeof item !== "object" || item === null) return item;
				if (seen.has(item)) return "[circular]";

				seen.add(item);
				return item;
			},
			2,
		);
	} catch {
		return String(value);
	}
}
