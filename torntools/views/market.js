window.onload = function(){
    console.log("START");

    // Set up the page
    chrome.storage.local.get(["settings", "api_key", "itemlist", "api", "update-available"], function(data){
        const tabs = data.settings.tabs;
        const api_key = data.api_key;
        const itemlist = data.itemlist.items;
        const api = data.api;
        const update_available = data["update-available"];

        // if update is available
        if(update_available)
            document.querySelector("#update").style.display = "block";

        // if api is not online
        if(!api.online)
			document.getElementById("error").innerText = api.error;

        // set up tabs
        for(let tab in tabs){
			if(tab === "default" || tabs[tab] == false){continue}
			let link = document.querySelector(`#${tab}-html`);
			link.style.display = "inline-block";
			
			link.addEventListener("click", function(){
				window.location.href = tab + ".html";
			});
        }
        
        // set items into list
        var ul = document.getElementById("item-list");
        for(item in itemlist){
			var item_name = itemlist[item].name; // ITEM NAMES
			var li = document.createElement("li");
			li.innerHTML = item_name;
			li.classList.add("item");
			li.id = item_name.toLowerCase().replace(/\s+/g, '');
            ul.appendChild(li);
            
            addEventListenerFor(li, api_key);
		}

        // Searchbar
        const sb = document.querySelector("#search-bar");
        const settingsButton = document.querySelector("#settings");
        const reloadButton = document.querySelector("#update");

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
        
        sb.addEventListener("click", function(){
            sb.value = "";

            document.getElementById("view-item").style.display = "none";
            document.getElementById("pricing").style.display = "none"
            document.getElementById("bazaar").style.display = "none"
            document.getElementById("itemmarket").style.display = "none"
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

function addEventListenerFor(li, api_key){
    li.addEventListener("click", async function(){
        var view_item = document.getElementById("view-item");
        var item_number = await getElementIndex(li);
        var link = document.getElementById("view-item-link");
        
        view_item.style.display = "block";

        link.innerHTML = document.getElementById(li.id).innerHTML;
        link.href = "https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=" + document.getElementById(li.id).innerHTML.replace(/\s+/g, '+');
        link.target = "_blank";
        
        var ul = document.getElementById("item-list");
        ul.style.display = "none";
        showPricing(item_number, api_key);
    });
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

function showPricing(item_number, api_key){
    var smallestBazaar = {};
    var smallestMarket = {};

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

        document.getElementById("pricing").style.display = "block";
        document.getElementById("bazaar").style.display = "block";
        document.getElementById("itemmarket").style.display = "block";

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

function compare(a,b) {
	if (a.cost < b.cost)
		return -1;
	if (a.cost > b.cost)
		return 1;
	return 0;
}

function restartApp(){
	chrome.runtime.reload();
}