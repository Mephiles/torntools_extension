export async function markItems(){
	const items = document.querySelectorAll(".leaflet-marker-pane img");
	const container = document.querySelector("#ttCityFind");

	var itemlist = []

	for(let item of items){
		if(item.src.indexOf("/items/") > -1){
			itemlist.push(item.src.split("/items/")[1].split("/")[0]);
			item.classList.add("cityItem");

			if(container)
				addItemToList(container, item.src);
		}
	}

	if(container)
		container.scrollTop = container.scrollHeight;

	return itemlist;

	function addItemToList(container, src){
		const id = src.split("items/")[1].split("/")[0];

		let span = document.createElement("span");
		let a = document.createElement("a");
		// span.classList.add("tt-listItem");

		chrome.storage.local.get(["itemlist"], function(data){
			const itemlist = data["itemlist"]["items"];

			a.href = "https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=" + itemlist[id]["name"];
			a.innerText = itemlist[id]["name"] + " | ";

			span.appendChild(a);
			container.appendChild(span);
			// container.innerText += " | " + itemlist[id]["name"];
		});
	}
}

export function itemListWindow(){
	const container = document.querySelector("div[role='main']");
	const nextElement = document.querySelector("#city-map-tooltips-wrapper");

	let div_header = document.createElement("div");
	div_header.setAttribute("class", "title-green top-round");
	div_header.innerText = "TornTools - City items";

	let div = document.createElement("div");
	div.id = "ttCityFind";

	console.log(container)
	console.log(nextElement)
	container.insertBefore(div_header, nextElement);
	container.insertBefore(div, nextElement);
}

export function showValue(ids, numberWithCommas){
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

		// span1.style.fontWeight = "600";
		span2.style.color = "#678c00";

		span1.innerText = `TornTools - Items total value: `;
		span2.innerText = `$${numberWithCommas(value)}`;

		div.appendChild(span1);
		div.appendChild(span2);
		container.insertBefore(div, prevElement.nextElementSibling);

	});
}

export function mapView(){
	var hash = window.location.hash;

	if(hash.replace("#", "") === "map-cont"){
		return true;
	} else if (hash === ""){
		if(document.querySelector("#map")){
			return true
		}
	}
	return false;
}

export function mapLoaded(){
	if(document.querySelector("#city-map-tooltips-wrapper")){
		return true;
	}
	return false;
}