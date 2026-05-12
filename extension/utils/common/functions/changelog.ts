import changelog from "@/assets/changelog.json";
import { daySuffix } from "@/utils/common/functions/formatting";
import { MONTHS } from "@/utils/common/functions/utilities";
import { CONTRIBUTORS } from "@/utils/common/team";

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
		const log: ChangelogEntry = {
			...entry,
			date: false,
		};

		// Convert the date to something usable
		if (typeof entry.date === "string") {
			log.date = new Date(entry.date);
		}

		// Remove all empty log sections
		Object.entries(entry.logs)
			.filter(([, logs]) => !logs.length)
			.forEach(([section]) => delete entry.logs[section]);

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

export function toDisplayableChangelogEntry(entry: ChangelogEntry): DisplayableChangelogEntry {
	const version = concatenateVersion(entry.version);

	const contributors = Object.values(entry.logs)
		.flat()
		.map((log) => (log as { message: string | string[]; contributor: string }).contributor)
		.filter((value, i, self) => !!value && self.indexOf(value) === i)
		.map<Contributor>((contributor) => {
			if (contributor in CONTRIBUTORS) {
				return {
					key: contributor,
					...CONTRIBUTORS[contributor],
				};
			} else {
				return {
					key: contributor,
					name: contributor,
					color: DEFAULT_CONTRIBUTOR_COLOR,
				};
			}
		});

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

	parts.push(`v${version.major}`);
	parts.push(version.minor.toString());
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
