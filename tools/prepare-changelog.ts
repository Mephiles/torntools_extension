import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = fileURLToPath(new URL("..", import.meta.url));
const CHANGELOG_PATH = new URL("../src/extension/assets/changelog.json", import.meta.url);
const PACKAGE_PATH = new URL("../package.json", import.meta.url);

type Log = { message: string | string[]; contributor?: string };
type Entry = {
	version: { major: number; minor: number; build: number };
	title?: string;
	date: false | string;
	logs: Record<string, Log[]>;
};

export function prepareChangelog(changelog: Entry[], currentVersion: string, date: string) {
	const [major, minor, build] = currentVersion.split(".").map(Number);
	const latest = changelog[0];

	latest.date = date;
	if (latest.title === "Beta") delete latest.title;
	for (const [section, logs] of Object.entries(latest.logs)) if (!logs.length) delete latest.logs[section];

	changelog.unshift({
		version: { major, minor, build: build + 1 },
		title: "Beta",
		date: false,
		logs: { features: [], fixes: [], changes: [], removed: [], technical: [] },
	});

	return changelog;
}

function write(changelog: Entry[]) {
	writeFileSync(CHANGELOG_PATH, JSON.stringify(changelog) + "\n");
	execFileSync("bun", ["oxfmt", fileURLToPath(CHANGELOG_PATH)], { cwd: REPOSITORY_ROOT });
}

if (import.meta.main) {
	const changelog = JSON.parse(readFileSync(CHANGELOG_PATH, "utf8")) as Entry[];
	const { version } = JSON.parse(readFileSync(PACKAGE_PATH, "utf8")) as { version: string };

	write(prepareChangelog(changelog, version, new Date().toISOString().slice(0, 10).replaceAll("-", "/")));

	const [major, minor, build] = version.split(".").map(Number);
	console.log(`${major}.${minor}.${build + 1}`);
}
