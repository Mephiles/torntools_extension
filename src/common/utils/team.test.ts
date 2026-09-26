import { describe, expect, it } from "bun:test";
import { CONTRIBUTORS, CORE_TEAM, getContributor } from "@common/utils/team";
import changelog from "@/assets/changelog.json";

describe("team", () => {
	it("has unique Torn IDs across the core team and contributors", () => {
		const ids = [...CORE_TEAM.map((member) => member.torn), ...Object.values(CONTRIBUTORS)].filter((id): id is number => id !== null);

		expect(new Set(ids).size).toBe(ids.length);
	});

	it("resolves every contributor referenced in the changelog", () => {
		const entries = changelog as unknown as { logs: Record<string, { contributor?: string }[]> }[];
		const referenced = new Set<string>();

		for (const entry of entries) {
			for (const logs of Object.values(entry.logs)) {
				for (const log of logs) {
					if (log.contributor) referenced.add(log.contributor);
				}
			}
		}

		const unresolved = [...referenced].filter((name) => !getContributor(name));
		expect(unresolved).toEqual([]);
	});
});
