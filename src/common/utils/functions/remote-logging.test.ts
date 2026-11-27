import { describe, expect, it } from "bun:test";
import {
	DEFAULT_REMOTE_LOGGING_STATE,
	REMOTE_LOGGING_SESSION_DURATION,
	extendRemoteLoggingSession,
	isRemoteLoggingSessionActive,
	normalizeRemoteLoggingState,
	revokeRemoteLoggingSession,
	startRemoteLoggingSession,
} from "./remote-logging";

function createIds(...ids: string[]) {
	return () => {
		const id = ids.shift();
		if (!id) throw new Error("No more ids.");
		return id;
	};
}

describe("remote logging sessions", () => {
	it("should start a 72-hour session and create an install id", () => {
		const state = startRemoteLoggingSession(DEFAULT_REMOTE_LOGGING_STATE, 1_000, createIds("install", "session"));

		expect(state).toEqual({
			enabled: true,
			installId: "install",
			sessionId: "session",
			sessionExpiresAt: 1_000 + REMOTE_LOGGING_SESSION_DURATION,
		});
		expect(isRemoteLoggingSessionActive(state, 1_000)).toBe(true);
		expect(isRemoteLoggingSessionActive(state, state.sessionExpiresAt!)).toBe(false);
	});

	it("should extend from the current expiry when it is still in the future", () => {
		const state = {
			enabled: true,
			installId: "install",
			sessionId: "session",
			sessionExpiresAt: 50_000,
		};

		expect(extendRemoteLoggingSession(state, 10_000).sessionExpiresAt).toBe(50_000 + REMOTE_LOGGING_SESSION_DURATION);
	});

	it("should extend from now when the session already expired", () => {
		const state = {
			enabled: true,
			installId: "install",
			sessionId: "session",
			sessionExpiresAt: 50_000,
		};

		expect(extendRemoteLoggingSession(state, 100_000).sessionExpiresAt).toBe(100_000 + REMOTE_LOGGING_SESSION_DURATION);
	});

	it("should revoke the session but keep the install id", () => {
		expect(
			revokeRemoteLoggingSession({
				enabled: true,
				installId: "install",
				sessionId: "session",
				sessionExpiresAt: 50_000,
			}),
		).toEqual({
			enabled: false,
			installId: "install",
			sessionId: null,
			sessionExpiresAt: null,
		});
	});

	it("should normalize invalid state", () => {
		expect(normalizeRemoteLoggingState(null)).toEqual(DEFAULT_REMOTE_LOGGING_STATE);
		expect(normalizeRemoteLoggingState({ enabled: "yes", installId: 5, sessionId: "", sessionExpiresAt: Number.NaN })).toEqual(
			DEFAULT_REMOTE_LOGGING_STATE,
		);
	});
});
