export function tradeView(){
	const tradeContainer = document.querySelector(".trade-cont");
	if(!tradeContainer){
		return false;
	}
	return true
}

export function displayValue(side, x){
	let div = document.createElement("div");
	let span = document.createElement("span");

	div.style.height = "30px";
	div.style.lineHeight = "30px";
	div.style.border = "0.5px solid black";
	div.style.fontWeight = "600";
	div.style.paddingLeft = "15px";
	div.innerText = "Items value: "

	span.style.color = "#678c00",
	span.style.fontWeight = "400";
	span.innerText = "$"+String(this.numberWithCommas(x))

	div.appendChild(span);
	side.appendChild(div);
}

export function getLeftItemIDs(itemlist){
	var result = {};

	let items = document.querySelectorAll(".user.left .cont .color2 .desc li .name.left");

	if(items[0].innerText !== "No items in trade"){
		for(let item of items){
			let parts = item.innerText.split(" x");
			let name = parts[0].trim();
			let q = parts[1];
			if(!q){q="1"}

			for(let id in itemlist){
				if(itemlist[id]["name"] === name){
					console.log(name)
					result[id] = q;
				}
			}
		}
		return result;
	}
	return "none";
}

export function getRightItemIDs(itemlist){
	var result = {};

	let items = document.querySelectorAll(".user.right .cont .color2 .desc li .name.left");
	if(items.length === 0){
		return "none"
	}

	for(let item of items){
		let parts = item.innerText.split(" x");
		let name = parts[0];
		let q = parts[1];

		for(let id in itemlist){
			if(itemlist[id]["name"] === name){
				result[id] = q;
			}
		}
	}
	return result;
}

export function displayLogValue(add, x){
	let span = document.createElement("span");
	
	span.style.float = "right";
	span.style.color = "#678c00";
	span.innerText = "$"+String(this.numberWithCommas(x))

	add.appendChild(span);
}

export function getItemsValue(items, itemlist){
	if(items === "none"){
		return 0;
	}
	var value = 0;
	
	for(let id in items){
		value += parseInt(items[id]) * parseInt(itemlist[id]["market_value"]);
	}	
	return value;
}