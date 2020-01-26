export async function displayMissionPrice(reward, id, quantity, points, itemlist, userPoints){
	let itemValue = itemlist[id]["market_value"];

	const container = document.querySelector(`li[data-ammo-info='${reward.getAttribute("data-ammo-info")}'] .act-wrap`);
	const lastElement = document.querySelector(`li[data-ammo-info='${reward.getAttribute("data-ammo-info")}'] .act-wrap .actions`)
	const image = document.querySelector(`li[data-ammo-info='${reward.getAttribute("data-ammo-info")}'] .img-wrap`);

	// MAKE CONTAINERS BIGGER
	reward.style.height = "160px";

	let div = document.createElement("div");
	let oneItem = document.createElement("div");
	let pointValue = document.createElement("div");
	let totalValue = itemValue*quantity;

	// ONE ITEM PRICE ON IMAGE
	oneItem.innerText = "$" + String(this.numberWithCommas(itemValue));
	oneItem.style.color = "#35f4be";
	oneItem.style.position = "absolute";
	oneItem.style.left = "20px";
	oneItem.style.bottom = "5px";
	oneItem.style.fontsize = "10px";

	image.appendChild(oneItem);

	// LOWER CONTAINER
	let allItems = document.createElement("div");
	allItems.innerHTML = `Total value: <span style="color: #678c00">$${String(this.numberWithCommas(totalValue))}</span>`;
	// allItems.style.color = "#678c00";
	allItems.style.textAlign = "left";
	allItems.style.paddingLeft = "5px";
	allItems.style.paddingTop = "50px";

	pointValue.innerHTML = `Point value: <span style="color: #678c00">$${this.numberWithCommas((totalValue/points).toFixed(0))}</span>`;
	// pointValue.style.color = "#678c00";
	pointValue.style.textAlign = "left";
	pointValue.style.paddingLeft = "5px";


	div.appendChild(allItems)
	div.appendChild(pointValue)
	container.insertBefore(div, lastElement);
}