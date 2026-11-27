import type { DatabaseSettings } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import { TO_MILLIS } from "@common/utils/functions/utilities.ts";

export const REMOTE_LOGGING_DSN = "https://47b6494935134cc2af81581d3778610b@logs.torntools.tornplayground.eu/1";
export const REMOTE_LOGGING_ORIGIN = "https://logs.torntools.tornplayground.eu/*";
export const REMOTE_LOGGING_SESSION_DURATION = 3 * TO_MILLIS.DAYS;

export type RemoteLoggingState = DatabaseSettings["logging"]["remote"];

export const DEFAULT_REMOTE_LOGGING_STATE: RemoteLoggingState = getDefaultStorage(DEFAULT_STORAGE.settings.logging).remote;

export function normalizeRemoteLoggingState(value: unknown): RemoteLoggingState {
	if (!value || typeof value !== "object") return { ...DEFAULT_REMOTE_LOGGING_STATE };

	const state = value as Partial<RemoteLoggingState>;

	return {
		enabled: state.enabled === true,
		installId: typeof state.installId === "string" && state.installId ? state.installId : null,
		sessionId: typeof state.sessionId === "string" && state.sessionId ? state.sessionId : null,
		sessionExpiresAt: typeof state.sessionExpiresAt === "number" && Number.isFinite(state.sessionExpiresAt) ? state.sessionExpiresAt : null,
	};
}

export function isRemoteLoggingSessionActive(state: RemoteLoggingState, now = Date.now()): boolean {
	return state.enabled && !!state.installId && !!state.sessionId && !!state.sessionExpiresAt && state.sessionExpiresAt > now;
}

export function ensureRemoteLoggingInstallId(state: RemoteLoggingState, createId = createRemoteLoggingId): RemoteLoggingState {
	return state.installId ? state : { ...state, installId: createId() };
}

export function startRemoteLoggingSession(state: RemoteLoggingState, now = Date.now(), createId = createRemoteLoggingId): RemoteLoggingState {
	return {
		...ensureRemoteLoggingInstallId(state, createId),
		enabled: true,
		sessionId: createId(),
		sessionExpiresAt: now + REMOTE_LOGGING_SESSION_DURATION,
	};
}

export function extendRemoteLoggingSession(state: RemoteLoggingState, now = Date.now()): RemoteLoggingState {
	if (!state.enabled || !state.sessionId || !state.sessionExpiresAt) return state;

	return { ...state, sessionExpiresAt: Math.max(now, state.sessionExpiresAt) + REMOTE_LOGGING_SESSION_DURATION };
}

export function revokeRemoteLoggingSession(state: RemoteLoggingState): RemoteLoggingState {
	return { ...state, enabled: false, sessionId: null, sessionExpiresAt: null };
}

export function createRemoteLoggingId(): string {
	return globalThis.crypto.randomUUID();
}
