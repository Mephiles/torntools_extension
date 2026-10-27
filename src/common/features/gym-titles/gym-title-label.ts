export interface GymTitleLabel {
	name: string;
	lines: string[];
}

const DETAIL_PATTERN = /(?:Membership cost|Energy usage)\s*[-:]\s*.+?(?:\.(?=\s|$)|(?=Membership cost|Energy usage)|$)/gi;
const TRAILING_SEPARATORS = /[\s.,;:]+$/;
const LEADING_SEPARATORS = /^[\s.,;:]+/;

export function parseGymTitleLabel(label: string): GymTitleLabel | null {
	const normalised = label.replaceAll(/\s+/g, " ").trim();
	if (!normalised) return null;

	const lines: string[] = [];
	const nameParts: string[] = [];
	let position = 0;

	for (const match of normalised.matchAll(DETAIL_PATTERN)) {
		lines.push(match[0].trim().replace(TRAILING_SEPARATORS, ""));
		nameParts.push(normalised.slice(position, match.index));
		position = match.index + match[0].length;
	}

	nameParts.push(normalised.slice(position));

	const name = nameParts.join(" ").replaceAll(/\s+/g, " ").replace(LEADING_SEPARATORS, "").replace(TRAILING_SEPARATORS, "");
	if (!name) return null;

	return { name, lines };
}

export interface GymTitleClasses {
	tooltip: string;
	name: string;
	info: string;
}

export function buildGymTitleHTML({ name, lines }: GymTitleLabel, classes: GymTitleClasses): string {
	const info = lines.length > 0 ? `<div class="${classes.info}">${lines.map((line) => `<p>${escapeHTML(line)}</p>`).join("")}</div>` : "";

	return `<div class="${classes.tooltip}"><div class="${classes.name}">${escapeHTML(name)}</div>${info}</div>`;
}

function escapeHTML(text: string): string {
	return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
