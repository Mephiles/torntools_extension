const __DEFAULT_REVIVE_REQUEST: Partial<FetchOptions> = {
	method: "POST",
	relay: true,
	silent: true,
	succeedOnError: true,
};

function __requestStigFormat(vendor: string): ReviveProviderRequester {
	return (id, name, _country, _faction, source) =>
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

interface ReviveProvider {
	provider: string;
	name: string;
	origin: string;
	doRequest: ReviveProviderRequester;
	cooldown?: number;
	price: {
		money: number;
		xanax: number;
	};
}

type ReviveProviderRequester = (id: string, name: string, country: string, faction: string, source: string) => Promise<any>;

const REVIVE_PROVIDERS: ReviveProvider[] = [
	{
		// Original Script: https://greasyfork.org/en/scripts/406516-central-hospital-revive-request
		provider: "nuke",
		name: "Nuke",
		origin: FETCH_PLATFORMS.nukefamily,
		doRequest: (id, name, country, _faction, source) =>
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
		// Original Script: https://greasyfork.org/en/scripts/412591-universal-healthcare-revives
		provider: "uhc",
		name: "UHC",
		origin: FETCH_PLATFORMS.uhc,
		doRequest: (id, name, _country, faction, source) =>
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
		// Original Script: https://greasyfork.org/en/scripts/452524-shadow-healers-revive-requests
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
		// Original Script: https://greasyfork.org/en/scripts/489851-the-wolverines-revive-requests
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
		// Original Script: https://greasyfork.org/en/scripts/476679-midnight-x-revive-requests
		provider: "midnight_x",
		name: "Midnight X",
		origin: FETCH_PLATFORMS.stig,
		doRequest: __requestStigFormat("Midnight X"),
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
	{
		// Original Script: https://greasyfork.org/en/scripts/536134-laekna-revive-request
		provider: "laekna",
		name: "Laekna",
		origin: FETCH_PLATFORMS.laekna,
		doRequest: (id, name, country, faction, source) => {
			return new Promise((resolve, reject) => {
				fetchData("laekna", {
					...__DEFAULT_REVIVE_REQUEST,
					section: "revive",
					body: { userID: id, userName: name, factionName: faction, travelLocation: country, source },
				})
					.then((response) => {
						if (response === "Posted") resolve({ response: {} });
						else reject(response);
					})
					.catch((reason) => reject(reason));
			});
		},
		cooldown: TO_MILLIS.MINUTES * 2,
		price: {
			money: 1_800_000,
			xanax: 2,
		},
	},
] as const;

interface ReviveResponse {
	response: unknown;
	contract: unknown;
	provider: ReviveProvider;
}

function doRequestRevive(id: string, name: string, country: string, faction: string) {
	const source = `TornTools v${chrome.runtime.getManifest().version}`;

	const providerName = settings.pages.global.reviveProvider || "";
	const provider = REVIVE_PROVIDERS.find((p) => p.provider === providerName);
	if (!provider) throw new Error(`Revive provider '${providerName}' not found.`);

	const hasCooldown = "cooldown" in provider;
	if (hasCooldown && ttCache.hasValue("cooldown", `revive-${provider.provider}`)) {
		return Promise.reject({ response: { code: "COOLDOWN" }, provider });
	}

	return new Promise<ReviveResponse>((resolve, reject) => {
		provider
			.doRequest(id, name, country, faction, source)
			.then(({ response, contract }) => {
				if (hasCooldown) {
					void ttCache.set({ [`revive-${provider.provider}`]: Date.now() }, provider.cooldown, "cooldown");
				}
				resolve({ response, contract, provider });
			})
			.catch((response) => reject({ response, provider }));
	});
}

function calculateRevivePrice({ price }: ReviveProvider) {
	const parts: string[] = [];

	if (price?.money) parts.push(formatNumber(price.money, { currency: true, shorten: 3 }));
	if (price?.xanax) parts.push(`${price.xanax} xan`);

	return parts.length > 0 ? parts.join(" or ") : "unknown";
}
