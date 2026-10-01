// noinspection JSUnusedGlobalSymbols

import type { Database } from "@common/utils/data/database";

/**
 * Userscript builds alias `@common/utils/data/migrations` to this module so the
 * migration scripts are not bundled (they are never executed in userscripts).
 */
export function executeMigrationScripts(_storage: Database, _oldStorage: unknown): Promise<void> {
	return Promise.resolve();
}

export interface StoredMigration {
	id: string;
}
