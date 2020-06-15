console.log("TT - Trade");

let looking = true;
let checker = setInterval(function(){
	if(tradeView() && looking){
		looking = false
		setTimeout(function(){
			Main();
		}, 1000);
	} else if(!tradeView()){
		looking = true;
	}
}, 500);

function Main(){
	console.log("Trade view!");

	// Show values of adds
	let logs = doc.findAll(".log li div");
	for(let log of logs){
		let text = log.innerText;
		let total_value = 0;

		if(text.indexOf("added") > -1){
			text = text.replace(" added", "").replace(" to the trade", "").replace(log.find("a").innerText+" ", "");
			let items = text.split(",");

			for(let item of items){
				let name = item.split(" x")[0].trim();
				let quantity = parseInt(item.split(" x")[1]);

				for(let id in itemlist.items){
					if(itemlist.items[id].name == name){
						for(let i = 0; i < quantity; i++){
							total_value += itemlist.items[id].market_value;
						}
					}
				}
			}

			let value_span = doc.new("span");
				value_span.setClass("tt-add-value");
				value_span.innerText = `$${numberWithCommas(total_value, shorten=false)}`;
			
			log.appendChild(value_span);
		}
	}

	// Show values of sides
	for(let side of [doc.find(".user.left .cont .color2 .desc"), doc.find(".user.right .cont .color2 .desc")]){ // color2 - items
		if(!side){
			continue;
		}

		let LIs = side.findAll("li .name");
		let total_value = 0;

		for(let li of LIs){
			let name = li.innerText.split(" x")[0].trim();
			let quantity = parseInt(li.innerText.split(" x")[1]) || 1;

			for(let id in itemlist.items){
				if(itemlist.items[id].name == name){
					let item_value = itemlist.items[id].market_value;
					console.log(name, item_value)
					total_value += item_value*quantity;

					// Show item value if enabled
					if(settings.pages.trade.item_values){
						let span = doc.new({type: "span", class: "tt-side-item-value", text: `$${numberWithCommas((item_value * quantity), shorten=false)}`});
						li.appendChild(span);
					}
				}
			}

		}

		if(total_value != 0 && settings.pages.trade.total_value){
			let div = doc.new("div");
				div.setClass("tt-side-value");
				div.innerText = `Total value: `;
			let span = doc.new("span");
				span.innerText = `$${numberWithCommas(total_value, shorten=false)}`;

			div.appendChild(span);
			side.parentElement.parentElement.parentElement.appendChild(div);
		}

		if(settings.pages.trade.item_values){
			// Add option to hide item values
			let wrap_1 = doc.new({type: "div", class: "item-value-option-wrap"});
			let checkbox_1 = doc.new({type: "input", attributes: {type: "checkbox"}});
			let text_1 = doc.new({type: "span", text: "Hide item values"});
		
			wrap_1.appendChild(text_1);
			wrap_1.appendChild(checkbox_1);
	
			let wrap_2 = doc.new({type: "div", class: "item-value-option-wrap"});
			let checkbox_2 = doc.new({type: "input", attributes: {type: "checkbox"}});
			let text_2 = doc.new({type: "span", text: "Hide item values"});
		
			wrap_2.appendChild(text_2);
			wrap_2.appendChild(checkbox_2);
	
			doc.find(".trade-cont .user.left .title-black").appendChild(wrap_1);
			doc.find(".trade-cont .user.right .title-black").appendChild(wrap_2);
	
			checkbox_1.addEventListener("click", function(){
				if(checkbox_1.checked){
					for(let item of doc.findAll(".user.left .tt-side-item-value")){
						item.style.display = "none";
					}
				} else {
					for(let item of doc.findAll(".user.left .tt-side-item-value")){
						item.style.display = "block";
					}
				}
			});
	
			checkbox_2.addEventListener("click", function(){
				if(checkbox_2.checked){
					for(let item of doc.findAll(".user.right .tt-side-item-value")){
						item.style.display = "none";
					}
				} else {
					for(let item of doc.findAll(".user.right .tt-side-item-value")){
						item.style.display = "block";
					}
				}
			});
		}
	}
}

function tradeView(){
	let arguments = window.location.hash.replace("#", "").replace("/", "").split("&");

	for(let argument of arguments){
		if(argument.split("=")[0] == "step" && (argument.split("=")[1] == "view" || argument.split("=")[1] == "initiateTrade")){
			return true;
		}
	}
	return false;
}