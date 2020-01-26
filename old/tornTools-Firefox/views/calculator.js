const chrome = browser;
window.onload = () => {
	console.log("START");
	setUpWindow();

	// SET UP ITEM LIST
	chrome.storage.local.get(["api_key", "itemlist", "api_system_online"], function(data){
		const api_key = data["api_key"];
		const itemlist = data["itemlist"]["items"];

		for(item in itemlist){
			var item_name = itemlist[item].name; // ITEM NAMES
			var ul = document.getElementById("item-list");
			var li = document.createElement("li");
			var input = document.createElement("input");
			var submit = document.createElement("button");

			input.classList.add("quantity");
			input.id = item_name + "-q";
			input.setAttribute("min", "0");
			input.setAttribute("type", "number");

			submit.id = item_name + "-sub";
			submit.classList.add("sub");

			li.style.paddingBottom = "2px";
			li.innerText = item_name;
			li.classList.add("item");
			li.id = item_name.toLowerCase().replace(/\s+/g, '');

			submit.addEventListener("click", function(){
				let name = this.parentElement.innerText;
				let q = parseInt(this.nextElementSibling.value);

				for(let id in itemlist){
					if(itemlist[id]["name"] == name){
						addItem(id, q, itemlist, api_key);

						this.nextElementSibling.value = "";
						ul.style.display = "none";
						document.querySelector("#items-selected").style.display = "block";
					}
				}
			})

			
			li.appendChild(submit);
			li.appendChild(input);
			ul.appendChild(li);
		}

		if(data["api_system_online"] === false){
			document.getElementById("error").innerText = "Api system is down!";
		}
	});

	window.onclick = (element) => {
		var elementId = element.target.id;
		var elementClass = element.target.classList;

		if (elementId == "search-bar") {
			element.target.value = "";
		}
	}
}

function addItem(id, q, itemlist, api_key){
	console.log(`Add Item: ${id} - ${q}`);
	const items_sel = document.querySelector("#items-selected");
	
	get_api(`https://api.torn.com/market/${id}?selections=bazaar,itemmarket`, api_key)
	.then(data => {
		if(data.error){
			document.getElementById("error").innerText = data.error["error"];
			return;
		}
		var lowest;

		for(let i in data["bazaar"]){
			let price = data["bazaar"][i]["cost"];

			if(!lowest){
				lowest = price;
			} else if(price < lowest){
				lowest = price
			}
		}

		for(let i in data["itemmarket"]){
			let price = data["itemmarket"][i]["cost"];

			if(!lowest){
				lowest = price;
			} else if(price < lowest){
				lowest = price
			}
		}
		return lowest * q;
	})
	.then(price => {
		let div = document.createElement("div");
		div.innerText = `${q}x ${itemlist[id]["name"]} - $${numberWithCommas(price)}`
		div.classList.add("item-sel");
		
		items_sel.appendChild(div);

		showTotalPrice();
	})
}

function showTotalPrice(){
	const items = document.querySelectorAll("#items-selected div");
	const price_field = document.querySelector("#price-field");

	var totalValue = 0;

	for(let item of items){
		let value = item.innerText.split("$")[1].replace(/,/g, "");
		totalValue += parseInt(value);
	}
	price_field.innerText = "$"+numberWithCommas(totalValue);
}

function setUpWindow(){
	chrome.storage.local.get(["settings"], function(data){
		const tabs = data["settings"]["tabs"];
		const sb = document.querySelector("#search-bar");
		const itemlist = document.querySelector("#item-list");
		const items_sel = document.querySelector("#items-selected");
		const clear = document.querySelector("#clear-all");

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
			var li = itemlist.getElementsByTagName("li");

			for (var i = 0; i < li.length; i++) {
			  if (li[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
			    li[i].style.display = "";
			    items_sel.style.display = "none";
			    itemlist.style.display = "block";
			  } else {
			    li[i].style.display = "none";
			  }
			}
			if(filter == ""){
				itemlist.style.display = "none";
			    items_sel.style.display = "block";
			}
		});

		settings.addEventListener("click", function(){
			window.open("settings.html")
		});

		clear.addEventListener("click", function(){
			items_sel.innerHTML = "";
			document.querySelector("#price-field").innerText = "";
			sb.value = "";
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