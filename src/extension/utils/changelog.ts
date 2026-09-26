import { daySuffix } from "@common/utils/functions/formatting";
import { MONTHS } from "@common/utils/functions/utilities";
import { CONTRIBUTOR_COLORS, CONTRIBUTORS } from "@common/utils/team";
import changelog from "@/assets/changelog.json";

export type ChangelogEntry = {
	version: { major: number; minor: number; build: number };
	title?: string;
	date: false | Date;
	logs: {
		[section: string]: { message: string | string[]; contributor?: string }[];
	};
};

export function readableChangelog() {
	return changelog.map((entry) => {
		const log = {
			...entry,
			date: false,
		} as unknown as ChangelogEntry;

		// Convert the date to something usable
		if (typeof entry.date === "string") {
			log.date = new Date(entry.date);
		}

		// Remove all empty log sections
		Object.entries(log.logs)
			.filter(([, logs]) => !logs.length)
			.forEach(([section]) => delete log.logs[section]);

		return log;
	});
}

export interface DisplayableChangelogEntry {
	version: string;
	title: string;
	beta: boolean;
	contributors: Contributor[];
	logs: Record<string, DisplayableLog[]>;
}

export interface Contributor {
	key: string;
	id?: number | null;
	name: string;
	color: string;
}

export interface DisplayableLog {
	html: string;
	color: string;
}

const DEFAULT_CONTRIBUTOR_COLOR = "gray";

export function buildContributors(names: string[]): Contributor[] {
	const nonCoreNames = names.filter((name) => !isCoreContributor(name));

	return names.map<Contributor>((name) => {
		const info = CONTRIBUTORS[name];

		if (info?.core && info.color) {
			return { key: name, id: info.id, name: info.name, color: info.color };
		}

		return {
			key: name,
			id: info?.id ?? null,
			name: info?.name ?? name,
			color: CONTRIBUTOR_COLORS[nonCoreNames.indexOf(name) % CONTRIBUTOR_COLORS.length],
		};
	});
}

function isCoreContributor(name: string): boolean {
	return CONTRIBUTORS[name]?.core === true;
}

export function toDisplayableChangelogEntry(entry: ChangelogEntry): DisplayableChangelogEntry {
	const version = concatenateVersion(entry.version);

	const contributors = buildContributors(
		Object.values(entry.logs)
			.flat()
			.map((log) => (log as { message: string | string[]; contributor: string }).contributor)
			.filter((value, i, self) => !!value && self.indexOf(value) === i),
	);

	const logs = Object.entries(entry.logs)
		.map<[string, DisplayableLog[]]>(([section, logs]) => {
			const displayableLogs = logs.map<DisplayableLog>((log) => ({
				html: typeof log.message === "string" ? log.message : log.message.join("<br>"),
				color: contributors.find((c) => c.key === log.contributor)?.color ?? DEFAULT_CONTRIBUTOR_COLOR,
			}));

			return [section, displayableLogs];
		})
		.reduce(
			(obj, [section, logs]) => {
				obj[section] = logs;
				return obj;
			},
			{} as Record<string, DisplayableLog[]>,
		);

	return {
		version,
		title: buildTitle(version, entry.date, entry.title),
		beta: entry.title?.toLowerCase() === "beta",
		contributors,
		logs,
	};
}

function concatenateVersion(version: ChangelogEntry["version"]) {
	const parts: string[] = [];

	parts.push(`v${version.major}`, version.minor.toString());
	if (version.build) parts.push(version.build.toString());

	return parts.join(".");
}

function buildTitle(version: string, date: false | Date, title: string | undefined): string {
	const parts: string[] = [];

	parts.push(version);
	if (date) parts.push(`${MONTHS[date.getMonth()]}, ${daySuffix(date.getDate())} ${date.getFullYear()}`);
	if (title && title.toLowerCase() !== "beta") parts.push(title);

	return parts.join(" - ");
}
