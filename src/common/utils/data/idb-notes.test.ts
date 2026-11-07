import { describe, expect, it } from "bun:test";
import { planNoteChanges, toNotes } from "./idb-notes";

const sidebar = { text: "sidebar", height: "22px" };

describe("Notes storage", () => {
	it("stores each note under its own key", () => {
		const notes = { sidebar, profile: { "1": { text: "a", height: "17px" }, "2": { text: "b", height: "17px" } } };

		const { updates, removals } = planNoteChanges([], notes);

		expect(removals).toEqual([]);
		expect(updates).toEqual([
			{ key: "sidebar", notes: sidebar },
			{ key: "profile:1", notes: { text: "a", height: "17px" } },
			{ key: "profile:2", notes: { text: "b", height: "17px" } },
		]);
	});

	it("only writes changed notes and removes deleted ones", () => {
		const { updates, removals } = planNoteChanges(
			[
				{ key: "sidebar", notes: sidebar },
				{ key: "profile:1", notes: { text: "a", height: "17px" } },
				{ key: "profile:2", notes: { text: "b", height: "17px" } },
			],
			{ sidebar, profile: { "1": { text: "changed", height: "17px" } } },
		);

		expect(updates).toEqual([{ key: "profile:1", notes: { text: "changed", height: "17px" } }]);
		expect(removals).toEqual(["profile:2"]);
	});

	it("round-trips notes through stored entries", () => {
		const notes = { sidebar, profile: { "42": { text: "hello", height: "30px" } } };

		expect(toNotes(planNoteChanges([], notes).updates)).toEqual(notes);
	});
});
