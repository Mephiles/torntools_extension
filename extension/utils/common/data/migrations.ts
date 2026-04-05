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

export const MIGRATIONS: MigrationScript[] = [];
