import { ttStorage } from "@utils/context";
import { type Database, loadDatabase, populateDatabaseVariables } from "@utils/data/database";
import { DEFAULT_STORAGE, DefaultSetting } from "@utils/data/default-database";
import { executeMigrationScripts } from "@/context/migrations/migrations";

// biome-ignore lint/correctness/noUnusedFunctionParameters: Might only be temporary unused.
export async function migrateDatabase(force = false): Promise<void> {
	try {
		const loadedStorage = await ttStorage.get();

		if (!loadedStorage || !Object.keys(loadedStorage).length) {
			console.log("TT - Fresh installation detected, setting up default storage.");
			await ttStorage.reset();
			await loadDatabase();
			return;
		}

		const storedVersion = loadedStorage?.version?.current || "5.0.0";
		const currentVersion = browser.runtime.getManifest().version;

		console.log(`TT - Migration check: ${storedVersion} -> ${currentVersion}`);

		// if (!force && toNumericVersion(storedVersion) >= toNumericVersion(currentVersion)) {
		// 	console.log("TT - No migration needed, using existing storage.");
		// 	populateDatabaseVariables(loadedStorage);
		// 	return;
		// }

		const migratedStorage = convertStorage<Database>(loadedStorage, DEFAULT_STORAGE);
		await executeMigrationScripts(migratedStorage, loadedStorage);

		migratedStorage.version.current = currentVersion;

		await ttStorage.set(migratedStorage);

		populateDatabaseVariables(migratedStorage);

		console.log("TT - Database migration completed successfully.");
	} catch (error) {
		console.error("TT - Database migration failed:", error);
		await loadDatabase();
	}
}

function convertStorage<T = any>(oldStorage: any, defaultStorage: any): T {
	const newStorage: any = {};

	for (const key in defaultStorage) {
		if (!oldStorage) oldStorage = {};
		if (!(key in oldStorage)) oldStorage[key] = {};

		const defaultValue = defaultStorage[key];
		if (typeof defaultValue === "object" && defaultValue !== null) {
			if (defaultValue instanceof DefaultSetting) {
				newStorage[key] = migrateDefaultSetting(oldStorage[key], defaultValue);
			} else {
				newStorage[key] = convertStorage(oldStorage[key], defaultValue);
			}
		} else {
			newStorage[key] = oldStorage[key] ?? defaultValue;
		}
	}

	return newStorage;
}

function migrateDefaultSetting(oldValue: any, setting: DefaultSetting<any>): any {
	if (isValidSettingValue(oldValue, setting)) {
		return oldValue;
	}

	if (setting.defaultValue) {
		return typeof setting.defaultValue === "function" ? setting.defaultValue() : setting.defaultValue;
	}

	return null;
}

function isValidSettingValue(value: any, setting: DefaultSetting<any>): boolean {
	if (setting.type === "array") {
		return Array.isArray(value);
	}

	const validTypes = setting.type.split("|");
	return validTypes.some((type) => (type === "empty" && value === "") || typeof value === type);
}
