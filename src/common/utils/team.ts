type CoreTeamMember = {
	name: string;
	title: string | string[];
	torn: number | null;
	color: string;
	donations?: { name: string; link: string }[];
};

export const CORE_TEAM: CoreTeamMember[] = [
	{
		name: "Mephiles",
		title: "Creator",
		torn: 2087524,
		color: "green",
		donations: [
			{
				name: "PayPal",
				link: "https://paypal.me/gkaljulaid",
			},
		],
	},
	{
		name: "DeKleineKobini",
		title: "Core Maintainer",
		torn: 2114440,
		color: "orange",
		donations: [
			{
				name: "PayPal",
				link: "https://paypal.me/kkobini",
			},
			{
				name: "Buy Me a Coffee",
				link: "https://www.buymeacoffee.com/dekleinekobini",
			},
		],
	},
	{
		name: "TheFoxMan",
		title: "Developer",
		torn: 1936821,
		color: "greenyellow",
	},
	{
		name: "Allo",
		title: "Community Admin",
		torn: 2316070,
		color: "royalblue",
	},
	{
		name: "zachwozn",
		title: "Safari port Maintainer",
		torn: 2301700,
		color: "#236e00",
	},
];

/**
 * Non-core contributors, mapping their changelog name to their Torn ID.
 *
 * Add yourself here with a single line, keeping the list alphabetically sorted. The name has to match the
 * `contributor` value used in `src/extension/assets/changelog.json` exactly.
 */
export const CONTRIBUTORS: Record<string, number | null> = {
	Acarya: 2243227,
	aHunterGatherer: 2657909,
	Aida: 4294353,
	AllMight: 1878147,
	Anti0815: 2793691,
	Callz: 2188704,
	Conrado: 2631918,
	"dat-mule": 2043166,
	EazzyPeazzy: 2708376,
	Ech01337: 4270007,
	finally: 2060206,
	Fogest: 2254826,
	h4xnoodle: 2315090,
	Hashibee: 2303184,
	"hvr-lust": null,
	jensim: null,
	josephting: 2272298,
	Jubaka: 2933938,
	kontamusse: 2408039,
	Kwack: 2190604,
	Lazerpent: 2112641,
	LePluB: 2890448,
	luke__: 3720006,
	Manuel: 3747263,
	MOBermejo: 3385879,
	"mystify-321": 3737350,
	nao: 2669774,
	Natty_Boh: 1651049,
	No1IrishStig: 2648238,
	ORAN: 1778676,
	Phoenix: 85185,
	RogerFar: 4166912,
	"SAY-5": null,
	Simpsons: 247677,
	smikula: null,
	StaticFree: 711045,
	Taznister: 3770016,
	Tesa: 2639608,
	ThtAstronautGuy: 1977683,
	tiksan: 2383326,
	TravisTheTechie: 3549588,
	vALT0r: 767373,
	Vrasp: 2627614,
	Weav3r: 1853324,
	Will: 2057823,
	WizardRubic: null,
	wootty2000: 2344687,
	XDeltaA77: 1892226,
	xentac: 3354782,
	xhang98: 2153760,
};

/**
 * Fixed palette used to color non-core contributors in the changelog.
 * A color is assigned to a contributor for a single version, in order of appearance.
 */
export const CONTRIBUTOR_COLORS: string[] = [
	"#ff3333",
	"cornflowerblue",
	"mediumpurple",
	"#58e4e4",
	"deeppink",
	"#ff6b35",
	"steelblue",
	"springgreen",
	"#ff9ec6",
	"#0d9488",
	"mediumblue",
	"#a6279b",
	"#fbff09",
	"firebrick",
];

export interface ContributorInfo {
	id: number | null;
	name: string;
	core: boolean;
	color?: string;
}

const CORE_CONTRIBUTORS: Record<string, ContributorInfo> = CORE_TEAM.reduce<Record<string, ContributorInfo>>((contributors, member) => {
	contributors[member.name] = { id: member.torn, name: member.name, core: true, color: member.color };
	return contributors;
}, {});

export function getContributor(name: string): ContributorInfo | undefined {
	return CORE_CONTRIBUTORS[name] ?? (name in CONTRIBUTORS ? { id: CONTRIBUTORS[name], name, core: false } : undefined);
}
