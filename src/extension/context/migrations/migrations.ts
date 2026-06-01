import type { SavedCustomLink } from "@features/custom-links/custom-links";
import type { UserAlias } from "@features/user-alias/alias";
import type { Database } from "@utils/data/database";
import { toNumericVersion } from "@utils/functions/utilities";

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
	{
		id: "360b1f70-c78b-44c1-b217-24bd6b398bac",
		version: "9.0.5",
		execute(database, _flags, oldStorage) {
			if (!oldStorage?.settings?.userAlias || Array.isArray(oldStorage.settings.userAlias)) return;

			const oldUserAliases: Record<string, { name: string; alias: string }> = oldStorage.settings.userAlias;

			database.settings.userAlias = Object.entries(oldUserAliases).map<UserAlias>(([id, { alias, name }]) => {
				const idMatch = id.match(/^(\d+)$/);

				return idMatch ? { userId: parseInt(idMatch[0]), userName: name, alias: alias } : { userId: -1, userName: name, alias: alias, incorrectId: id };
			});
		},
	},
	{
		id: "95c020eb-2c75-4bbe-8fe9-64f96f108f48",
		version: "9.0.5",
		execute(database, _flags, oldStorage) {
			if (!oldStorage?.settings?.pages?.popup?.defaultTab) return;

			if (oldStorage.settings.pages.popup.defaultTab === "stocks") {
				database.settings.pages.popup.defaultTab = "stocksOverview";
			} else if (oldStorage.settings.pages.popup.defaultTab === "market") {
				database.settings.pages.popup.defaultTab = "marketSearch";
			}
		},
	},
	{
		id: "96356911-fecd-4b79-9825-ee5ad422c8fe",
		version: "9.0.5",
		execute(database, _flags, oldStorage) {
			if (typeof oldStorage?.settings?.pages?.popup.hoverBarTime !== "boolean") return;

			database.settings.pages.popup.fullBarTime = oldStorage.settings.pages.popup.hoverBarTime;
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
