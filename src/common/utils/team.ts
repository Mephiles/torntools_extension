type TeamMember = {
	name: string;
	torn: number | null;
} & ({ core: true; title: string | string[]; color: string; donations?: { name: string; link: string }[] } | {});

export const TEAM: TeamMember[] = [
	{
		name: "Mephiles",
		title: "Creator",
		core: true,
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
		core: true,
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
		core: true,
		torn: 1936821,
		color: "greenyellow",
	},
	{
		name: "Allo",
		title: "Community Admin",
		core: true,
		torn: 2316070,
		color: "royalblue",
	},
	{
		name: "AllMight",
		torn: 1878147,
	},
	{
		name: "wootty2000",
		torn: 2344687,
	},
	{
		name: "luke__",
		torn: 3720006,
	},
	{
		name: "finally",
		torn: 2060206,
	},
	{
		name: "Fogest",
		torn: 2254826,
	},
	{
		name: "smikula",
		torn: null,
	},
	{
		name: "kontamusse",
		torn: 2408039,
	},
	{
		name: "Natty_Boh",
		torn: 1651049,
	},
	{
		name: "h4xnoodle",
		torn: 2315090,
	},
	{
		name: "Tesa",
		torn: 2639608,
	},
	{
		name: "hvr-lust",
		torn: null,
	},
	{
		name: "ORAN",
		torn: 1778676,
	},
	{
		name: "dat-mule",
		torn: 2043166,
	},
	{
		name: "josephting",
		torn: 2272298,
	},
	{
		name: "Lazerpent",
		torn: 2112641,
	},
	{
		name: "No1IrishStig",
		torn: 2648238,
	},
	{
		name: "Acarya",
		torn: 2243227,
	},
	{
		name: "Kwack",
		torn: 2190604,
	},
	{
		name: "Conrado",
		torn: 2631918,
	},
	{
		name: "Vrasp",
		torn: 2627614,
	},
	{
		name: "Anti0815",
		torn: 2793691,
	},
	{
		name: "LePluB",
		torn: 2890448,
	},
	{
		name: "ThtAstronautGuy",
		torn: 1977683,
	},
	{
		name: "zachwozn",
		title: "Safari port Maintainer",
		core: true,
		torn: 2301700,
		color: "#236e00",
	},
	{
		name: "nao",
		torn: 2669774,
	},
	{
		name: "tiksan",
		torn: 2383326,
	},
	{
		name: "TravisTheTechie",
		torn: 3549588,
	},
	{
		name: "MOBermejo",
		torn: 3385879,
	},
	{
		name: "Hashibee",
		torn: 2303184,
	},
	{
		name: "Phoenix",
		torn: 85185,
	},
	{
		name: "xentac",
		torn: 3354782,
	},
	{
		name: "Weav3r",
		torn: 1853324,
	},
	{
		name: "XDeltaA77",
		torn: 1892226,
	},
	{
		name: "StaticFree",
		torn: 711045,
	},
	{
		name: "EazzyPeazzy",
		torn: 2708376,
	},
	{
		name: "vALT0r",
		torn: 767373,
	},
	{
		name: "Simpsons",
		torn: 247677,
	},
	{
		name: "Taznister",
		torn: 3770016,
	},
	{
		name: "aHunterGatherer",
		torn: 2657909,
	},
	{
		name: "Will",
		torn: 2057823,
	},
	{
		name: "jensim",
		torn: null,
	},
	{
		name: "mystify-321",
		torn: 3737350,
	},
	{
		name: "RogerFar",
		torn: 4166912,
	},
	{
		name: "Manuel",
		torn: 3747263,
	},
	{
		name: "Ech01337",
		torn: 4270007,
	},
	{
		name: "Aida",
		torn: 4294353,
	},
	{
		name: "SAY-5",
		torn: null,
	},
	{
		name: "Jubaka",
		torn: 2933938,
	},
	{
		name: "Callz",
		torn: 2188704,
	},
	{
		name: "xhang98",
		torn: 2153760,
	},
];

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

interface ContributorInfo {
	id: number | null;
	name: string;
	core: boolean;
	color?: string;
}

type ContributorMap = { [name: string]: ContributorInfo };

export const CONTRIBUTORS: ContributorMap = TEAM.reduce<ContributorMap>((object, member) => {
	object[member.name] = { id: member.torn, name: member.name, ...("core" in member ? { core: true, color: member.color } : { core: false }) };
	return object;
}, {});
