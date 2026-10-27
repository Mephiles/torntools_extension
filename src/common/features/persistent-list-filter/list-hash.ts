export const LIST_TYPES = ["friends", "enemies", "targets"] as const;
export type ListType = (typeof LIST_TYPES)[number];

export function getListFromHref(href: string, origin: string): ListType | null {
	let url: URL;
	try {
		url = new URL(href, origin);
	} catch {
		return null;
	}

	if (!url.pathname.endsWith("/page.php") || url.searchParams.get("sid") !== "list") return null;

	const type = url.searchParams.get("type");

	return LIST_TYPES.find((list) => list === type) ?? null;
}

/** A hash is ours when the link carries no hash at all, or exactly the one we stamped on it. */
export function isOwnHash(existing: string, stamped: string | undefined) {
	return existing === "" || existing === stamped;
}

export function captureHash(hash: string, initialLoad: boolean) {
	const normalised = hash.trim().replace(/^#/, "").trim().replace(/\/+$/, "");
	if (initialLoad && normalised === "") return null;

	return normalised;
}
