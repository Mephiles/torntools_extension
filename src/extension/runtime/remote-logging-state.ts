import { ttStorage } from "@common/utils/context";
import { updatePreferenceValue } from "@common/utils/data/preference-storage";
import {
	REMOTE_LOGGING_ORIGIN,
	ensureRemoteLoggingInstallId as ensureInstallId,
	extendRemoteLoggingSession as extendSession,
	normalizeRemoteLoggingState,
	revokeRemoteLoggingSession as revokeSession,
	startRemoteLoggingSession as startSession,
} from "@common/utils/functions/remote-logging";
import type { RemoteLoggingState } from "@common/utils/functions/remote-logging";
import { browser } from "wxt/browser";

interface DataCollectionPermissions {
	data_collection?: string[];
}

export async function getRemoteLoggingState(): Promise<RemoteLoggingState> {
	const settings = await ttStorage.get("settings");
	return normalizeRemoteLoggingState(settings?.logging?.remote);
}

export async function ensureRemoteLoggingInstallId() {
	const state = await getRemoteLoggingState();
	if (state.installId) return state;

	const installId = ensureInstallId(state).installId;

	await updatePreferenceValue("settings.logging.remote.installId", installId);
}

async function updateRemoteLoggingSession(state: RemoteLoggingState) {
	await updatePreferenceValue("settings.logging.remote.sessionId", state.sessionId);
	await updatePreferenceValue("settings.logging.remote.sessionExpiresAt", state.sessionExpiresAt);
}

export async function startRemoteLoggingSession() {
	await ensureRemoteLoggingInstallId();
	await updateRemoteLoggingSession(startSession(await getRemoteLoggingState()));
}

export async function extendRemoteLoggingSession() {
	await updateRemoteLoggingSession(extendSession(await getRemoteLoggingState()));
}

export async function revokeRemoteLoggingSession() {
	await updateRemoteLoggingSession(revokeSession(await getRemoteLoggingState()));
}

export async function hasRemoteLoggingPermissions(): Promise<boolean> {
	if (!browser.permissions) return false;

	const origins = await browser.permissions.contains({ origins: [REMOTE_LOGGING_ORIGIN] });
	if (!origins) return false;

	return await hasRemoteLoggingDataCollectionPermission();
}

export async function requestRemoteLoggingPermissions(): Promise<boolean> {
	if (!browser.permissions) return false;

	const request: Browser.permissions.Permissions & DataCollectionPermissions = { origins: [REMOTE_LOGGING_ORIGIN] };
	if (await supportsDataCollectionPermissions()) {
		request.data_collection = ["technicalAndInteraction"];
	}

	const granted = await browser.permissions.request(request);
	if (!granted) return false;

	return await hasRemoteLoggingDataCollectionPermission();
}

async function hasRemoteLoggingDataCollectionPermission(): Promise<boolean> {
	const dataCollection = await getDataCollectionPermissions();

	return dataCollection === null || dataCollection.includes("technicalAndInteraction");
}

/**
 * Data collection permissions only exist from Firefox 140 onwards. Browsers without them either reject the key in a
 * request or ignore it, but none of them report one from getAll, so that is the only answer that can be trusted.
 */
async function supportsDataCollectionPermissions(): Promise<boolean> {
	return (await getDataCollectionPermissions()) !== null;
}

async function getDataCollectionPermissions(): Promise<string[] | null> {
	if (!browser.permissions) return null;

	const permissions = (await browser.permissions.getAll()) as Browser.permissions.Permissions & DataCollectionPermissions;

	// Present but empty means "has the permission system, nothing granted yet"; absent means the browser has neither.
	return permissions.data_collection ?? null;
}
