window.onload = () => {
	console.log("START values script")

	chrome.storage.local.get(["itemlist", "tradecalc", "api_key"], function(data){
		const tradecalc = data["tradecalc"];
		const itemlist = data["itemlist"]["items"];
		const api_key = data["api_key"];
		var tradeV = false;

		// CHECK FOR SITE CHANGE
		let checker = setInterval(function(){
			if(tradecalc === "show"){
				if(tradeView()){
					if(tradeV === false){
						tradeV = true;
						console.log("CALCULATING")
						Main(itemlist, api_key);
					}
				} else {
					tradeV = false;
					console.log("NOT IN TRADE VIEW")
				}
			} else {
				console.log("TRADE CALCULATOR TURNED OFF")
			}
		}, 1000);

		function Main(itemlist, api_key){
			const tradeContainer = document.querySelector(".trade-cont");
			const leftSide = document.querySelector(".trade-cont .user.left");
			const rightSide = document.querySelector(".trade-cont .user.right");
			const adds = document.querySelectorAll(".log li div");

			const leftItems = getLeftItemIDs(itemlist);
			const rightItems = getRightItemIDs(itemlist);
			var prices = getAllPrices([leftItems, rightItems]);
			
			if(leftItems){
				calculateItemsValue(leftItems, prices, api_key).then(data => {
					displayValue(leftSide, data);
				})
			}

			if(rightItems){
				calculateItemsValue(rightItems, prices, api_key).then(data => {
					displayValue(rightSide, data);
				})
			}

			// SHOW VALUES FOR INDEPENDENT ADDS
			for(let add of adds){
				let text = add.innerText
				if(text.indexOf("added") > -1){
					
					// remove unwanted parts
					text = text.replace(/ added/g, "")
					text = text.replace(/ to the trade./g, "")
					text = text.replace(text.split(" ")[0] + " ", "")
					var items = text.split(", ");

					var resultItems = {}

					for(let item of items){
						let name = item.split(" x")[0];
						let q = item.split(" x")[1];
						let id;

						for(let i in itemlist){
							if(itemlist[i]["name"] === name){
								resultItems[i] = q;
							}
						}
					}

					if(Object.keys(resultItems).length){
						calculateItemsValue(resultItems, api_key).then(data => {
							displayLogValue(add, data);
						});
					}
				}
			}
		}
	});
}

async function prices(lists){
	var allPrices = {}
	
	for(let list of lists){
		for(let id of list){
			let data = get_api(`http//api.torn.com/market/${id}?selections=bazaar,itemmarket`).then(data => {
				return [data["bazaar"], data["itemmarket"]]
			})
			allPrices[id] = getLowest(data);
		}
	}
	return allPrices;
}

function displayLogValue(add, x){
	let span = document.createElement("span");
	
	span.style.float = "right";
	span.style.color = "#678c00";
	span.innerText = "$"+String(numberWithCommas(x))

	add.appendChild(span);
}

function getLeftItemIDs(itemlist){
	var result = {};

	let items = document.querySelectorAll(".user.left .cont .color2 .desc li .name.left");

	if(items[0].innerText !== "No items in trade"){
		for(let item of items){
			let parts = item.innerText.split(" x");
			let name = parts[0];
			let q = parts[1];

			for(let id in itemlist){
				if(itemlist[id]["name"] === name){
					result[id] = q;
				}
			}
		}
		return result;
	}
	return "none";
}

function getRightItemIDs(itemlist){
	var result = {};

	let items = document.querySelectorAll(".user.right .cont .color2 .desc li .name.left");
	if(!items){
		return "none"
	}

	for(let item of items){
		let parts = item.innerText.split(" x");
		let name = parts[0];
		let q = parts[1];

		for(let id in itemlist){
			if(itemlist[id]["name"] === name){
				result[id] = q;
			}
		}
	}
	return result;
}

async function calculateItemsValue(items, prices, api_key){
	if(items === "none"){return 0}

	var value = 0;
	
	for(let id in items){
		if(prices[id]){
			value += prices[id] * items[id] // price * quantity
		} else {
		value += await get_api(`https://api.torn.com/market/${id}?selections=bazaar,itemmarket`, api_key)
		.then(data => {
			var lowest = getLowest([data["bazaar"], data["itemmarket"]]);
			return lowest * q;
		})
		}
	}
	return value;
}

function displayValue(side, x){
	let div = document.createElement("div");
	let span = document.createElement("span");

	div.style.height = "30px";
	div.style.lineHeight = "30px";
	div.style.border = "0.5px solid black";
	div.style.fontWeight = "600";
	div.style.paddingLeft = "15px";
	div.innerText = "Items value: "

	span.style.color = "#678c00",
	span.style.fontWeight = "400";
	span.innerText = "$"+String(numberWithCommas(x))

	div.appendChild(span);
	side.appendChild(div);
}

function getLowest(lists){
	var lowest;

	for(let list of lists){
		for(let id in list){
			let price = parseInt(lists[list][id]["cost"]);

			if(!lowest){
				lowest = price;
			} else if(price < lowest){
				lowest = price
			}
		}
	}
	return lowest;
}


function tradeView(){
	const tradeContainer = document.querySelector(".trade-cont");
	if(!tradeContainer){
		return false;
	}
	return true
}

async function get_api(http, api_key) {
  	const response = await fetch(http + "&key=" + api_key)
  	return await response.json()
}

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function compare(a,b) {
  if (a.cost < b.cost)
    return -1;
  if (a.cost > b.cost)
    return 1;
  return 0;
}