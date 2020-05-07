window.addEventListener("load", function(){
	console.log("Start Stocks");

	local_storage.get(["settings", "api", "torndata", "userdata"], function([settings, api, torndata, userdata]){

		console.log("Torndata", torndata);
		console.log("Userdata", userdata);

		let torn_stocks = torndata.stocks;
		let user_stocks = userdata.stocks;

		 // show error
		 if(!api.online){
            doc.find(".error").style.display = "block";
            doc.find(".error").innerText = api.error;
        }

        // setup links
        for(let tab in settings.tabs){
            if(tab == "default")
                continue;

            if(settings.tabs[tab] == false){
                doc.find(`#${tab}-html`).style.display = "none";
            } else {
                doc.find(`#${tab}-html`).addEventListener("click", function(){
                    window.location.href = tab+".html";
                });
            }
		}

		// setup settings button
		doc.find(".settings").addEventListener("click", function(){
			window.open("settings.html");
		});

		// setup stocks list
		for(let id in user_stocks){
			let user_stock = user_stocks[id];
			let stock_id = user_stock.stock_id;
			
			let name = torn_stocks[stock_id].name;
			let buy_price = user_stock.bought_price;
			let current_price = torn_stocks[stock_id].current_price;
			let quantity = user_stock.shares;

			let benefit_description, benefit_requirement;

			if(torn_stocks[stock_id].benefit){
				benefit_description = torn_stocks[stock_id].benefit.description;
				benefit_requirement = torn_stocks[stock_id].benefit.requirement;
			}

			let total_profit = ((current_price-buy_price)*quantity).toFixed(0);

			let div = doc.new("div");
				div.setClass("stock-item");

			let hr = doc.new("hr");
			let heading = doc.new("div");
				heading.setClass("heading");
				heading.innerText = name;

			let stock_info = doc.new("div");
				stock_info.setClass("stock-info-heading");
				stock_info.innerText = "Price info";
				let collapse_icon = doc.new("i");
					collapse_icon.setClass("fas fa-chevron-down");
			
			let stock_info_content = doc.new("div");
				stock_info_content.setClass("content");
				let CP_div = doc.new("div");
					CP_div.setClass("stock-info");
					CP_div.innerText = `Current price: $${numberWithCommas(current_price, shorten=false)}`;
				let BP_div = doc.new("div");
					BP_div.setClass("stock-info");
					BP_div.innerText = `Buy price: $${numberWithCommas(buy_price, shorten=false)}`;
				let amount_div = doc.new("div");
					amount_div.setClass("stock-info");
					amount_div.innerText = `Quantity: ${numberWithCommas(quantity, shorten=false)}`;
				let profit = doc.new("div");
					profit.setClass("profit");
					if(total_profit > 0){
						profit.classList.add("positive");
						profit.innerText = `+$${numberWithCommas(total_profit, shorten=false)}`;
					} else if(total_profit < 0) {
						profit.classList.add("negative");
						profit.innerText = `-$${numberWithCommas(Math.abs(total_profit), shorten=false)}`;
					} else
						profit.innerText = `$0`;

			let benefit_info = doc.new("div");
				benefit_info.setClass("benefit-info-heading");
				benefit_info.innerText = "Benefit info";
				let collapse_icon_2 = doc.new("i");
					collapse_icon_2.setClass("fas fa-chevron-down");
			
			let benefit_info_content = doc.new("div");
				benefit_info_content.setClass("content");
				let BD_div = doc.new("div");
					quantity >= benefit_requirement ? BD_div.setClass("benefit-info desc complete") : BD_div.setClass("benefit-info desc incomplete");
					BD_div.innerText = benefit_description;
				let BR_div = doc.new("div");
					BR_div.setClass("benefit-info");
					BR_div.innerText = `Required stocks: ${numberWithCommas(quantity, shorten=false)}/${numberWithCommas(benefit_requirement)}`;
				
			stock_info.appendChild(collapse_icon);
			benefit_info.appendChild(collapse_icon_2);

			
			stock_info_content.appendChild(CP_div);
			stock_info_content.appendChild(BP_div);
			stock_info_content.appendChild(amount_div);

			benefit_info_content.appendChild(BR_div);
			benefit_info_content.appendChild(BD_div);

			div.appendChild(hr);
			div.appendChild(heading);
			div.appendChild(profit);

			div.appendChild(stock_info);
			div.appendChild(stock_info_content)

			div.appendChild(benefit_info);
			div.appendChild(benefit_info_content);

			doc.find("#stocks-list").appendChild(div);

			// add event listeners to open collapsibles
			stock_info.addEventListener("click", function(event){
				let content = event.srcElement.nodeName == "I" ? event.target.parentElement.nextElementSibling : event.target.nextElementSibling;

				if(content.style.maxHeight){
					content.style.maxHeight = null;
				} else {
					content.style.maxHeight = content.scrollHeight + "px";
				}

				event.srcElement.nodeName == "I" ? rotateElement(event.target, 180) : rotateElement(event.target.find("i"), 180);
			});

			benefit_info.addEventListener("click", function(event){
				let content = event.srcElement.nodeName == "I" ? event.target.parentElement.nextElementSibling : event.target.nextElementSibling;

				if(content.style.maxHeight){
					content.style.maxHeight = null;
				} else {
					content.style.maxHeight = content.scrollHeight + "px";
				}

				event.srcElement.nodeName == "I" ? rotateElement(event.target, 180) : rotateElement(event.target.find("i"), 180);
			});
		}
		
	});
});