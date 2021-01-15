"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Companies - Loading script.");

	// storageListeners.settings.push(loadCompanies);
	// loadCompanies();
	loadCompaniesOnce();

	console.log("TT: Companies - Script loaded.");
})();

function loadCompanies() {}

function loadCompaniesOnce() {
	addXHRListener(async (event) => {
		const { page, json } = event.detail;

		if (page === "companies" && json) {
			if (json.result && json.result.msg) {
				if (json.result.msg.money) showMuggableCash(json).catch((error) => console.error("Couldn't show the muggable cash.", error));
			}
		}
	});
}

async function showMuggableCash(json) {
	if (!settings.pages.companies.specialMugMoney) return;

	const api = hasAPIData() && settings.apiUsage.user.merits;

	let percentageMin = 5;
	let percentageMax = 10;

	if (api) {
		const merits = 1 + userdata.merits["Masterful Looting"] * 0.05;
		percentageMin *= merits;
		percentageMax *= merits;

		const result = await fetchApi("torn", { section: "user", id: json.result.user.userID, selections: ["profile"], silent: true, succeedOnError: true });
		console.log("DKK company result", result, result.job.company_type === 5);
		if (result.job && result.job.company_type === 5) {
			const resultCompany = await fetchApi("torn", {
				section: "company",
				id: result.job.company_id,
				selections: ["profile"],
				silent: true,
				succeedOnError: true,
			});
			console.log("DKK company resultCompany", resultCompany, resultCompany.company.rating >= 7);
			if (resultCompany.company && resultCompany.company.rating >= 7) {
				console.log("DKK company 7* CLOTHING 1", { min: percentageMin, max: percentageMax });
				percentageMin /= 4;
				percentageMax /= 4;
				console.log("DKK company 7* CLOTHING 2", { min: percentageMin, max: percentageMax });
			}
		}
	}

	const cash = parseInt(json.result.msg.money.replaceAll(",", ""));

	const jobInfo = document.find(".job-info");
	jobInfo.appendChild(
		document.newElement({
			type: "li",
			text: `Potential mug${api ? "" : "*"}: $${formatNumber(cash * (percentageMin / 100), { decimals: 0 })} - $${formatNumber(
				cash * (percentageMax / 100),
				{ decimals: 0 }
			)}`,
		})
	);
	if (!api) jobInfo.appendChild(document.newElement({ type: "li", text: "* Might not be entirely accurate due to missing API information." }));
}
