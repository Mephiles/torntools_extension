export function displayBazaarItemPrice(price, row){
	// let priceContainer = row.children[2].children[0].children[2].children[0].children[0];
	// priceContainer.value = String(numberWithCommas(price));
	// priceContainer.parentElement.classList.add("success");

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

export async function modifyItem(el, itemlist, api_key, itemPrices){
	let row;
	let itemName;
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
		this.displayBazaarItemPrice(price, row);
	});
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

export function setAppStatus(status){
	const icons = {
		"disabled": "disabled.png",
		"notready": "notready.png",
		"ready": "ready.png"
	}
	const src = chrome.extension.getURL("images/"+icons[status]);
	if(!document.querySelector("#ttBazaarStatus")){
		const container = document.querySelector(".items-footer.clearfix");
		
		let div = document.createElement("div");
		div.setAttribute("style", `
			width: 20px;
			height: 20px;
			background-image: url("${src}");
			float: right;
			background-size: cover;
		`);
		div.id = "ttBazaarStatus";

		container.appendChild(div);
	} else {
		console.log("HERE", src)
		document.querySelector("#ttBazaarStatus").style.backgroundImage = `url(${src})`
	}
}