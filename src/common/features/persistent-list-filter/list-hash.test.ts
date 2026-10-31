import { describe, expect, it } from "bun:test";
import { captureHash, getListFromHref, isOwnHash } from "./list-hash";

describe("getListFromHref", () => {
	const origin = "https://www.torn.com";

	it("recognises an absolute list URL", () => {
		expect(getListFromHref("https://www.torn.com/page.php?sid=list&type=targets", origin)).toBe("targets");
	});

	it("recognises a root-relative and a relative list URL", () => {
		expect(getListFromHref("/page.php?sid=list&type=friends", origin)).toBe("friends");
		expect(getListFromHref("page.php?sid=list&type=enemies", origin)).toBe("enemies");
	});

	it("ignores a hash on the URL", () => {
		expect(getListFromHref("/page.php?sid=list&type=friends#sort=level", origin)).toBe("friends");
	});

	it("ignores anything that is not one of the remembered lists", () => {
		expect(getListFromHref("https://www.torn.com/page.php?sid=list&type=userlist", origin)).toBeNull();
		expect(getListFromHref("https://www.torn.com/page.php?sid=ItemMarket", origin)).toBeNull();
		expect(getListFromHref("https://www.torn.com/index.php", origin)).toBeNull();
	});
});

describe("isOwnHash", () => {
	it("treats an absent hash as ours", () => {
		expect(isOwnHash("", undefined)).toBe(true);
	});

	it("treats the hash we stamped as ours", () => {
		expect(isOwnHash("sort=level", "sort=level")).toBe(true);
	});

	it("treats a hash the player added as theirs", () => {
		expect(isOwnHash("sort=level", undefined)).toBe(false);
		expect(isOwnHash("mine", "sort=level")).toBe(false);
	});
});

describe("captureHash", () => {
	it("remembers the hash verbatim, preserving order", () => {
		expect(captureHash("#sortDirection=desc&sort=level&status=okay", false)).toBe("sortDirection=desc&sort=level&status=okay");
	});

	it("strips the leading hash, whitespace and a trailing slash", () => {
		expect(captureHash("#sort=level&status=okay", false)).toBe("sort=level&status=okay");
		expect(captureHash("  #sort=level  ", false)).toBe("sort=level");
		expect(captureHash("#sort=level/", false)).toBe("sort=level");
	});

	it("remembers a hash found on the initial load", () => {
		expect(captureHash("#sort=level&status=okay", true)).toBe("sort=level&status=okay");
	});

	it("does not treat an empty hash on the initial load as cleared", () => {
		expect(captureHash("", true)).toBeNull();
		expect(captureHash("#", true)).toBeNull();
		expect(captureHash("#/", true)).toBeNull();
	});

	it("remembers a hash cleared after the page loaded", () => {
		expect(captureHash("", false)).toBe("");
		expect(captureHash("#", false)).toBe("");
		expect(captureHash("#/", false)).toBe("");
	});

	it("keeps a page offset as part of the remembered state", () => {
		expect(captureHash("#sort=level&start=25", false)).toBe("sort=level&start=25");
		expect(captureHash("#p=2&sort=level", true)).toBe("p=2&sort=level");
	});
});
