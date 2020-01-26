const chrome = browser;
window.onload = () => {
	console.log("START")
	setUpWindow();

	// SET UP ITEM LIST
	chrome.storage.local.get(["api_key", "itemlist", "api_system_online"], function(data){
		const api_key = data["api_key"];
		const itemlist = data["itemlist"]["items"];

		for(item in itemlist){
			var item_name = itemlist[item].name; // ITEM NAMES
			var ul = document.getElementById("item-list");
			var li = document.createElement("li");
			li.style.paddingBottom = "2px";
			li.innerHTML = item_name;
			li.classList.add("item");
			li.id = item_name.toLowerCase().replace(/\s+/g, '');
			ul.appendChild(li);
		}

		if(data["api_system_online"] === false){
			document.getElementById("error").innerText = "Api system is down!";
		}

		window.onclick = (element) => {
			var elementId = element.target.id;
			var elementClass = element.target.classList;

			if(elementClass[0] == "item"){
				var view_item = document.getElementById("view-item");
				var item_number = getElementIndex(element.target) + 1;
				var link = document.getElementById("view-item-link");

				view_item.style.display = "block";
				view_item.style.paddingBottom = "2px";
				view_item.style.borderBottom = "0.5px solid black";
				view_item.style.fontSize = "17px";
				link.innerHTML = document.getElementById(elementId).innerHTML;
				link.href = "https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=" + document.getElementById(elementId).innerHTML.replace(/\s+/g, '+');
				link.target = "_blank";
				
				var ul = document.getElementById("item-list");
				ul.style.display = "none";
				showPricing(item_number);

			} else if (elementId == "search-bar") {
				element.target.value = "";
				document.getElementById("view-item").style.display = "none";

				var pricing = document.getElementById("pricing");
				var headingBazaar = document.getElementById("bazaar");
				var headingItemmarket = document.getElementById("itemmarket");
				pricing.style.display = "none";
				headingBazaar.style.display = "none";
				headingItemmarket.style.display = "none";
			}

			function showPricing(item_number){
				var smallestBazaar = {};
				var smallestMarket = {};

				getInfo()

				function getInfo(){
					get_api(`https://api.torn.com/market/${item_number}?selections=bazaar,itemmarket`, api_key).then((data) => {
						if(data.error){
							document.getElementById("error").innerText = data.error["error"];
							return;
						}
						console.log("GETTING BAZAAR AND MARKET INFO")

						// BAZAAR
						var bazaar_list = data[Object.keys(data)[0]];
						var bazaar_list = Object.keys(bazaar_list).map(i => bazaar_list[i]) // OBJ -> ARRAY
						bazaar_list.sort(compare); // SORT

						smallestBazaar["0"] = bazaar_list[0];
						smallestBazaar["1"] = bazaar_list[1];
						smallestBazaar["2"] = bazaar_list[2];

						// MARKET
						var market_list = data[Object.keys(data)[1]];
						var market_list = Object.keys(market_list).map(i => market_list[i]) // OBJ -> ARRAY
						market_list.sort(compare); // SORT
						
						smallestMarket["1"] = market_list[0];
						smallestMarket["2"] = market_list[1];
						smallestMarket["3"] = market_list[2];

						var pricing = document.getElementById("pricing");
						var headingBazaar = document.getElementById("bazaar");
						var headingItemmarket = document.getElementById("itemmarket");
						pricing.style.display = "block";
						headingBazaar.style.display = "block";
						headingItemmarket.style.display = "block";

						var bz1 = document.getElementById("bz1");
						bz1.style.display = "block";
						displayPrices(smallestBazaar, 0);

						var bz2 = document.getElementById("bz2");
						bz2.style.display = "block";
						displayPrices(smallestBazaar, 1);

						var bz3 = document.getElementById("bz3");
						bz3.style.display = "block";
						displayPrices(smallestBazaar, 2);

						var im1 = document.getElementById("im1");
						im1.style.display = "block";
						displayPrices(smallestMarket, 0);

						var im2 = document.getElementById("im2");
						im2.style.display = "block";
						displayPrices(smallestMarket, 1);

						var im3 = document.getElementById("im3");
						im3.style.display = "block";
						displayPrices(smallestMarket, 2);

						function displayPrices(list, index){
							var quantity = list[Object.keys(list)[index]]["quantity"]
							var price = list[Object.keys(list)[index]]["cost"]

							price = numberWithCommas(price);
							quantity = numberWithCommas(quantity);

							if(list == smallestBazaar){
								if(index == 0){
									bz1.innerHTML = price + "   |   " + quantity
								} else if(index==1){
									bz2.innerHTML = price + "   |   " + quantity
								} else if(index==2){
									bz3.innerHTML = price + "   |   " + quantity
								}
							} else if (list == smallestMarket){
								if(index==0){
									im1.innerHTML = price + "   |   " + quantity
								} else if(index==1){
									im2.innerHTML = price + "   |   " + quantity
								} else if(index==2){
									im3.innerHTML = price + "   |   " + quantity
								}
							}
						}

					}).catch((data) => {
						console.log("ERROR GETTING BAZAAR AND MARKET INFO")
						console.log(data)
					})
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
		sb.addEventListener("keyup", function(){
			var filter = sb.value.toUpperCase();
			var ul = document.querySelector("#item-list");
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

		settings.addEventListener("click", function(){
			window.open("settings.html")
		});
	});
}

function getElementIndex(element) {
	return [].indexOf.call(element.parentNode.children, element);
}

async function get_api(http, api_key) {
	const response = await fetch(http + "&key=" + api_key)
	const result = await response.json()

	if(result.error){
		switch (result.error["code"]){
			case 9:
				chrome.storage.local.set({"api_system_online": false}, function(){
					console.log("API SYSTEM OFFLINE");
				});
				break;
			default:
				break;
		}
	} else {
		chrome.storage.local.get(["api_system_online"], function(data){
			if(data["api_system_online"] === false){
				chrome.storage.local.set({"api_system_online": true}, function(){
					console.log("API SYSTEM BACK ONLINE!");
				});
			}
		});
	}

	return result;
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

function toObject(arr) {
	var rv = {};
	for (var i = 0; i < arr.length; ++i)
		rv[i] = arr[i];
	return rv;
}