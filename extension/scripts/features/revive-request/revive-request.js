const __DEFAULT_REVIVE_REQUEST = {
	method: "POST",
	relay: true,
	silent: true,
	succeedOnError: true,
};

function __requestStigFormat(location, vendor) {
	return (id, name, country, faction, source) =>
		new Promise((resolve, reject) => {
			fetchData(location, {
				...__DEFAULT_REVIVE_REQUEST,
				section: "request",
				body: { tornid: id.toString(), username: name, source: source, vendor, type: "revive" },
			})
				.then((response) => {
					if (response.hasOwnProperty("contract")) {
						resolve({ response, contract: response["contract"] });
					} else {
						reject(response);
					}
				})
				.catch((reason) => reject(reason));
		});
}

const REVIVE_PROVIDERS = [
	{
		provider: "nuke",
		name: "Nuke",
		doRequest: (id, name, country, faction, source) =>
			new Promise((resolve, reject) => {
				fetchData("nukefamily", {
					...__DEFAULT_REVIVE_REQUEST,
					section: "api/revive-request",
					body: {
						torn_player_id: id,
						torn_player_name: name,
						torn_player_country: country,
						app_info: source,
					},
				})
					.then((response) => {
						if (response.success) resolve({ response });
						else reject(response);
					})
					.catch((reason) => reject(reason));
			}),
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		provider: "uhc",
		name: "UHC",
		doRequest: (id, name, country, faction, source) =>
			new Promise((resolve, reject) => {
				fetchData("uhc", {
					...__DEFAULT_REVIVE_REQUEST,
					section: "api/request",
					body: { userID: id, userName: name, factionName: faction, source },
				})
					.then((response) => {
						if (response.success) resolve({ response });
						else reject(response);
					})
					.catch((reason) => reject(reason));
			}),
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		provider: "imperium",
		name: "Imperium",
		doRequest: (id, name, country, faction, source) =>
			new Promise((resolve, reject) => {
				fetchData("imperium", {
					...__DEFAULT_REVIVE_REQUEST,
					section: "revive",
					body: { userID: id, userName: name, factionName: faction, source },
				})
					.then((response) => {
						if (response.success) resolve({ response });
						else reject(response);
					})
					.catch((reason) => reject(reason));
			}),
		price: {
			// TODO - Request new price.
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		provider: "wtf",
		name: "WTF",
		doRequest: (id, name, country, faction, source) =>
			new Promise((resolve, reject) => {
				fetchData("wtf", {
					...__DEFAULT_REVIVE_REQUEST,
					section: "wtfapi/revive",
					body: { userID: id, userName: name, Faction: faction, Country: country, requestChannel: source },
				})
					.then((response) => {
						if (response.success) resolve({ response });
						else reject(response);
					})
					.catch((reason) => reject(reason));
			}),
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		provider: "hela",
		name: "HeLa",
		doRequest: __requestStigFormat("hela", "HeLa"),
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		provider: "shadow_healers",
		name: "Shadow Healers",
		doRequest: __requestStigFormat("shadow_healers", "Shadow Healers"),
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		provider: "who",
		name: "The Wolverines",
		doRequest: __requestStigFormat("who", "The Wolverines"),
		price: {
			money: 1_000_000,
			xanax: 1,
		},
	},
];

function doRequestRevive(id, name, country, faction) {
	const source = `TornTools v${chrome.runtime.getManifest().version}`;

	const providerName = settings.pages.global.reviveProvider || "";
	const provider = REVIVE_PROVIDERS.find((p) => p.provider === providerName);
	if (!provider) throw new Error(`Revive provider '${providerName}' not found.`);

	return provider
		.doRequest(id, name, country, faction, source)
		.then(({ response, contract }) => ({ response, contract, provider }))
		.catch((response) => ({ response, provider }));
}
