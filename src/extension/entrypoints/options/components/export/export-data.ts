import { ttStorage } from "@common/utils/context";
import { loadDatabase, userdata } from "@common/utils/data/database";
import type { Database } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { isNumber } from "@common/utils/functions/utilities";
import { browser } from "wxt/browser";
import { BACKGROUND_SERVICE } from "@/services/proxy-services";

export const MAX_IMPORT_SIZE = 5 * 1024 * 1024;

export type ExportDatabaseKey = keyof Database;
export type ExportDatabasePayload = Partial<Database>;

const LOCAL_EXPORT_KEYS: ExportDatabaseKey[] = ["version", "settings", "filters", "stakeouts", "factionStakeouts", "notes", "quick", "migrations", "localdata"];

export interface ExportData {
	user: false | { id: number; name: string };
	client: {
		version: string;
		space: number;
	};
	date: string;
	database: ExportDatabasePayload;
	corrupted?: string[];
}

export function isExportData(value: unknown): value is ExportData {
	if (!value || typeof value !== "object") return false;

	const candidate = value as Partial<ExportData>;
	return !!candidate.client && typeof candidate.date === "string" && !!candidate.database && typeof candidate.database === "object";
}

export async function getExportData(includeApi: boolean, isFileExport = false): Promise<ExportData> {
	const exportedKeys = Array.from(LOCAL_EXPORT_KEYS);
	if (includeApi) exportedKeys.unshift("api");

	let values: unknown[];
	const corrupted: string[] = [];
	try {
		values = (await ttStorage.get(exportedKeys)) as unknown[];
	} catch {
		values = [];
		for (const key of exportedKeys) {
			try {
				const value = await ttStorage.get(key);
				values.push(value);
			} catch {
				corrupted.push(key);
				values.push(undefined);
			}
		}
	}

	const database: ExportDatabasePayload = {};

	values
		.filter((value) => !isNumber(value))
		.forEach((value, index) => {
			const key = exportedKeys[index];

			if (corrupted.includes(key) && isFileExport) {
				database[`${key}-corrupted`] = null;
			} else {
				database[key] = value as any;
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
		...(corrupted.length > 0 && { corrupted }),
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

	await loadDatabase(true);
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
