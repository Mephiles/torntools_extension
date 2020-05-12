window.addEventListener('load', async (event) => {
	console.log("TT - City");
	
	if(await flying())
		return;

	local_storage.get(["settings", "extensions", "itemlist"], function([settings, extensions, itemlist]){
		
		mapLoaded().then(function(loaded){
			if(!loaded || (!settings.pages.city.items && !settings.pages.city.items_value))
				return;

			let items_container = content.new_container("TornTools - City Items", {first:true, id: "tt-city-items"});
			
			if(settings.pages.city.items && !extensions.doctorn){
				displayItems(items_container, itemlist);
			}
			
			if(settings.pages.city.items_value){
				// Value of items
				showValueOfItems(items_container, itemlist, extensions.doctorn);
			}
		});
	});
});

function mapLoaded(){
	let promise = new Promise(function(resolve, reject){
		let checker = setInterval(function(){
			if(doc.find("#map .leaflet-marker-pane .highlightItemMarket")){
				resolve(true);
				return clearInterval(checker);
			}
		}, 100);
	});

	return promise.then(function(data){
		return data;
	});
}

function displayItems(container, itemlist){
	let content = container.find(".content");
		content.innerText = "Items in the city: ";
	
	let items = getItemIDsOnMap();

	// Add items to box
	for(let id of items){
		let a = doc.new("a");
			a.setAttribute("href", `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${itemlist.items[id].name}`);
		let span = doc.new("span");
			span.innerText = itemlist.items[id].name + (items.indexOf(id) == items.length-1 ? "." : ", ");

		a.appendChild(span);
		content.appendChild(a);
	}
}

function showValueOfItems(container, itemlist, doctorn){
	let content = container.find(".content");
	let items = getItemIDsOnMap();

	let total_value = 0;
	for(let id of items){
		let value = parseInt(itemlist.items[id].market_value);
		total_value += value;
	}

	let new_div = doc.new("div");
		new_div.id = "tt-city-items-value";
		new_div.innerText = `City Items value: `;
	let value_span = doc.new("span");
		value_span.innerText = `$${numberWithCommas(total_value, shorten=false)}`

	if(doctorn){
		new_div.style.borderTop = "none";
		new_div.style.marginTop = "0";
		new_div.style.paddingBottom = "5px";
	}

	new_div.appendChild(value_span);
	content.appendChild(new_div);
}

function getItemIDsOnMap(){
	let items = [];

	// Find items
	for(let el of doc.findAll("#map .leaflet-marker-pane *")){
		let src = el.getAttribute("src");
		if(src.indexOf("https://www.torn.com/images/items/") > -1){
			items.push(src.split("items/")[1].split("/")[0]);
			el.classList.add("cityItem");
		}
	}

	return items;
}