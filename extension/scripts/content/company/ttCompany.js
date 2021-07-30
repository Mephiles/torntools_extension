"use strict";

const isOwnCompany = location.pathname === "/companies.php";

window.addEventListener("hashchange", () => {
	if (getHashParameters().get("option") === "employees") triggerCustomListener(EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE);
});
