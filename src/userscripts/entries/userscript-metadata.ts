export interface UserscriptMetadata {
	name: string;
	description: string;
	version: string;
	matches: string[];
	runAt: "document-start" | "document-body" | "document-end" | "document-idle";
}
