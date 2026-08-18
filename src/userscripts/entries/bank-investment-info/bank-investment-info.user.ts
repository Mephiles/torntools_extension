import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { millisToNewDay } from "@common/utils/functions/torn";
import BankInvestmentInfoFeature from "@features/bank-investment-info/bank-investment-info";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { requiresAPIKey } from "@userscripts/runtime/script-fetch";
import type { TornBankResponse } from "tornapi-typescript";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_bii");
	registerNetworkUserscriptContext();

	const key = await requiresAPIKey();

	await preFetchBankData(key);

	FEATURE_MANAGER.registerFeature(new BankInvestmentInfoFeature());
})();

async function preFetchBankData(key: string) {
	const cached = ttCache.get("bank-interest-v2");
	if (cached) return;

	const data = await fetchData<TornBankResponse>("tornv2", {
		section: "torn",
		selections: ["bank"],
		key: key,
		includeKey: true,
	});

	ttCache.set({ "bank-interest-v2": data.bank }, millisToNewDay());
}
