import { requireElement } from "@/utils/common/functions/requires";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { getHashParameters } from "@/utils/common/functions/dom";
import { isIntNumber, TO_MILLIS } from "@/utils/common/functions/utilities";
import { fetchData, hasAPIData } from "@/utils/common/functions/api";
import { ttCache } from "@/utils/common/data/cache";
import { userdata } from "@/utils/common/data/database";

export const isOwnCompany = location.pathname === "/companies.php";

export function setupCompanyPage() {
	if (!isOwnCompany) {
		requireElement(".content #mainContainer .employees-wrap").then(() => {
			new MutationObserver(async (mutations) => {
				if (
					!(mutations.length > 1) ||
					(isOwnCompany && getHashParameters().get("option") !== "employees") ||
					!mutations.some((mutation) =>
						Array.from(mutation.addedNodes)
							.filter((node: any) => node.nodeType === Node.ELEMENT_NODE)
							.some((node: any) => node.classList && node.classList.contains("employees-wrap"))
					)
				)
					return;

				triggerCustomListener(EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE);
			}).observe(document.querySelector(".content #mainContainer .content-wrapper"), { childList: true });
		});
	} else {
		window.addEventListener("hashchange", () => {
			if (getHashParameters().get("option") === "employees") triggerCustomListener(EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE);
			else if (getHashParameters().get("option") === "stock") triggerCustomListener(EVENT_CHANNELS.COMPANY_STOCK_PAGE);
		});
	}
}

export async function readCompanyDetails() {
	if (isOwnCompany && hasAPIData()) {
		if (userdata.job && "id" in userdata.job) return { id: userdata.job.id };

		const userID = userdata.profile.id;
		if (!userID) return null; // ID could not be found

		return { id: await getCompanyIDFromUser(userID) };
	}

	const params = getHashParameters();

	if (isIntNumber(params.get("ID"))) {
		return { id: parseInt(params.get("ID")) };
	}

	if (isIntNumber(params.get("userID")) && hasAPIData()) {
		return { id: await getCompanyIDFromUser(parseInt(params.get("userID"))) };
	}

	return null; // ID could not be found

	async function getCompanyIDFromUser(userID: number) {
		const cached = ttCache.get("company-id", userID);
		if (cached) return cached;

		const data = await fetchData("tornv2", { section: "user", selections: ["job"], id: userID });
		const companyID = data.job?.id;

		void ttCache.set({ [userID]: companyID }, TO_MILLIS.DAYS, "company-id");

		return companyID;
	}
}
