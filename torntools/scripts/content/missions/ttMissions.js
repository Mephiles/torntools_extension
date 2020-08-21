requireDatabase().then(() => {
	if (!settings.pages.missions.rewards) return;

	addXHRListener((event) => {
		const { page, xhr } = event.detail;
		if (page !== "loader") return;

		const params = new URLSearchParams(xhr.requestBody);
		if (params.get("sid") !== "missionsRewards") return;

		rewardsLoaded().then(showRewards);
	});

	rewardsLoaded().then(() => {
		console.log("TT - Missions");

		showRewards();
	});
});

function rewardsLoaded() {
	return new Promise((resolve) => {
		let checker = setInterval(() => {
			if (doc.find("ul.rewards-list li")) {
				resolve(true);
				return clearInterval(checker);
			}
		}, 100);
	});
}

function showRewards() {
	let user_points = parseInt(doc.find(".total-mission-points").innerText.replace(",", ""));
	let reward_items = doc.findAll(".rewards-list li");

	for (let item of reward_items) {
		let info = JSON.parse(item.getAttribute("data-ammo-info"));

		let price_points = info.points;

		// Show if user can buy
		let actions_wrap = item.find(".act-wrap");
		actions_wrap.style.boxSizing = "border-box";
		actions_wrap.style.borderColor = "black";
		actions_wrap.style.borderImage = "none";
		actions_wrap.style.borderTop = user_points < price_points ? "1px solid red" : "1px solid #2ef42e";

		if (info.basicType === "Ammo") {
			let wrapper = doc.new("div");

			const foundAmmo = findItemsInList(userdata.ammo, {
				size: info.title,
				type: info.ammoType,
			});
			const ammo = foundAmmo.length ? foundAmmo[0].quantity : 0;

			let divAlreadyOwned = doc.new({ type: "div", text: "Owned: ", class: "tt-total-value" });
			if (mobile) divAlreadyOwned.style.marginTop = "66px";
			let spanAlreadyOwned = doc.new("span");
			spanAlreadyOwned.innerText = `${numberWithCommas(ammo, false)}`;

			divAlreadyOwned.appendChild(spanAlreadyOwned);
			wrapper.appendChild(divAlreadyOwned);
			actions_wrap.insertBefore(wrapper, actions_wrap.find(".actions"));
		} else if (info.basicType === "Item") {
			let item_id = info.image;
			let quantity = info.amount;

			if (!item_id || typeof item_id == "string")
				continue;

			let market_price = itemlist.items[item_id].market_value;
			item.style.height = "160px";  // to fit value info

			// Show one item price
			let one_item_price = doc.new("span");
			one_item_price.innerText = `$${numberWithCommas(market_price)}`;
			one_item_price.setClass("tt-one-item-price");

			item.find(".img-wrap").appendChild(one_item_price);

			// Show total & point value
			let value_div = doc.new("div");

			let div_total_value = doc.new({ type: "div", text: "Total value: ", class: "tt-total-value" });
			if (mobile) div_total_value.style.marginTop = "66px";
			let span_total_value = doc.new("span");
			span_total_value.innerText = `$${numberWithCommas(quantity * market_price)}`;

			let div_point_value = doc.new("div");
			div_point_value.innerText = "Point value: ";
			div_point_value.setClass("tt-point-value");
			let span_point_value = doc.new("span");
			span_point_value.innerText = `$${numberWithCommas(((quantity * market_price) / price_points).toFixed())}`;

			div_total_value.appendChild(span_total_value);
			div_point_value.appendChild(span_point_value);
			value_div.appendChild(div_total_value);
			value_div.appendChild(div_point_value);
			actions_wrap.insertBefore(value_div, actions_wrap.find(".actions"));
		}
	}
}


