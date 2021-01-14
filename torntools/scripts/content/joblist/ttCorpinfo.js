requireDatabase().then(() => {
	console.log("TT - Corpinfo");

	requireElement(".content-wrapper .company-details").then(async () => {
		const companyDetailsCont = doc.find(".content-wrapper .company-details");
		let companyType;

		if (mobile) {
			companyType = doc.find(".details-wrap ul.info .m-title").innerText.trim();
		} else {
			companyType = doc.find(".details-wrap ul.info>li:nth-of-type(2)").innerText.replace("Type: ", "");
		}

		console.log(companyType);

		let html = ``;

		for (let special in COMPANY_INFORMATION[companyType]) {
			let name = COMPANY_INFORMATION[companyType][special].name;
			let cost = COMPANY_INFORMATION[companyType][special].cost;
			let effect = COMPANY_INFORMATION[companyType][special].effect;

			html += `
                <div class='tt-comp-info-wrap ${mobile ? "mobile" : ""}'>
                    <div class='heading'>${name} (${special}★)</div>
                    <div class='separator'></div>
                    <div class=''>${cost} ${cost === "Passive" ? "" : cost === "1" ? "job point" : "job points"}</div>
                    <div class='separator second'></div>
                    <div class=''>${effect}</div>
                </div>
            `;
		}

		content
			.newContainer("Company Info", {
				id: "ttCompinfo",
				adjacent_element: companyDetailsCont,
			})
			.find(".content").innerHTML = html;
	});
});
