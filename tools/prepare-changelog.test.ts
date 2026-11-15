import { describe, expect, it } from "bun:test";
import { prepareChangelog } from "./prepare-changelog";

describe("prepareChangelog", () => {
	it("closes off the beta entry and prepends an entry for the next version", () => {
		const changelog = prepareChangelog(
			[
				{
					version: { major: 9, minor: 4, build: 1 },
					title: "Beta",
					date: false,
					logs: { features: [{ message: "Feature.", contributor: "x" }], fixes: [] },
				},
				{ version: { major: 9, minor: 4, build: 0 }, date: "2026/11/13", logs: { fixes: [] } },
			],
			"9.4.1",
			"2026/11/14",
		);

		expect(changelog).toEqual([
			{
				version: { major: 9, minor: 4, build: 2 },
				title: "Beta",
				date: false,
				logs: { features: [], fixes: [], changes: [], removed: [], technical: [] },
			},
			{ version: { major: 9, minor: 4, build: 1 }, date: "2026/11/14", logs: { features: [{ message: "Feature.", contributor: "x" }] } },
			{ version: { major: 9, minor: 4, build: 0 }, date: "2026/11/13", logs: { fixes: [] } },
		]);
	});
});
