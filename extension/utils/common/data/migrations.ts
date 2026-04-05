import type { Database } from "@/utils/common/data/database";

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
}

export const MIGRATIONS: MigrationScript[] = [
	{
		id: "9da14c73-0145-4b1d-90e3-0363a5b57499",
		version: "9.0.0",
		execute(_database, flags, _oldStorage) {
			flags.updateUserdata = true;
		},
	},
];
