export type Changelog = ChangelogEntry[];

import type { Database } from "@/utils/common/data/database";

export type ChangelogEntry = {
	version: { major: number; minor: number; build: number };
	title?: string;
	date: false | Date;
	logs: {
		[section: string]: { message: string | string[]; contributor?: string }[];
	};
};

export type Contributor = {
	key: string;
	id?: number | null;
	name: string;
	color?: string;
};

export type ImportedChangelog = ImportedChangelogEntry[];

export type ImportedChangelogEntry = {
	version: { major: number; minor: number; build: number };
	title?: string;
	date?: false | string;
	logs: {
		[section: string]: { message: string | string[]; contributor?: string }[];
	};
};

export type ExportDatabaseKey = "version" | "settings" | "filters" | "stakeouts" | "notes" | "quick" | "api";

export type ExportDatabasePayload = Partial<Pick<Database, ExportDatabaseKey>>;

export interface ExportData {
	user: false | { id: number; name: string };
	client: {
		version: string;
		space: number;
	};
	date: string;
	database: ExportDatabasePayload;
}

export type RemoteSyncState =
	| {
			available: false;
			message: string;
	  }
	| {
			available: true;
			data: ExportData;
	  };

export const PREFERENCE_SECTION_IDS = [
	"general",
	"global",
	"api-usage",
	"api-key",
	"chat",
	"sidebar",
	"popup",
	"notifications",
	"external",
	"competition",
	"achievements",
	"no-confirm",
	"last-action",
	"stats-estimate",
	"user-alias",
	"ff-scouter",
	"home",
	"items",
	"city",
	"companies",
	"bazaar",
	"bounties",
	"gym",
	"properties",
	"education",
	"crimes",
	"crimes2",
	"missions",
	"userlist",
	"jail",
	"bank",
	"casino",
	"forums",
	"events",
	"faction",
	"profile",
	"stock-exchange",
	"travel",
	"trade",
	"display-case",
	"racing",
	"shops",
	"attack",
	"itemmarket",
	"museum",
	"api",
	"auction-house",
	"enemies",
	"friends",
	"targets",
] as const;

export type PreferenceSectionId = (typeof PREFERENCE_SECTION_IDS)[number];

export const PREFERENCE_GROUP_IDS = ["general", "interface", "notifications", "data-api", "integrations", "automation", "pages"] as const;

export type PreferenceGroupId = (typeof PREFERENCE_GROUP_IDS)[number];

export interface PreferenceGroupDefinition {
	id: PreferenceGroupId;
	title: string;
	description: string;
}

export interface PreferenceSubgroupDefinition {
	id: string;
	title: string;
	description: string;
	sections: PreferenceSectionId[];
}

export interface ExternalServiceKeyDraft {
	tornstats: string;
	yata: string;
	ffScouter: string;
}

export interface PreferenceDraftSnapshot {
	settings: Database["settings"];
	externalServiceKeys: ExternalServiceKeyDraft;
}

export interface ApiKeyFormState {
	value: string;
	busy: boolean;
}

export interface PreferenceSearchIndexEntry {
	id: string;
	kind: "field" | "header";
	label: string;
	section: PreferenceSectionId;
	targetId?: string;
	headerText?: string;
}

export interface PreferenceFieldOption {
	value: string;
	label: string;
	description?: string;
}

export interface PreferenceFieldDefinition {
	id: string;
	type: "toggle" | "text" | "number" | "select" | "radio";
	path: string[];
	label: string;
	description?: string;
	options?: PreferenceFieldOption[];
	min?: number;
	max?: number;
	step?: number;
	placeholder?: string;
	allowEmpty?: boolean;
}

export interface PreferenceSectionDefinition {
	id: PreferenceSectionId;
	title: string;
	category: "core" | "scripts" | "pages";
	description: string;
}
