import { ttStorage } from "@common/utils/context";
import { type Database, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { isNumber } from "@common/utils/functions/utilities";
import { loadDatabaseStores } from "@extension/entrypoints/options/stores/database-store.svelte";
import { browser } from "wxt/browser";
import { BACKGROUND_SERVICE } from "@/services/proxy-services";

export const MAX_IMPORT_SIZE = 5 * 1024 * 1024;

export type ExportDatabaseKey = "version" | "settings" | "filters" | "stakeouts" | "notes" | "quick" | "api" | "migrations" | "localdata";
export type ExportDatabasePayload = Partial<Pick<Database, ExportDatabaseKey>>;

const LOCAL_EXPORT_KEYS: ExportDatabaseKey[] = ["version", "settings", "filters", "stakeouts", "notes", "quick", "migrations", "localdata"];

export interface ExportData {
	user: false | { id: number; name: string };
	client: {
		version: string;
		space: number;
	};
	date: string;
	database: ExportDatabasePayload;
}

export function isExportData(value: unknown): value is ExportData {
	if (!value || typeof value !== "object") return false;

	const candidate = value as Partial<ExportData>;
	return !!candidate.client && typeof candidate.date === "string" && !!candidate.database && typeof candidate.database === "object";
}

export async function getExportData(includeApi: boolean): Promise<ExportData> {
	const exportedKeys = [...LOCAL_EXPORT_KEYS];
	if (includeApi) exportedKeys.unshift("api");

	const values = await ttStorage.get(exportedKeys);
	const database: ExportDatabasePayload = {};

	values
		.filter((value) => !isNumber(value))
		.forEach((value, index) => {
			(database as Record<string, unknown>)[exportedKeys[index]] = value;
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

export async function importExportData(data: ExportData) {
	if (!isExportData(data)) {
		throw new Error("Imported data is not a valid TornTools export.");
	}

	await ttStorage.change(data.database);

	const importedApi = "api" in data.database && !!data.database.api;
	if (importedApi) {
		await BACKGROUND_SERVICE.initialize();
	}

	await loadDatabaseStores();
}

export function parseImportText(text: string): ExportData {
	if (text.length > MAX_IMPORT_SIZE) {
		throw new Error("Maximum file size exceeded. (5MB)");
	}

	try {
		return JSON.parse(text) as ExportData;
	} catch {
		throw new Error("Couldn't read the imported data.");
	}
}
