"use strict";

const __DEFAULT_REVIVE_REQUEST = {
	method: "POST",
	relay: true,
	silent: true,
	succeedOnError: true,
};

function __requestStigFormat(vendor) {
	return (id, name, country, faction, source) =>
		new Promise((resolve, reject) => {
			fetchData("stig", {
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
		origin: FETCH_PLATFORMS.nukefamily,
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
		origin: FETCH_PLATFORMS.uhc,
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
		origin: FETCH_PLATFORMS.imperium,
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
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		provider: "wtf",
		name: "WTF",
		origin: FETCH_PLATFORMS.wtf,
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
		origin: FETCH_PLATFORMS.stig,
		doRequest: __requestStigFormat("HeLa"),
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		provider: "shadow_healers",
		name: "Shadow Healers",
		origin: FETCH_PLATFORMS.stig,
		doRequest: __requestStigFormat("Shadow Healers"),
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		provider: "who",
		name: "The Wolverines",
		origin: FETCH_PLATFORMS.stig,
		doRequest: __requestStigFormat("The Wolverines"),
		price: {
			money: 1_000_000,
			xanax: 1,
		},
	},
	{
		provider: "midnight_x",
		name: "Midnight X",
		origin: FETCH_PLATFORMS.stig,
		doRequest: __requestStigFormat("Midnight X"),
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
];

function doRequestRevive(id, name, country, faction) {
	const source = `TornTools v${chrome.runtime.getManifest().version}`;

	const providerName = settings.pages.global.reviveProvider || "";
	const provider = REVIVE_PROVIDERS.find((p) => p.provider === providerName);
	if (!provider) throw new Error(`Revive provider '${providerName}' not found.`);

	return new Promise((resolve, reject) => {
		provider
			.doRequest(id, name, country, faction, source)
			.then(({ response, contract }) => resolve({ response, contract, provider }))
			.catch((response) => reject({ response, provider }));
	});
}

function calculateRevivePrice({ price }) {
	const parts = [];

	if (price?.money) parts.push(formatNumber(price.money, { currency: true, shorten: 3 }));
	if (price?.xanax) parts.push(`${price.xanax} xan`);

	return parts.length > 0 ? parts.join(" or ") : "unknown";
}
