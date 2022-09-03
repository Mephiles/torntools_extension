const TEAM = [
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
		title: "Developer",
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
		color: "#ff3333",
	},
	{
		name: "wootty2000",
		title: "Developer",
		core: false,
		torn: 2344687,
		color: "red",
	},
	{
		name: "finally",
		title: "Developer",
		core: false,
		torn: 2060206,
		color: "purple",
	},
	{
		name: "Fogest",
		title: "Developer",
		core: false,
		torn: 2254826,
		color: "chartreuse",
	},
	{
		name: "smikula",
		title: "Developer",
		core: false,
		// torn:
		color: "#fbff09",
	},
	{
		name: "kontamusse",
		title: "Developer",
		core: false,
		torn: 2408039,
		color: "#58e4e4",
	},
	{
		name: "Natty_Boh",
		title: "Developer",
		core: false,
		torn: 1651049,
		color: "blue",
	},
	{
		name: "h4xnoodle",
		title: "Developer",
		core: false,
		torn: 2315090,
		color: "teal",
	},
	{
		name: "Tesa",
		title: "Developer",
		core: false,
		torn: 2639608,
		color: "brown",
	},
	{
		name: "hvr-lust",
		title: "Developer",
		core: false,
		color: "darkkhaki",
	},
	{
		name: "ORAN",
		title: "Developer",
		core: false,
		torn: 1778676,
		color: "mediumpurple",
	},
	{
		name: "dat-mule",
		title: "Developer",
		core: false,
		torn: 2043166,
		color: "cornflowerblue",
	},
	{
		name: "josephting",
		title: "Developer",
		core: false,
		torn: 2272298,
		color: "maroon",
	},
	{
		name: "Lazerpent",
		title: "Developer",
		core: false,
		torn: 2112641,
		color: "#7E46DA",
	},
];

const CONTRIBUTORS = TEAM.filter(({ title, color }) => title.includes("Developer") || color).reduce(
	(object, { name, torn, color }) => ({ ...object, [name]: { id: torn, name, color } }),
	{}
);
