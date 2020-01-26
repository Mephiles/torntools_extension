export function displayBazaarItemPrice(price, row, view){
	if(view === "add"){
		let priceContainer = row.children[2].children[0].children[2].children[0].children[0];
		priceContainer.setAttribute("placeholder", String(this.numberWithCommas(price)));

		// SET PLACEHOLDERS TO CERTAIN COLOR
		let css = `li[data-reactid="${row.getAttribute("data-reactid")}"] input.clear-all.input-money::placeholder {color: #3ec505}`;
		let style = document.createElement("style");

		if(style.styleSheet){
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}

		document.getElementsByTagName("head")[0].appendChild(style);
	} else if(view === "manage"){
		let priceContainer = row.children[1].children[0].children[1];
		priceContainer.innerText = `$${this.numberWithCommas(price)}`
		priceContainer.style.color = "#3ec505";
	}
}

export async function getBazaarItemPrice(id, api_key, prices){
	let value;

	if(!prices[id]){
		value = await this.get_api(`https://api.torn.com/market/${id}?selections=bazaar,itemmarket`, api_key).then(data => {
			value = this.getLowest([data["bazaar"], data["itemmarket"]]);
			return value
		});
	} else {
		value = prices[id];
	}
	return value
}

export async function modifyItem(el, itemlist, api_key, itemPrices, view){
	let row;
	let itemName;
	if(view === "add"){
		try{
			row = el.parentElement.parentElement.parentElement.parentElement;
			itemName = row.children[1].children[1].innerText.split(" x")[0];
		} catch(err){
			row = el.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
			itemName = row.children[1].children[1].innerText.split(" x")[0];
		}
		let id;

		for(let i in itemlist){
			if(itemlist[i]["name"] === itemName){
				id = i;
			}
		}

		await this.getBazaarItemPrice(id, api_key, itemPrices).then(data => {
			let price = data;
			itemPrices[id] = price
			this.displayBazaarItemPrice(price, row, "add");
		});
	} else if (view === "manage"){
		row = el.parentElement.parentElement.parentElement.parentElement;
		itemName = row.children[0].children[3].innerText.split(" x")[0].trim();
		
		let id;

		for(let i in itemlist){
			if(itemlist[i]["name"] === itemName){
				id = i;
			}
		}

		await this.getBazaarItemPrice(id, api_key, itemPrices).then(data => {
			let price = data;
			itemPrices[id] = price
			this.displayBazaarItemPrice(price, row, "manage");
		});
	}
}

export function addView(){
	let check = document.querySelector("input[value='ADD TO BAZAAR']");
	if(check){
		return true;
	}
	return false;
}

export function openAllItems(){
	// APPEND ALL ITEMS
	var checkboxes = document.querySelectorAll("a[role='presentation']");
	for(let box of checkboxes){
		if(box.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.getAttribute("data-group") === "parent"){
			box.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].click();
		}
	}
	return checkboxes.length;
}

export function setAppStatus(status, view){
	const icons = {
		"disabled": "disabled.png",
		"notready": "notready.png",
		"ready": "ready.png"
	}
	const src = chrome.extension.getURL("images/"+icons[status]);
	if(!document.querySelector("#ttBazaarStatus")){
		var container;

		if(view === "add"){
			container = document.querySelector(".items-footer.clearfix");
		} else if(view === "manage"){
			container = document.querySelector("#top-page-links-list");
		}
		
		let div = document.createElement("div");
		div.setAttribute("style", `
			width: 20px;
			height: 20px;
			background-image: url("${src}");
			float: right;
			background-size: cover;
		`);
		div.id = "ttBazaarStatus";

		if(view === "add"){
			container.appendChild(div);
		} else if(view === "manage"){
			div.setAttribute("class", "t-clear h c-pointer  m-icon line-h24 right");
			container.insertBefore(div, container.children[container.children.length-2])
		}
	} else {
		document.querySelector("#ttBazaarStatus").style.backgroundImage = `url(${src})`
	}
}

export function subSite(site){
	var hash = window.location.hash;
	hash = hash.slice(2);
	hash = hash.split("&");
	var params = {}

	for(let param of hash){
		param = param.split("=");
		params[param[0]] = param[1];
	}

	if(params["p"] && params["p"] === site){
		return true;
	}
	return false;
}

export function markVicodin(){
	const priceTag = 100000;

	const names = document.querySelectorAll("p.t-overflow");
	for(let name of names){
		if(name.innerText === "Vicodin"){
			let price = name.nextElementSibling.innerText;
			price = price.replace("$", "");
			price = price.replace(/,/g, "");

			if(parseInt(price) >= priceTag){
				name.parentElement.parentElement.parentElement.parentElement.style.backgroundColor = "#fb5b5b";
			}
			break;
		}
	}
}