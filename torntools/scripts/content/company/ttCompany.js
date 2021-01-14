window.addEventListener("load", () => {
	console.log("TT - Company");

	switch (getHashParameters().get("option")) {
		case "employees":
			if (settings.pages.company.member_info) showUserInfo();
			break;
		default:
			break;
	}

	// Employees
	doc.find("ul.company-tabs>li[aria-controls='employees']").addEventListener("click", () => {
		companyContentLoaded("employees").then(() => {
			if (settings.pages.company.member_info) showUserInfo();
		});
	});
});

function companyContentLoaded(aria_controls) {
	return requireElement(`#${aria_controls} .ajax-placeholder:not(.hide)`, { invert: true });
}

function showUserInfo() {
	fetchApi_v2("torn", { section: "company" })
		.then((result) => {
			console.log("result", result);

			doc.find("#employees .employee-list").classList.add("tt-modified");

			for (let user of doc.findAll("#employees .employee-list>li")) {
				let user_id = user.getAttribute("data-user");

				let li = doc.new({ type: "li", class: "tt-user-info" });
				let inner_wrap = doc.new({ type: "div", class: "tt-user-info-inner-wrap" });
				let texts = [`Last action: ${result.company.employees[user_id].last_action.relative}`];

				for (let text of texts) {
					let div = doc.new({ type: "div", text: text });
					inner_wrap.appendChild(div);

					if (texts.indexOf(text) !== texts.length - 1) {
						let divider = doc.new({ type: "div", class: "tt-divider", text: "—" });
						inner_wrap.appendChild(divider);
					}
				}

				li.appendChild(inner_wrap);
				user.parentElement.insertBefore(li, user.nextElementSibling);

				// Activity notifications
				let checkpoints = settings.inactivity_alerts_company;
				for (let checkpoint of Object.keys(checkpoints).sort((a, b) => b - a)) {
					if (new Date() - new Date(result.company.employees[user_id].last_action.timestamp * 1000) >= parseInt(checkpoint)) {
						console.log(checkpoints[checkpoint]);
						user.style.backgroundColor = `${checkpoints[checkpoint]}`;
						break;
					}
				}
			}
		})
		.catch((err) => {
			console.log("ERROR", err);
		});
}
