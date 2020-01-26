window.onload = function(){
    console.log("START");

    // Set up the page
    chrome.storage.local.get(["settings", "api_key", "itemlist", "api", "update-available"], function(data){
        const tabs = data.settings.tabs;
        const api_key = data.api_key;
        const itemlist = data.itemlist.items;
        const api = data.api;
        const update_available = data["update_available"];

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
        
        // set up items
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


        const sb = document.querySelector("#search-bar");
        const settingsButton = document.querySelector("#settings");
        const reloadButton = document.querySelector("#update");
        const clear = document.querySelector("#clear-all");

        sb.addEventListener("keyup", function(){
            var filter = sb.value.toUpperCase();
            let itemslist = document.querySelector("#item-list");
            let items_sel = document.querySelector("#items-selected");
			var li = itemslist.getElementsByTagName("li");

			for (var i = 0; i < li.length; i++) {
			  if (li[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
			    li[i].style.display = "";
			    items_sel.style.display = "none";
			    itemslist.style.display = "block";
			  } else {
			    li[i].style.display = "none";
			  }
			}
			if(filter == ""){
				itemslist.style.display = "none";
			    items_sel.style.display = "block";
			}
		});

        sb.addEventListener("click", function(){
            this.value = "";
        });
        
        // clear button
        clear.addEventListener("click", function(){
            let items_sel = document.querySelector("#items-selected");
			items_sel.innerHTML = "";
			document.querySelector("#price-field").innerText = "";
			sb.value = "";
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

function getElementIndex(element) {
	let name = element.id;
	let promise = new Promise(function(resolve, reject){
		chrome.storage.local.get(["itemlist"], function(data){
			let items = data.itemlist.items;
			let itemid;
			for (let id in items){
				if(items[id].name.toLowerCase().replace(/\s+/g, '') == name){
					itemid = id;
				}
			}
			resolve(itemid);
		})	
	});

	return promise.then(function(value){
		return value;
	});
}

async function get_api(http, api_key) {
	const response = await fetch(http + "&key=" + api_key)
	const result = await response.json()

	if(result.error){
		console.log("API system OFFLINE");
		chrome.storage.local.get(["api"], function(data){
			data.api.online = false;
			data.api.error = result.error.error;
			chrome.storage.local.set({"api": data.api}, function(){});
		});
	} else {
        chrome.storage.local.get(["api"], function(data){
            data.api.online = true;
            data.api.error = "";
            chrome.storage.local.set({"api": data.api}, function(){});
        });
	}

	return result;
}

const numberWithCommas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function restartApp(){
	chrome.runtime.reload();
}