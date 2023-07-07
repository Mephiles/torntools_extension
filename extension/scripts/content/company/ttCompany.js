"use strict";

const isOwnCompany = location.pathname === "/companies.php";

if (!isOwnCompany) {
	requireElement(".content #mainContainer .employees-wrap").then(() => {
		new MutationObserver(async (mutations) => {
			if (
				!(mutations.length > 1) ||
				(isOwnCompany && getHashParameters().get("option") !== "employees") ||
				!mutations.some(
					(mutation) =>
						mutation.addedNodes &&
						mutation.addedNodes.length &&
						[...mutation.addedNodes].some((node) => node.classList && node.classList.contains("employees-wrap")),
				)
			)
				return;

			triggerCustomListener(EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE);
		}).observe(document.find(".content #mainContainer .content-wrapper"), { childList: true });
	});
} else {
	window.addEventListener("hashchange", () => {
		if (getHashParameters().get("option") === "employees") triggerCustomListener(EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE);
		else if (getHashParameters().get("option") === "stock") triggerCustomListener(EVENT_CHANNELS.COMPANY_STOCK_PAGE);
	});
}
