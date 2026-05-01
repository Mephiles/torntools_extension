import type { SavedCustomLink } from "@/features/custom-links/custom-links";
import type { Database } from "@/utils/common/data/database";
import { toNumericVersion } from "@/utils/common/functions/utilities";

export interface StoredMigration {
	id: string;
}

export interface MigrationScript {
	id: string;
	version: string;
	execute: (database: Database, flags: MigrationFlags, oldStorage: any) => void;
}

export interface MigrationFlags {
	updateUserdata: boolean;
	updateFactiondata: boolean;
	updateTorndata: boolean;
	clearCache: boolean;
}

export const MIGRATIONS: MigrationScript[] = [
	{
		id: "9da14c73-0145-4b1d-90e3-0363a5b57499",
		version: "9.0.0",
		execute(_database, flags, _oldStorage) {
			flags.updateUserdata = true;
		},
	},
	{
		id: "43fae1f2-5568-4ae5-b12f-f3625e1e58c6",
		version: "9.0.0",
		execute(database, _flags, _oldStorage) {
			database.cache["personal-stats"] = {};
		},
	},
	{
		id: "b194a6d5-4230-4b03-8a8b-bebd7c431cc9",
		version: "9.0.0",
		execute(database, _flags, _oldStorage) {
			database.settings.pages.api.autoDemo = false;
		},
	},
	{
		id: "b0f539ba-41f8-4eed-93e2-e8523f7c49a5",
		version: "9.0.1",
		execute(database, _flags, oldStorage) {
			const oldCustomLinks: { href: string; location: string; name: string; newTab: boolean; preset: string }[] = oldStorage?.settings?.customLinks ?? [];

			database.settings.customLinks = oldCustomLinks.map<SavedCustomLink>((link) => {
				return link.preset && link.preset !== "custom"
					? {
							newTab: link.newTab,
							location: link.location,
							name: link.name,
							preset: link.preset,
						}
					: {
							newTab: link.newTab,
							location: link.location,
							name: link.name,
							href: link.href,
						};
			});
		},
	},
];

export async function executeMigrationScripts(storage: Database, oldStorage: any) {
	const migrations = MIGRATIONS.filter(({ version }) => toNumericVersion(version) >= toNumericVersion(storage.version.initial)).filter(
		({ id }) => !storage.migrations.map(({ id }) => id).includes(id),
	);

	const flags: MigrationFlags = {
		updateUserdata: false,
		updateFactiondata: false,
		updateTorndata: false,
		clearCache: false,
	};

	migrations.reverse().filter((migration) => {
		migration.execute(storage, flags, oldStorage);
		storage.migrations.push({ id: migration.id });
	});

	if (flags.updateUserdata) storage.userdata.date = 0;
	if (flags.updateFactiondata) storage.factiondata.date = 0;
	if (flags.updateTorndata) storage.torndata.date = 0;
	if (flags.clearCache) storage.cache = {};
}
