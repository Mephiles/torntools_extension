"use strict";

(async () => {
	addFetchListener(
		async ({
			detail: {
				page,
				json,
				fetch: { url },
			},
		}) => {
			try {
				const params = new URL(url).searchParams,
					sid = params.get("sid"),
					step = params.get("step");

				// If Crimes 2 home page is loaded, trigger that.
				if (page === "page" && sid === "crimesData" && step === "hub") {
					triggerCustomListener(EVENT_CHANNELS.CRIMES2_HOME_LOADED, null);
					return;
				}

				// If not doing a Crimes 2 statuses list or attempt call, return.
				if (!(page === "page" && sid === "crimesData" && ["crimesList", "attempt"].includes(step))) return;

				// If any new crime needs a filter, add it here and in listeners.js.
				const CRIMES_MAPPING = {
					burglary: CRIMES2.BURGLARY,
				};

				const crime =
					Object.entries(CRIMES_MAPPING)
						.filter(([hash]) => window.location.hash.includes(hash))
						.map(([, name]) => name)
						.find(() => true) ?? CRIMES2.__UNKNOWN__;

				triggerCustomListener(EVENT_CHANNELS.CRIMES2_CRIME_LOADED, {
					crime,
					crimeRoot: await requireElement(".crime-root"),
					page,
					url,
					json,
				});
			} catch (err) {
				console.log("[TornTools] error during Crimes 2.0 listener trigger:", err);
			}
		}
	);
})();

const CRIMES2 = {
	__UNKNOWN__: "__UNKNOWN__",
	BURGLARY: "burglary",
};
