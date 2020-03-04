window.addEventListener('load', (event) => {
    console.log("TT - Trade");

    chrome.storage.local.get(["settings", "itemlist"], function(data) {
        const settings = data.settings;
        const itemlist = data.itemlist.items;
        const show_trade = settings.pages.trade.calculator;

        if(!show_trade)
            return;

        let done = false;
        // trade site checker
        let checker = setInterval(function(){
            if(tradeView()){
				if(!done){
					createWindow(itemlist);
					done = true;
				}
            } else {
                done = false;
            }
        }, 1000);
    });

});

function createWindow(itemlist){
	const leftSide = document.querySelector(".trade-cont .user.left");
	const rightSide = document.querySelector(".trade-cont .user.right");
    const adds = document.querySelectorAll(".log li div");
    
    const leftItems = getLeftItemIDs(itemlist);
    const rightItems = getRightItemIDs(itemlist);
    
    const leftsidevalue = getItemsValue(leftItems, itemlist);
    displayValue(leftSide, leftsidevalue);

    const rightsidevalue = getItemsValue(rightItems, itemlist);
    displayValue(rightSide, rightsidevalue);

    // show values for individual adds
    for (let add of adds) {
        let text = add.innerText;
        if (text.indexOf("added") > -1) {

            // remove unwanted parts
            text = text.replace(/ added/g, "")
            text = text.replace(/ to the trade./g, "")
            text = text.replace(text.split(" ")[0] + " ", "")
            var items = text.split(", ");

            var resultItems = {}

            for (let item of items) {
                let name = item.split(" x")[0];
                let q = item.split(" x")[1];
                let id;

                for (let i in itemlist) {
                    if (itemlist[i]["name"] === name) {
                        resultItems[i] = q;
                    }
                }
            }

            if (Object.keys(resultItems).length) {
                var addValue = getItemsValue(resultItems, itemlist);
                displayLogValue(add, addValue);
            }
        }
    }
}

function getLeftItemIDs(itemlist) {
	var result = {};

	let items = document.querySelectorAll(".user.left .cont .color2 .desc li .name.left");

	if (items[0].innerText !== "No items in trade") {
		for (let item of items) {
			let parts = item.innerText.split(" x");
			let name = parts[0].trim();
			let q = parts[1];
			if (!q) {
				q = "1"
			}

			for (let id in itemlist) {
				if (itemlist[id]["name"] === name) {
					result[id] = q;
				}
			}
		}
		return result;
	}
	return "none";
}

function getRightItemIDs(itemlist) {
	var result = {};

	let items = document.querySelectorAll(".user.right .cont .color2 .desc li .name.left");
	if (items.length === 0) {
		return "none"
	}

	for (let item of items) {
		let parts = item.innerText.split(" x");
		let name = parts[0];
		let q = parts[1];

		for (let id in itemlist) {
			if (itemlist[id]["name"] === name) {
				result[id] = q;
			}
		}
	}
	return result;
}

function displayValue(side, x) {
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
	span.innerText = "$" + String(numberWithCommas(x))

	div.appendChild(span);
	side.appendChild(div);
}

function getItemsValue(items, itemlist) {
	if (items === "none") {
		return 0;
	}
	var value = 0;

	for (let id in items) {
		value += parseInt(items[id]) * parseInt(itemlist[id]["market_value"]);
	}
	return value;
}

function displayLogValue(add, x) {
	let span = document.createElement("span");

	span.style.float = "right";
	span.style.color = "#678c00";
	span.innerText = "$" + String(numberWithCommas(x))

	add.appendChild(span);
}

function tradeView(){
    const tradeContainer = document.querySelector(".trade-cont");
	if (!tradeContainer) {
		return false;
	}
	return true
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}