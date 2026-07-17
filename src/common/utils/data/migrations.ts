import { OFFLOAD_SERVICE, RUNTIME_INFORMATION, ttStorage } from "@common/utils/context";
import type { Database } from "@common/utils/data/database";
import type { FactionStakeoutEntry, StakeoutData, StoredUserdata } from "@common/utils/data/default-database";
import { toNumericVersion } from "@common/utils/functions/utilities";
import type { SavedCustomLink } from "@features/custom-links/custom-links";
import type { UserAlias } from "@features/user-alias/alias";

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
	updateStockdata: boolean;
	updateTorndata: boolean;
	clearCache: boolean;
}

export const MIGRATIONS: MigrationScript[] = [
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
	{
		id: "7396191c-35a9-4d92-905a-0e411f9a6823",
		version: "9.0.5",
		execute(_database, _flags, _oldStorage) {
			void ttStorage.remove("usage");
		},
	},
	{
		id: "d3e6e03a-698d-4df4-9062-4d3c9ce9d479",
		version: "9.0.5",
		execute(database, _flags, oldStorage) {
			if (!oldStorage?.filters?.travel?.categories?.includes("other")) return;

			database.filters.travel.categories = [...oldStorage.filters.travel.categories, "defensive"];
		},
	},
	{
		id: "700848e9-ee48-42ce-b8b1-893cb471cfe4",
		version: "9.0.6",
		execute(_database, flags, _oldStorage) {
			flags.clearCache = true;
		},
	},
	{
		id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
		version: "9.0.6",
		execute(database, _flags, oldStorage) {
			const oldStakeouts = oldStorage?.stakeouts;
			if (!oldStakeouts || typeof oldStakeouts !== "object") return;

			const reservedKeys = new Set(["order", "date", "list"]);
			const oldOrder: string[] = oldStakeouts.order ?? [];
			const list: StakeoutData[] = [];

			Object.entries(oldStakeouts)
				.filter((entry): boolean => !reservedKeys.has(entry[0]))
				.forEach(([id, data]) => {
					const orderIndex = oldOrder.indexOf(id);
					list.push({ ...(data as StakeoutData), id: parseInt(id), order: orderIndex !== -1 ? orderIndex : Date.now() });
				});

			database.stakeouts.list = list;
		},
	},
	{
		id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
		version: "9.0.6",
		execute(database, _flags, oldStorage) {
			const oldFactionStakeouts = oldStorage?.factionStakeouts;
			if (!oldFactionStakeouts || typeof oldFactionStakeouts !== "object") return;

			const reservedKeys = new Set(["date", "list"]);
			const list: FactionStakeoutEntry[] = [];

			Object.entries(oldFactionStakeouts)
				.filter((entry): boolean => !reservedKeys.has(entry[0]))
				.forEach(([id, data]) => {
					list.push({
						...(data as FactionStakeoutEntry),
						id: parseInt(id),
						order: Date.now(),
					});
				});

			database.factionStakeouts.list = list;
		},
	},
	{
		id: "16d7de5c-e9ad-4060-966e-49b4252301c5",
		version: "9.0.7",
		execute(_database, _flags, _oldStorage) {
			OFFLOAD_SERVICE.reinitializeTimers().catch(() => {});
		},
	},
	{
		id: "a1b8db49-f255-43fc-b3b8-dc82b8c072b1",
		version: "9.0.9",
		execute(database, _flags, oldStorage) {
			const owner: number = (oldStorage.userdata as StoredUserdata)?.profile?.id;
			if (!owner) return;

			database.api.torn.owner = owner;
		},
	},
	{
		id: "8a88db28-d02c-4b08-a672-bb73394b5ae4",
		version: "9.0.12",
		execute(_database, _flags, _oldStorage) {
			OFFLOAD_SERVICE.reinitializeTimers().catch(() => {});
		},
	},
	{
		id: "19384047-faaa-4894-a0bb-1695b964a125",
		version: "9.0.14",
		execute(_database, flags, _oldStorage) {
			flags.updateStockdata = true;
		},
	},
	{
		id: "b2102994-0920-4586-8259-0e5beedc7f13",
		version: "9.0.15",
		execute(database, _flags, oldStorage) {
			if (oldStorage.api.torn.owner) return;

			const owner: number = (oldStorage.userdata as StoredUserdata)?.profile?.id;
			if (!owner) return;

			database.api.torn.owner = owner;
		},
	},
	{
		id: "8f883a44-fa45-407b-bdc7-18c6982ab108",
		version: "9.0.15",
		execute(database, _flags, _oldStorage) {
			database.cache["stats-estimate"] = {};
		},
	},
	{
		id: "0e1534e5-a199-429b-9f6d-32eefeae66cd",
		version: "9.0.15",
		execute(_database, flags, _oldStorage) {
			flags.updateUserdata = true;
		},
	},
];

export async function executeMigrationScripts(storage: Database, oldStorage: any) {
	if (RUNTIME_INFORMATION.isUserscript()) return;

	const migrations = MIGRATIONS.filter(({ version }) => toNumericVersion(version) >= toNumericVersion(storage.version.initial)).filter(
		({ id }) => !storage.migrations.map(({ id }) => id).includes(id),
	);

	const flags: MigrationFlags = {
		updateUserdata: false,
		updateFactiondata: false,
		updateStockdata: false,
		updateTorndata: false,
		clearCache: false,
	};

	migrations.reverse().forEach((migration) => {
		migration.execute(storage, flags, oldStorage);
		storage.migrations.push({ id: migration.id });
	});

	if (flags.updateUserdata) storage.userdata.date = 0;
	if (flags.updateFactiondata) storage.factiondata.date = 0;
	if (flags.updateStockdata) storage.stockdata.date = 0;
	if (flags.updateTorndata) storage.torndata.date = 0;
	if (flags.clearCache) storage.cache = {};
}
