window.onload = function(){
    console.log("START");

     // Set up the page
     chrome.storage.local.get(["settings", "api_key", "api", "update-available", "torndata", "userdata"], function(data){
        const tabs = data.settings.tabs;
        const api_key = data.api_key;
        const api = data.api;
        const update_available = data["update_available"];
        const torn_stocks = data.torndata.stocks;
        const user_stocks = data.userdata.stocks;

        // if update is available
        if(update_available)
            document.querySelector("#update").style.display = "block";

        // if api is not online
        if(!api.online)
			document.getElementById("error").innerText = data.api.error;

        // set up tabs
        for(let tab in tabs){
			if(tab === "default" || tabs[tab] == false){continue}
			let link = document.querySelector(`#${tab}-html`);
			link.style.display = "inline-block";
			
			link.addEventListener("click", function(){
				window.location.href = tab + ".html";
			});
        }

        setUpStockContainer(torn_stocks, user_stocks);
		setUpBenefitsContainer(torn_stocks, user_stocks);
        

        const sb = document.querySelector("#searchbar");
		const benefits_tab = document.querySelector("#benefits-tab");
		const mystocks_tab = document.querySelector("#mystocks-tab");
        const settingsButton = document.querySelector("#settings");
		const reloadButton = document.querySelector("#update");

        // sub-tabs
        benefits_tab.addEventListener("click", function(){
			activeTab("benefits");
		});

		mystocks_tab.addEventListener("click", function(){
			activeTab("mystocks")
		});

        // searchbar
		sb.addEventListener("focus", function(){
			this.value = "";
		});

		sb.addEventListener("keyup", function(){
			var filter = sb.value.toUpperCase();
			var ul = document.querySelector("#stocklist");
			var li = ul.getElementsByTagName("li");

			for (var i = 0; i < li.length; i++) {
			  if (li[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
			    li[i].style.display = "";
			    ul.style.display = "block";
			  } else {
			    li[i].style.display = "none";
			  }
			}
			if(filter == ""){
				ul.style.display = "none";
			}
		});

        // settings button
		settingsButton.addEventListener("click", function(){
			window.open("settings.html")
		});

        // reload button
		reloadButton.addEventListener("click", () => {
			restartApp();
		});
    });
}

function setUpStockContainer(torn_stocks, user_stocks){
	for(let stock in user_stocks){
		let id = user_stocks[stock]["stock_id"];
		let shares = parseInt(user_stocks[stock]["shares"]);
		let buy_price = parseFloat(user_stocks[stock]["bought_price"]).toFixed(3);

		let name = torn_stocks[id]["name"];
		let current_price = parseFloat(torn_stocks[id]["current_price"]).toFixed(3);
		let profit = (current_price - buy_price).toFixed(3);
		let profit_total = (profit * shares).toFixed(0);

		console.log("-----------------------");
		console.log("shares", shares);
		console.log("buy_price", buy_price);
		console.log("current_price", current_price);
		console.log("profit", profit);
		console.log("total_profit", profit_total);
		console.log("-----------------------");

		const mystocks_container = document.querySelector("#mystocks-container");
		let mc = mystocks_container;

		let li = document.createElement("li");
		let heading = document.createElement("h3");
		let shares_p = document.createElement("p");
		let buy_price_p = document.createElement("p");
		let current_price_p = document.createElement("p");
		let profit_p = document.createElement("p");
		let profit_total_span = document.createElement("span");
		let hr = document.createElement("hr");

		heading.innerText = name;
		profit_total_span.innerText = `total profit: $${numberWithCommas(profit_total)}`;
		profit_total_span.classList.add("profit-total");
		if(profit_total <= 0){
			profit_total_span.classList.add("negative-profit");
		} else {
			profit_total_span.classList.add("positive-profit");
		}

		shares_p.innerText = `Shares: ${numberWithCommas(shares)}`;
		buy_price_p.innerText = `Buy price: $${numberWithCommas(buy_price)}`;
		current_price_p.innerText = `Current price: $${numberWithCommas(current_price)}`;
		profit_p.innerText = `Profit: $${profit}/share`;

		heading.appendChild(profit_total_span);
		li.appendChild(heading);
		li.appendChild(shares_p);
		li.appendChild(buy_price_p);
		li.appendChild(current_price_p);
		li.appendChild(profit_p);

		mc.appendChild(li);
		mc.appendChild(hr);
	}
}

function setUpBenefitsContainer(torn_stocks, user_stocks){
	// set up list
	const stocklist = document.querySelector("#stocklist");

	for(let stock in torn_stocks){
		let li = document.createElement("li");
		let name = torn_stocks[stock]["name"];
		li.innerText = name;
		li.id = stock;
		li.classList.add("item");
		stocklist.appendChild(li);

		li.addEventListener("click", function(){
			stocklist.style.display = "none";
			document.querySelector("#searchbar").value = "";

			let requirement = parseInt(torn_stocks[stock]["benefit"]["requirement"]);
			let user_amount = 0;
			for(let i in user_stocks){
				if(user_stocks[i]["stock_id"] == stock){
					user_amount = user_stocks[i]["shares"];
				}
			}
			let benefit_text = torn_stocks[stock]["benefit"]["description"];
			let current_price = torn_stocks[stock]["current_price"];

			const this_stock = {
				name: name,
				req: requirement,
				owned: user_amount,
				benefit: benefit_text,
				cur_price: current_price
			}

			console.log("CLICKED - SAVING");
			saveBenefit(this_stock);
			displayBenefit(this_stock)
		});
	}

	// set up already selected stocks

	try {
		chrome.storage.local.get(["benefits-stocks"], function(data){
			const stocks = data["benefits-stocks"];
			console.log("SAVED STOCKS", stocks);

			for(let stock in stocks){
				displayBenefit(stocks[stock]);
			}
		});
	} catch(err){
		console.log("NO BENEFITS SAVED");
	}
}

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function activeTab(tab){
	var benefits_container = document.querySelector("#benefits-container");
	var mystocks_container = document.querySelector("#mystocks-container");

	if(tab === "benefits"){
		benefits_container.style.display = "block";
		mystocks_container.style.display = "none";

		document.querySelector("#benefits-tab").setAttribute("class", "stocks-subtab active-subtab");
		document.querySelector("#mystocks-tab").setAttribute("class", "stocks-subtab");

	} else if(tab === "mystocks"){
		mystocks_container.style.display = "block";
		benefits_container.style.display = "none";

		document.querySelector("#mystocks-tab").setAttribute("class", "stocks-subtab active-subtab");
		document.querySelector("#benefits-tab").setAttribute("class", "stocks-subtab");
	}
}

function displayBenefit(stock){
	const name = stock.name;
	const requirement = stock.req;
	const user_amount = stock.owned;
	const benefit_text = stock.benefit;
	const cur_price = stock.cur_price;

	const container = document.querySelector("#display");
	let li = document.createElement("li");
	let heading = document.createElement("h3");
	let needed_stock_amount_p = document.createElement("p");
	let user_stock_amount_p = document.createElement("p");
	let left_stock_amount_p = document.createElement("p");
	let benefit_p = document.createElement("p");
	let hr = document.createElement("hr");
	let remove_span = document.createElement("span");

	heading.innerText = name;
	remove_span.classList.add("remove-benefit");
	remove_span.innerText = "X";
	needed_stock_amount_p.innerText = `Required stocks: ${numberWithCommas(requirement)} ($${numberWithCommas(requirement*cur_price)})`;
	user_stock_amount_p.innerText = `Owned: ${numberWithCommas(user_amount)}`;

	let left_amount = requirement - user_amount;
	if(left_amount > 0){
		left_stock_amount_p.innerText = `Left: ${numberWithCommas(left_amount)} ($${numberWithCommas(left_amount*cur_price)})`;
	}

	benefit_p.innerText = `Benefit: ${benefit_text}`;
	if(user_amount >= requirement){
		benefit_p.style.backgroundColor = "#97ee50";
		// benefit_p.style.color = "#e2b60f";
	} else {
		benefit_p.style.backgroundColor = "#f86d60";
	}

	heading.appendChild(remove_span);
	li.appendChild(heading);
	li.appendChild(needed_stock_amount_p);
	li.appendChild(user_stock_amount_p);
	li.appendChild(left_stock_amount_p);
	li.appendChild(benefit_p);

	container.appendChild(li);
	container.appendChild(hr);

	remove_span.addEventListener("click", function(){
		removeBenefit(stock, this);
	});
}

function saveBenefit(stock){
	chrome.storage.local.get(["benefits-stocks"], function(data){
		if(data["benefits-stocks"]){
			data["benefits-stocks"].push(stock);

			chrome.storage.local.set({
				"benefits-stocks": data["benefits-stocks"]
			}, function(){
				console.log("SAVED");
			});
		} else {
			chrome.storage.local.set({
				"benefits-stocks": [stock]
			}, function(){
				console.log("SAVED");
			});
		}
	});
}

function removeBenefit(_stock, _this){
	chrome.storage.local.get(["benefits-stocks"], function(data){
		if(data["benefits-stocks"]){
			data = data["benefits-stocks"];
			var newData = []
			var done = false;

			for(let i in data){
				let stock = data[i];
				if(_stock.name === stock.name && !done){
					done = true;
				} else {
					newData.push(stock);
				}
			}

			_this.parentElement.parentElement.nextElementSibling.remove();
			_this.parentElement.parentElement.remove();
			console.log("NEW DATA", newData);

			chrome.storage.local.set({
				"benefits-stocks": newData
			}, function(){
				console.log("SAVED");
			});
		} else {
			console.log("ERROR: NO BENEFITS FOUND");
		}
	});
}

function restartApp(){
	chrome.runtime.reload();
}