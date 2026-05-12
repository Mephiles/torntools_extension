import { browser } from "wxt/browser";
import { type DatabaseKey, userdata } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { hasAPIData } from "@/utils/common/functions/api";
import { isNumber } from "@/utils/common/functions/utilities";
import { BACKGROUND_SERVICE } from "@/utils/services/proxy-services";
import { reloadOptionsStores } from "./stores";
import type { ExportData, ExportDatabaseKey, ExportDatabasePayload, RemoteSyncState } from "./types";

export const MAX_IMPORT_SIZE = 5 * 1024 * 1024;
export const REMOTE_SYNC_SOUND_CUSTOM_LIMIT = 64 * 1024;

const LOCAL_EXPORT_KEYS = ["version", "settings", "filters", "stakeouts", "notes", "quick"] as const satisfies readonly ExportDatabaseKey[];
const REMOTE_SYNC_ITEM_LIMIT = 10 * 1024;
const REMOTE_SYNC_SCHEMA_VERSION = 1;
const REMOTE_SYNC_META_KEY = "__tt_export_meta";
const REMOTE_SYNC_CHUNK_KEY_PREFIX = "__tt_export_chunk_";

type RemoteSyncMeta = {
	schemaVersion: typeof REMOTE_SYNC_SCHEMA_VERSION;
	chunkCount: number;
};

function isRemoteSyncMeta(value: unknown): value is RemoteSyncMeta {
	if (!value || typeof value !== "object") return false;

	const candidate = value as Partial<RemoteSyncMeta>;
	return candidate.schemaVersion === REMOTE_SYNC_SCHEMA_VERSION && typeof candidate.chunkCount === "number";
}

function isExportData(value: unknown): value is ExportData {
	if (!value || typeof value !== "object") return false;

	const candidate = value as Partial<ExportData>;
	return !!candidate.client && typeof candidate.date === "string" && !!candidate.database && typeof candidate.database === "object";
}

function getSyncItemSize(key: string, value: unknown) {
	return key.length + JSON.stringify(value).length;
}

function getSyncTotalSize(items: Record<string, unknown>) {
	return Object.entries(items).reduce((total, [key, value]) => total + getSyncItemSize(key, value), 0);
}

function getByteLength(value: string) {
	return new TextEncoder().encode(value).length;
}

function getChunkKey(index: number) {
	return `${REMOTE_SYNC_CHUNK_KEY_PREFIX}${index}`;
}

function getMaxChunkLength(key: string, raw: string, start: number, perItemLimit: number) {
	let low = start + 1;
	let high = raw.length;
	let best = start;

	while (low <= high) {
		const middle = Math.floor((low + high) / 2);
		const chunk = raw.slice(start, middle);
		const chunkSize = getSyncItemSize(key, chunk);

		if (chunkSize <= perItemLimit) {
			best = middle;
			low = middle + 1;
		} else {
			high = middle - 1;
		}
	}

	return best;
}

function createChunkItems(raw: string, keyFactory: (index: number) => string) {
	const perItemLimit = Math.min(browser.storage.sync.QUOTA_BYTES_PER_ITEM ?? REMOTE_SYNC_ITEM_LIMIT, REMOTE_SYNC_ITEM_LIMIT);
	const chunkValues: string[] = [];
	let chunkStart = 0;

	while (chunkStart < raw.length) {
		const key = keyFactory(chunkValues.length);
		const chunkEnd = getMaxChunkLength(key, raw, chunkStart, perItemLimit);

		if (chunkEnd === chunkStart) {
			throw new Error(`Sync item '${key}' cannot fit within the ${perItemLimit} byte storage.sync item limit.`);
		}

		chunkValues.push(raw.slice(chunkStart, chunkEnd));
		chunkStart = chunkEnd;
	}

	return chunkValues;
}

