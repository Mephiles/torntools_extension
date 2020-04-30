window.addEventListener('load', async (event) => {
	console.log("TT - Trade");
	
	if(await flying())
		return;

    local_storage.get(["settings", "itemlist"], function([settings, itemlist]) {
        if(!settings.pages.trade.calculator)
            return;

		let looking = true;
		let checker = setInterval(function(){
			if(tradeView() && looking){
				looking = false
				setTimeout(Main, 1000);
			} else if(!tradeView())
				looking = true;
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
				let LIs = side.findAll("li .name");
				let total_value = 0;

				for(let li of LIs){
					let name = li.innerText.split(" x")[0].trim();
					let quantity = li.innerText.split(" x")[1] || 1;

					for(let id in itemlist.items){
						if(itemlist.items[id].name == name){
							let item_value = itemlist.items[id].market_value;
							console.log(name, item_value)
							total_value += item_value;

							let span = doc.new("span");
								span.setClass("tt-side-item-value");
								span.innerText = `$${numberWithCommas((item_value * quantity), shorten=false)}`;
							li.appendChild(span);
						}
					}

				}

				if(!total_value == 0){
					let div = doc.new("div");
						div.setClass("tt-side-value");
						div.innerText = `Items value: `;
					let span = doc.new("span");
						span.innerText = `$${numberWithCommas(total_value, shorten=false)}`;

					div.appendChild(span);
					side.parentElement.parentElement.parentElement.appendChild(div);
				}
			}
        }
    });
});

function tradeView(){
	let arguments = window.location.hash.replace("#", "").replace("/", "").split("&");

	for(let argument of arguments){
		if(argument.split("=")[0] == "step" && (argument.split("=")[1] == "view" || argument.split("=")[1] == "initiateTrade")){
			return true;
		}
	}
	return false;
}