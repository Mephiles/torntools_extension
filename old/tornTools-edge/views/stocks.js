window.onload = () => {
	setUpWindow();

	// SET UP STOCKS LIST
	chrome.storage.local.get(["api_key", "torndata", "userdata"], function(data){
		const api_key = data["api_key"];
		const torn_stocks = data["torndata"]["stocks"];
		const user_stocks = data["userdata"]["stocks"];

		var stock_ids = [];
		var shares = [];
		var b_price = [];

		for(var stock in user_stocks){
			stock_ids.push(user_stocks[stock]["stock_id"])
			shares.push(user_stocks[stock]["shares"])
			b_price.push(user_stocks[stock]["bought_price"])
		}

		for(var id in stock_ids){
			for(var stock in torn_stocks){
				if(stock == stock_ids[id]){
					var stock_name = torn_stocks[stock]["name"];
					var stock_shares = shares[id];
					var stock_buy_price = b_price[id];
					var stock_current_price = torn_stocks[stock]["current_price"];
					var profit = parseFloat(stock_current_price) - parseFloat(stock_buy_price);
					profit = profit.toFixed(3);

					var total_profit = (profit * parseInt(stock_shares)).toFixed(0)
					console.log("-----------------------")
					console.log("profit", profit)
					console.log("stock shares", parseInt(stock_shares))
					console.log("profit*stock_shares", profit*parseInt(stock_shares))
					console.log("total_profit", total_profit)
					console.log("-----------------------")

					var stocks_list = document.getElementById("stocks-list");
					var li = document.createElement("li");

					var h3 = document.createElement("h3");
					if(String(total_profit).indexOf("-") > -1){
						h3.innerHTML = stock_name + ' <span style="font-size: 14px; float: right; font-weight: normal; padding: 2px; background-color: #f86d60">total profit: $' + numberWithCommas(total_profit) + '</span>';
					} else {
						h3.innerHTML = stock_name + ' <span style="font-size: 14px; float: right; font-weight: normal; padding: 2px; background-color: #97ee50">total profit: $' + numberWithCommas(total_profit) + '</span>';
					}

					var shares_p = document.createElement("p");
					shares_p.innerText = "Shares: " + numberWithCommas(stock_shares);
					
					var buy_price_p = document.createElement("p");
					buy_price_p.innerText = "Buy price: $" + stock_buy_price + "/share";
					
					var cur_price_p = document.createElement("p");
					cur_price_p.innerText = "Current price: $" + stock_current_price + "/share";
					
					var profit_p = document.createElement("p");
					if(profit < 0 && String(profit).length >= 9){
						profit = profit * -1;
						profit = numberWithCommas(String(profit).substr(0, String(profit).length-4)) + String(profit).substr(-4);
						profit = parseInt(profit) * -1;
					} else if (profit > 0 && String(profit).length >= 8){
						profit = numberWithCommas(String(profit).substr(0, String(profit).length-4)) + String(profit).substr(-4);
					}
					profit_p.innerText = "Profit: $" + profit + "/share";

					var hr = document.createElement("hr");

					li.appendChild(h3);
					li.appendChild(shares_p);
					li.appendChild(buy_price_p);
					li.appendChild(cur_price_p);
					li.appendChild(profit_p);

					stocks_list.appendChild(li);
					stocks_list.appendChild(hr);
					
					break
				}
			}
		}
	});
}

function setUpWindow(){
	chrome.storage.local.get(["settings"], function(data){
		const tabs = data["settings"]["tabs"];
		const sb = document.querySelector("#search-bar");

		for(let tab of tabs){
			if(tab === "achievements"){continue}
			let link = document.querySelector(`#${tab}-html`);
			link.style.display = "inline-block";
			
			link.addEventListener("click", function(){
				window.location.href = tab + ".html";
			});
		}

		// EVENT LISTENERS
		settings.addEventListener("click", function(){
			window.open("settings.html")
		});
	});
}

async function get_api(http, api_key) {
  	const response = await fetch(http + "&key=" + api_key)
  	return await response.json()
}

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}