function createRemoteSyncItems(data: ExportData): Record<string, unknown> {
	const totalLimit = browser.storage.sync.QUOTA_BYTES ?? 102400;
	const raw = JSON.stringify(data);
	const chunks = createChunkItems(raw, getChunkKey);
	const items: Record<string, unknown> = {
		[REMOTE_SYNC_META_KEY]: {
			schemaVersion: REMOTE_SYNC_SCHEMA_VERSION,
			chunkCount: chunks.length,
		} satisfies RemoteSyncMeta,
	};

	chunks.forEach((chunk, index) => {
		items[getChunkKey(index)] = chunk;
	});

	const totalSize = getSyncTotalSize(items);
	if (totalSize > totalLimit) {
		throw new Error(`Sync export is ${totalSize} bytes, exceeding the ${totalLimit} byte storage.sync limit.`);
	}

	return items;
}

function parseChunkedRemoteSyncData(items: Record<string, unknown>): ExportData | null {
	const meta = items[REMOTE_SYNC_META_KEY];
	if (!isRemoteSyncMeta(meta)) return null;

	const chunks: string[] = [];
	for (let index = 0; index < meta.chunkCount; index += 1) {
		const chunk = items[getChunkKey(index)];
		if (typeof chunk !== "string") return null;
		chunks.push(chunk);
	}

	try {
		const parsed = JSON.parse(chunks.join(""));
		return isExportData(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export async function getExportData(includeApi: boolean): Promise<ExportData> {
	const exportedKeys = [...LOCAL_EXPORT_KEYS] as DatabaseKey[];
	if (includeApi) exportedKeys.unshift("api");

	const values = await ttStorage.get(exportedKeys);
	const database: ExportDatabasePayload = {};

	values.forEach((value, index) => {
		if (!isNumber(value)) {
			(database as Record<string, unknown>)[exportedKeys[index]] = value;
		}
	});

	return {
		user: hasAPIData() ? { id: userdata.profile.id, name: userdata.profile.name } : false,
		client: {
			version: browser.runtime.getManifest().version,
			space: await ttStorage.getSize(),
		},
		date: new Date().toString(),
		database,
	};
}

export async function getRemoteSyncExportPreview(): Promise<{ data: ExportData; omittedSoundCustom: boolean }> {
	const data = await getExportData(false);
	const soundCustom = data.database.settings?.notifications?.soundCustom;

	let omittedSoundCustom: boolean = false;
	if (typeof soundCustom === "string" && soundCustom.length > 0 && getByteLength(soundCustom) > REMOTE_SYNC_SOUND_CUSTOM_LIMIT) {
		if (data.database.settings?.notifications) {
			delete data.database.settings.notifications.soundCustom;
		}

		omittedSoundCustom = true;
	}

	return { data, omittedSoundCustom };
}

export async function importExportData(data: ExportData): Promise<{ importedApi: boolean }> {
	if (!isExportData(data)) {
		throw new Error("Imported data is not a valid TornTools export.");
	}

	await ttStorage.change(data.database);

	const importedApi = "api" in data.database && !!data.database.api;
	if (importedApi) {
		await BACKGROUND_SERVICE.initialize();
	}

	await reloadOptionsStores();

	return { importedApi };
}

export async function loadRemoteSyncData(): Promise<RemoteSyncState> {
	const data = await browser.storage.sync.get(null);
	const chunkedData = parseChunkedRemoteSyncData(data);

	if (chunkedData) {
		return { available: true, data: chunkedData };
	}

	if (Object.keys(data).length && "database" in data && isExportData(data)) {
		return { available: true, data };
	}

	return { available: false, message: "No exported data." };
}

export async function saveRemoteSyncData(): Promise<RemoteSyncState> {
	const preview = await getRemoteSyncExportPreview();

	await browser.storage.sync.clear();
	await browser.storage.sync.set(createRemoteSyncItems(preview.data));

	return { available: true, data: preview.data };
}

export async function clearRemoteSyncData(): Promise<void> {
	await browser.storage.sync.clear();
}
