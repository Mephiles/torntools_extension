import type { Database } from "@utils/data/database";
import { browser } from "wxt/browser";
import { type ExportData, getExportData, isExportData } from "../export-data";

export const REMOTE_SYNC_SOUND_CUSTOM_LIMIT = 64 * 1024;

export type ExportDatabaseKey = "version" | "settings" | "filters" | "stakeouts" | "notes" | "quick" | "api";
export type ExportDatabasePayload = Partial<Pick<Database, ExportDatabaseKey>>;

const REMOTE_SYNC_ITEM_LIMIT = 10 * 1024;
const REMOTE_SYNC_SCHEMA_VERSION = 1;
const REMOTE_SYNC_META_KEY = "__tt_export_meta";
const REMOTE_SYNC_CHUNK_KEY_PREFIX = "__tt_export_chunk_";

type RemoteSyncMeta = {
	schemaVersion: typeof REMOTE_SYNC_SCHEMA_VERSION;
	chunkCount: number;
};

export type RemoteSyncState =
	| {
			available: false;
			message: string;
	  }
	| {
			available: true;
			data: ExportData;
	  };

function isRemoteSyncMeta(value: unknown): value is RemoteSyncMeta {
	if (!value || typeof value !== "object") return false;

	const candidate = value as Partial<RemoteSyncMeta>;
	return candidate.schemaVersion === REMOTE_SYNC_SCHEMA_VERSION && typeof candidate.chunkCount === "number";
}

function getSyncItemSize(key: string, value: unknown) {
	return key.length + JSON.stringify(value).length;
}

function getSyncTotalSize(items: Record<string, unknown>) {
	return Object.entries(items).reduce((total, [key, value]) => total + getSyncItemSize(key, value), 0);
}

export function getByteLength(value: string) {
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

export async function getRemoteSyncExportPreview(): Promise<{ data: ExportData; omittedSoundCustom: boolean }> {
	const data = await getExportData(false);
	const soundCustom = data.database.settings?.notifications?.soundCustom;

	let omittedSoundCustom = false;
	if (typeof soundCustom === "string" && soundCustom.length > 0 && getByteLength(soundCustom) > REMOTE_SYNC_SOUND_CUSTOM_LIMIT) {
		if (data.database.settings?.notifications) {
			delete data.database.settings.notifications.soundCustom;
		}

		omittedSoundCustom = true;
	}

	return { data, omittedSoundCustom };
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
