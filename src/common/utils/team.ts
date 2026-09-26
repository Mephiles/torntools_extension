type TeamMember = {
	name: string;
	title: string | string[];
	torn: number | null;
} & ({ core: true; color: string; donations?: { name: string; link: string }[] } | { core: false });

export const TEAM: TeamMember[] = [
	{
		name: "Mephiles",
		title: ["Creator", "Developer"],
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
		title: "Maintainer / Developer",
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
		title: "Developer",
		core: false,
		torn: 1878147,
	},
	{
		name: "wootty2000",
		title: "Developer",
		core: false,
		torn: 2344687,
	},
	{
		name: "luke__",
		title: "Developer",
		core: false,
		torn: 3720006,
	},
	{
		name: "finally",
		title: "Developer",
		core: false,
		torn: 2060206,
	},
	{
		name: "Fogest",
		title: "Developer",
		core: false,
		torn: 2254826,
	},
	{
		name: "smikula",
		title: "Developer",
		core: false,
		torn: null,
	},
	{
		name: "kontamusse",
		title: "Developer",
		core: false,
		torn: 2408039,
	},
	{
		name: "Natty_Boh",
		title: "Developer",
		core: false,
		torn: 1651049,
	},
	{
		name: "h4xnoodle",
		title: "Developer",
		core: false,
		torn: 2315090,
	},
	{
		name: "Tesa",
		title: "Developer",
		core: false,
		torn: 2639608,
	},
	{
		name: "hvr-lust",
		title: "Developer",
		core: false,
		torn: null,
	},
	{
		name: "ORAN",
		title: "Developer",
		core: false,
		torn: 1778676,
	},
	{
		name: "dat-mule",
		title: "Developer",
		core: false,
		torn: 2043166,
	},
	{
		name: "josephting",
		title: "Developer",
		core: false,
		torn: 2272298,
	},
	{
		name: "Lazerpent",
		title: "Developer",
		core: false,
		torn: 2112641,
	},
	{
		name: "No1IrishStig",
		title: "Developer",
		core: false,
		torn: 2648238,
	},
	{
		name: "Acarya",
		title: "Developer",
		core: false,
		torn: 2243227,
	},
	{
		name: "Kwack",
		title: "Developer",
		core: false,
		torn: 2190604,
	},
	{
		name: "Conrado",
		title: "Developer",
		core: false,
		torn: 2631918,
	},
	{
		name: "Vrasp",
		title: "Developer",
		core: false,
		torn: 2627614,
	},
	{
		name: "Anti0815",
		title: "Developer",
		core: false,
		torn: 2793691,
	},
	{
		name: "LePluB",
		title: "Developer",
		core: false,
		torn: 2890448,
	},
	{
		name: "ThtAstronautGuy",
		title: "Developer",
		core: false,
		torn: 1977683,
	},
	{
		name: "zachwozn",
		title: "Developer",
		core: true,
		torn: 2301700,
		color: "#236e00",
	},
	{
		name: "nao",
		title: "Developer",
		core: false,
		torn: 2669774,
	},
	{
		name: "tiksan",
		title: "Developer",
		core: false,
		torn: 2383326,
	},
	{
		name: "TravisTheTechie",
		title: "Developer",
		core: false,
		torn: 3549588,
	},
	{
		name: "MOBermejo",
		title: "Developer",
		core: false,
		torn: 3385879,
	},
	{
		name: "Hashibee",
		title: "Developer",
		core: false,
		torn: 2303184,
	},
	{
		name: "Phoenix",
		title: "Developer",
		core: false,
		torn: 85185,
	},
	{
		name: "xentac",
		title: "Developer",
		core: false,
		torn: 3354782,
	},
	{
		name: "Weav3r",
		title: "Developer",
		core: false,
		torn: 1853324,
	},
	{
		name: "XDeltaA77",
		title: "Developer",
		core: false,
		torn: 1892226,
	},
	{
		name: "StaticFree",
		title: "Developer",
		core: false,
		torn: 711045,
	},
	{
		name: "EazzyPeazzy",
		title: "Developer",
		core: false,
		torn: 2708376,
	},
	{
		name: "vALT0r",
		title: "Developer",
		core: false,
		torn: 767373,
	},
	{
		name: "Simpsons",
		title: "Developer",
		core: false,
		torn: 247677,
	},
	{
		name: "Taznister",
		title: "Developer",
		core: false,
		torn: 3770016,
	},
	{
		name: "aHunterGatherer",
		title: "Developer",
		core: false,
		torn: 2657909,
	},
	{
		name: "Will",
		title: "Developer",
		core: false,
		torn: 2057823,
	},
	{
		name: "jensim",
		title: "Developer",
		core: false,
		torn: null,
	},
	{
		name: "mystify-321",
		title: "Developer",
		core: false,
		torn: 3737350,
	},
	{
		name: "RogerFar",
		title: "Developer",
		core: false,
		torn: 4166912,
	},
	{
		name: "Manuel",
		title: "Developer",
		core: false,
		torn: 3747263,
	},
	{
		name: "Ech01337",
		title: "Developer",
		core: false,
		torn: 4270007,
	},
	{
		name: "Aida",
		title: "Developer",
		core: false,
		torn: 4294353,
	},
	{
		name: "SAY-5",
		title: "Developer",
		core: false,
		torn: null,
	},
	{
		name: "Jubaka",
		title: "Developer",
		core: false,
		torn: 2933938,
	},
	{
		name: "Callz",
		title: "Developer",
		core: false,
		torn: 2188704,
	},
	{
		name: "xhang98",
		title: "Developer",
		core: false,
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
	object[member.name] = { id: member.torn, name: member.name, core: member.core, ...(member.core ? { color: member.color } : {}) };
	return object;
}, {});
