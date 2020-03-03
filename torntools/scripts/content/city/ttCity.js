window.onload = window.onload.extend(function(){
	console.log("TT - City");

	chrome.storage.local.get(["settings"], function(data){
		const settings = data["settings"];

		if(settings.pages.city.show){
			// Check if map tab is open
			let tab_checker = setInterval(function(){
				if(mapView()){
					// Check if map has loaded
					let map_checker = setInterval(function(){
						if(mapLoaded()){
							console.log("Map found.");

							// DocTorn City Finds box
							if(!document.querySelector(".doctorn-widgets.doctorn-widgets--top")){
								itemListWindow();
								addItemsToList();
							}

							markItems();

							// Show value of items
							let item_ids = getItemIds();
							showValue(item_ids);
			
							clearInterval(map_checker);
						}
					}, 100);
					clearInterval(tab_checker);
				}
			}, 1000);
		} else {
			console.log("City Find Turned OFF");
		}
	});
});

function addItemsToList(){
	chrome.storage.local.get(["itemlist"], function(data){
		let itemlist = data.itemlist.items;
		console.log(itemlist)
		let container = document.querySelector("#ttCityFind");
		let elements = document.querySelectorAll("#map-cont #map .leaflet-map-pane .leaflet-objects-pane .leaflet-marker-pane .cityItem");

		for(let element of elements){
			let id = element.getAttribute("src").split("items/")[1].split("/")[0];

			let span = document.createElement("span");
			let a = document.createElement("a");

			a.href = "https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=" + itemlist[id]["name"];
			a.innerText = itemlist[id]["name"] + ", ";

			span.appendChild(a);
			container.appendChild(span);
		}
	});
}

function markItems(){
	let elements = document.querySelectorAll("#map-cont #map .leaflet-map-pane .leaflet-objects-pane .leaflet-marker-pane *");
	for(let element of elements){
		if(element.getAttribute("src").indexOf("https://www.torn.com/images/items") > -1)
			element.classList.add("cityItem");
	}
}

function mapView(){
	let tab = document.querySelector(".ui-state-active a span");
	return (tab.innerText === "MAP");
}

function mapLoaded(){
    // markers, items, etc.
    let items = document.querySelectorAll("#map-cont #map .leaflet-map-pane .leaflet-objects-pane .leaflet-marker-pane *");
    
    if(items.length > 10){
        return true;
    } else {
        return false;
    }
}

function itemListWindow(){
	const container = document.querySelector("div[role='main']");
	const nextElement = document.querySelector("#city-map-tooltips-wrapper");

	let div_header = document.createElement("div");
	div_header.setAttribute("class", "title-green top-round");
	div_header.innerText = "TornTools - City Items";

	let div = document.createElement("div");
	div.id = "ttCityFind";

	container.insertBefore(div_header, nextElement);
	container.insertBefore(div, nextElement);
}

function getItemIds(){
	let ids = [];
    
	let items = document.querySelectorAll("#map-cont #map .leaflet-map-pane .leaflet-objects-pane .leaflet-marker-pane .cityItem");
    for(let item of items){
        let id = parseInt(item.getAttribute("src").split("items/")[1].split("/*.png")[0]);
        ids.push(id);
    }

    return ids;
}

function showValue(ids){
	chrome.storage.local.get(["itemlist"], function(data){
		const itemlist = data["itemlist"]["items"];
		var value = 0;

		for(let id of ids){
			value += parseInt(itemlist[id]["market_value"]);
		}

		const container = document.querySelector("#map-cont");
		const prevElement = document.querySelector("#map");

		let div = document.createElement("div");
		let span1 = document.createElement("span");
		let span2 = document.createElement("span");

		div.setAttribute("style", `
			width: 100%;
			height: 30px;
			background-color: #f2f2f2;
			margin-top: 15px;
			border-bottom-left-radius: 5px;
			border-bottom-right-radius: 5px;
			font-size: 14px;
			padding-left: 10px;
			line-height: 30px;
			box-sizing: border-box;
		`);

		span2.style.color = "#678c00";

		span1.innerText = `TornTools | Items total value: `;
		span2.innerText = `$${numberWithCommas(value)}`;

		div.appendChild(span1);
		div.appendChild(span2);
		container.insertBefore(div, prevElement.nextElementSibling);
	});
}

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}