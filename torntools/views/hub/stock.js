window.onload = () => {
	init();
};

function init() {
	chrome.storage.local.get(["torndata", "userdata", "api_system"], (data) => {
		const torn_stocks = data.torndata.stocks;
		const user_stocks = data.userdata.stocks;

		if (!data["api_system"]["online"]) {
			document.getElementById("error").innerText = data.api_system.error;
		}

		displayStocks(torn_stocks, user_stocks, data.torndata.date);
	});
}

function displayStocks(torn_stocks, user_stocks, date) {
	const stock_list = document.querySelector("#stock-list");

	document.querySelector("#last-updated").innerText = "Last updated: " + timeAgo(date);

	for (let id in torn_stocks) {
		let stock = torn_stocks[id];
		let user = false;

		// elements
		const li = document.createElement("li");
		const div_name = document.createElement("div");
		const div_price = document.createElement("div");
		const div_more = document.createElement("div");
		const div_more_available_shares = document.createElement("div");
		const i = document.createElement("i");

		// content
		div_name.innerText = stock["name"];
		div_price.innerText = "$" + numberWithCommas(stock["current_price"]);
		div_more_available_shares.innerText = numberWithCommas(stock["available_shares"]);

		// classes & ids
		div_name.setAttribute("class", "name");
		div_price.setAttribute("class", "price");
		div_more.setAttribute("class", "more");
		div_more_available_shares.setAttribute("class", "available-shares");
		i.setAttribute("class", "open fas fa-sort-down");
		li.setAttribute("class", "stock");

		// special
		i.addEventListener("click", () => {
			toggleSlide(div_more);
		});

		for (let _id in user_stocks) {
			if (user_stocks[_id].stock_id === id) {
				li.classList.add("user");
				user = true;
			}
		}

		// append
		li.appendChild(div_name);
		li.appendChild(div_price);
		li.appendChild(i);

		div_more.appendChild(div_more_available_shares);

		if (!user) {
			stock_list.appendChild(li);
			stock_list.appendChild(div_more);
		} else {
			let first_el = [...stock_list.children][0];
			stock_list.insertBefore(li, first_el);
			stock_list.insertBefore(div_more, first_el);
		}
		// let id = user_stocks[stock]["stock_id"];
		// let shares = parseInt(user_stocks[stock]["shares"]);
		// let buy_price = parseFloat(user_stocks[stock]["bought_price"]).toFixed(3);

		// let name = torn_stocks[id]["name"];
		// let current_price = parseFloat(torn_stocks[id]["current_price"]).toFixed(3);
		// let profit = (current_price - buy_price).toFixed(3);
		// let profit_total = (profit * shares).toFixed(0);

		// const mystocks_container = document.querySelector("#mystocks-container");
		// let mc = mystocks_container;

		// let li = document.createElement("li");
		// let heading = document.createElement("h3");
		// let shares_p = document.createElement("p");
		// let buy_price_p = document.createElement("p");
		// let current_price_p = document.createElement("p");
		// let profit_p = document.createElement("p");
		// let profit_total_span = document.createElement("span");
		// let hr = document.createElement("hr");

		// heading.innerText = name;
		// profit_total_span.innerText = `total profit: $${numberWithCommas(profit_total)}`;
		// profit_total_span.classList.add("profit-total");
		// if(profit_total <= 0){
		// 	profit_total_span.classList.add("negative-profit");
		// } else {
		// 	profit_total_span.classList.add("positive-profit");
		// }

		// shares_p.innerText = `Shares: ${numberWithCommas(shares)}`;
		// buy_price_p.innerText = `Buy price: $${numberWithCommas(buy_price)}`;
		// current_price_p.innerText = `Current price: $${numberWithCommas(current_price)}`;
		// profit_p.innerText = `Profit: $${profit}/share`;

		// heading.appendChild(profit_total_span);
		// li.appendChild(heading);
		// li.appendChild(shares_p);
		// li.appendChild(buy_price_p);
		// li.appendChild(current_price_p);
		// li.appendChild(profit_p);

		// mc.appendChild(li);
		// mc.appendChild(hr);
	}
}

function toggleSlide(el) {
	console.log("HERE");
	let directionDown; // down || up
	let height = parseInt(el.style.height); // 0 || 200
	let step = 3;
	let height_max = 120;

	directionDown = height !== height_max;

	let progress = 0;

	if (!directionDown) progress = height_max;

	let slider = setInterval(() => {
		console.log("MOVING");
		if (directionDown) {
			if (progress < height_max) {
				progress += step;
				el.style.height = (progress <= height_max ? progress : height_max) + "px";
			} else {
				console.log("DONE GOING DOWN");
				clearInterval(slider);
			}
		} else {
			if (progress > 0) {
				progress -= step;
				el.style.height = (progress >= 0 ? progress : 0) + "px";
			} else {
				console.log("DONE GOING UP");
				clearInterval(slider);
			}
		}
	}, 1);
}

const numberWithCommas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function timeAgo(time) {
	switch (typeof time) {
		case "number":
			break;
		case "string":
			time = +new Date(time);
			break;
		case "object":
			if (time.constructor === Date) time = time.getTime();
			break;
		default:
			time = +new Date();
	}
	const time_formats = [
		[60, "seconds", 1], // 60
		[120, "1 minute ago", "1 minute from now"], // 60*2
		[3600, "minutes", 60], // 60*60, 60
		[7200, "1 hour ago", "1 hour from now"], // 60*60*2
		[86400, "hours", 3600], // 60*60*24, 60*60
		[172800, "Yesterday", "Tomorrow"], // 60*60*24*2
		[604800, "days", 86400], // 60*60*24*7, 60*60*24
		[1209600, "Last week", "Next week"], // 60*60*24*7*4*2
		[2419200, "weeks", 604800], // 60*60*24*7*4, 60*60*24*7
		[4838400, "Last month", "Next month"], // 60*60*24*7*4*2
		[29030400, "months", 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
		[58060800, "Last year", "Next year"], // 60*60*24*7*4*12*2
		[2903040000, "years", 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
		[5806080000, "Last century", "Next century"], // 60*60*24*7*4*12*100*2
		[58060800000, "centuries", 2903040000], // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
	];
	let seconds = (+new Date() - time) / 1000,
		token = "ago",
		list_choice = 1;

	if (seconds === 0) {
		return "Just now";
	}
	if (seconds < 0) {
		seconds = Math.abs(seconds);
		token = "from now";
		list_choice = 2;
	}
	let i = 0,
		format;
	while ((format = time_formats[i++]))
		if (seconds < format[0]) {
			if (typeof format[2] == "string") return format[list_choice];
			else return Math.floor(seconds / format[2]) + " " + format[1] + " " + token;
		}
	return time;
}
