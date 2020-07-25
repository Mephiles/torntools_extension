window.addEventListener("load", function(){
	console.log("Start Stocks");

	if(!usingChrome()){
		doc.find("body").style.marginRight = "25px";
	}

	local_storage.get(["settings", "api", "torndata", "userdata", "stock_alerts"], function([settings, api, torndata, userdata, stock_alerts]){

		console.log("Torndata", torndata.stocks);
		console.log("Userdata", userdata.stocks);

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
                    window.location.href = `../${tab}/${tab}.html`;
                });
            }
		}

		// setup settings button
		doc.find(".settings").addEventListener("click", function(){
			window.open("../settings/settings.html");
		});

		// setup user stocks
		for(let buy_id in user_stocks){
			let parent = doc.find("#user-stocks");
			let stock = user_stocks[buy_id];
			let id = stock.stock_id;
			let name = torn_stocks[id].name;
		
			let buy_price = stock.bought_price;
			let current_price = torn_stocks[id].current_price;
			let quantity = stock.shares;
			let total_profit = ((current_price-buy_price)*quantity).toFixed(0);
	
			let div = doc.new({type: "div", class: "stock-item"});
			let hr = doc.new("hr");
			let heading = doc.new({type: "div", class: "heading", text: `${name.length > 20 ? torn_stocks[id].acronym : name}`});  // use acronym if name is too long
				let quantity_span = doc.new({type: "div", class: "heading-quantity", text: ` (${numberWithCommas(quantity)} shares)`});
				heading.appendChild(quantity_span);

			heading.addEventListener("click", function(){
				chrome.tabs.create({url: `https://www.torn.com/stockexchange.php?torntools_redirect=${name}`});
			});

			// Stock info
			let stock_info = doc.new({type: "div", class: "stock-info-heading", text: "Price info"});
				let collapse_icon = doc.new({type: "i", class: "fas fa-chevron-down"});
				stock_info.appendChild(collapse_icon);

			let stock_info_content = doc.new({type: "div", class: "content"});
			let CP_div = doc.new({type: "div", class: "stock-info", text: `Current price: $${numberWithCommas(current_price, shorten=false)}`});
			let BP_div = doc.new({type: "div", class: "stock-info", text: `Buy price: $${numberWithCommas(buy_price, shorten=false)}`});
			let amount_div = doc.new({type: "div", class: "stock-info", text: `Quantity: ${numberWithCommas(quantity, shorten=false)}`});
			let profit = doc.new({type: "div", class: "profit"});
				if(total_profit > 0){
					profit.classList.add("positive");
					profit.innerText = `+$${numberWithCommas(total_profit, shorten=false)}`;
				} else if(total_profit < 0) {
					profit.classList.add("negative");
					profit.innerText = `-$${numberWithCommas(Math.abs(total_profit), shorten=false)}`;
				} else {
					profit.innerText = `$0`;
				}

			stock_info_content.appendChild(CP_div);
			stock_info_content.appendChild(BP_div);
			stock_info_content.appendChild(amount_div);
			
			// Benefit info
			let benefit_description, benefit_requirement, benefit_info, benefit_info_content;
	
			if(torn_stocks[id].benefit){
				benefit_description = torn_stocks[id].benefit.description;
				benefit_requirement = torn_stocks[id].benefit.requirement;
				benefit_info = doc.new({type: "div", class: "benefit-info-heading", text: "Benefit info"});
					let collapse_icon_2 = doc.new({type: "i", class: "fas fa-chevron-down"});
					benefit_info.appendChild(collapse_icon_2);
				
				benefit_info_content = doc.new({type: "div", class: "content"});
					let BD_div = doc.new({type: "div", text: benefit_description})
						quantity >= benefit_requirement ? BD_div.setClass("benefit-info desc complete") : BD_div.setClass("benefit-info desc incomplete");
					let BR_div = doc.new({type: "div", class: "benefit-info", text: `Required stocks: ${numberWithCommas(quantity, shorten=false)}/${numberWithCommas(benefit_requirement)}`});
					
				benefit_info_content.appendChild(BR_div);
				benefit_info_content.appendChild(BD_div);
			}


			// Alerts
			let alerts_wrap = doc.new({type: "div", class: "alerts-wrap"});
			let alerts_heading = doc.new({type: "div", class: "alerts-heading", text: "Alerts"});

			let reach_alert = stock_alerts[id] ? stock_alerts[id].reach : "";
			let input_wrap_reach = doc.new({type: "div", class: "alerts-input-wrap"});
			let reach_text = doc.new({type: "div", class: "alerts-text", text: "Reaches"});
			let reach_input = doc.new({type: "input", class: "alerts-input", value: reach_alert});
			input_wrap_reach.appendChild(reach_text);
			input_wrap_reach.appendChild(reach_input);
			
			let fall_alert = stock_alerts[id] ? stock_alerts[id].fall : "";
			let input_wrap_fall = doc.new({type: "div", class: "alerts-input-wrap"});
			let fall_text = doc.new({type: "div", class: "alerts-text", text: "Falls to"});
			let fall_input = doc.new({type: "input", class: "alerts-input", value: fall_alert});
			input_wrap_fall.appendChild(fall_text);
			input_wrap_fall.appendChild(fall_input);

			alerts_wrap.appendChild(alerts_heading);
			alerts_wrap.appendChild(input_wrap_reach);
			alerts_wrap.appendChild(input_wrap_fall);
			stock_info_content.appendChild(alerts_wrap);

			div.appendChild(hr);
			div.appendChild(heading);
			div.appendChild(profit);

			div.appendChild(stock_info);
			div.appendChild(stock_info_content)

			if(benefit_info){
				div.appendChild(benefit_info);
				div.appendChild(benefit_info_content);
			}

			parent.appendChild(div);

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

			if(benefit_info){
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

			// add event listeners to pirce alerts
			reach_input.addEventListener("change", function(){
				local_storage.change({"stock_alerts": {
					[id]: {
						"reach": reach_input.value
					}
				}});
			});

			fall_input.addEventListener("change", function(){
				local_storage.change({"stock_alerts": {
					[id]: {
						"fall": fall_input.value
					}
				}});
			});
		}

		// setup torn stocks
		for(let id in torn_stocks){
			if(id == "date") continue;
			let parent = doc.find("#all-stocks");
			let stock = torn_stocks[id];
			let name = stock.name;
			let current_price = torn_stocks[id].current_price;

			let div = doc.new({type: "div", class: "stock-item", attributes: {name: `${name.toLowerCase()} (${stock.acronym.toLowerCase()})`}});
			let hr = doc.new("hr");
			let heading = doc.new({type: "div", class: "heading", text: name});  // use acronym if name is too long

			heading.addEventListener("click", function(){
				chrome.tabs.create({url: `https://www.torn.com/stockexchange.php?torntools_redirect=${name}`});
			});

			// Stock info
			let stock_info = doc.new({type: "div", class: "stock-info-heading", text: "Price info"});
			let collapse_icon = doc.new({type: "i", class: "fas fa-chevron-down"});
			stock_info.appendChild(collapse_icon);
	
			let stock_info_content = doc.new({type: "div", class: "content"});
			let CP_div = doc.new({type: "div", class: "stock-info", text: `Current price: $${numberWithCommas(current_price, shorten=false)}`});
			let Q_div = doc.new({type: "div", class: "stock-info", text: `Available shares: ${numberWithCommas(torn_stocks[id].available_shares, shorten=false)}`, attributes: {style: "margin-bottom: 20px;"}})
			stock_info_content.appendChild(CP_div);
			stock_info_content.appendChild(Q_div);

			// Benefit info
			let benefit_description, benefit_requirement, benefit_info, benefit_info_content;

			if(torn_stocks[id].benefit){
				benefit_description = torn_stocks[id].benefit.description;
				benefit_requirement = torn_stocks[id].benefit.requirement;
				
				benefit_info = doc.new({type: "div", class: "benefit-info-heading", text: "Benefit info"});
					let collapse_icon_2 = doc.new({type: "i", class: "fas fa-chevron-down"});
					benefit_info.appendChild(collapse_icon_2);
				
				benefit_info_content = doc.new({type: "div", class: "content"});
					let BD_div = doc.new({type: "div", text: benefit_description})
					let BR_div = doc.new({type: "div", class: "benefit-info", text: `Required stocks: ${numberWithCommas(benefit_requirement)}`});
					
				benefit_info_content.appendChild(BR_div);
				benefit_info_content.appendChild(BD_div);
			}
		

			// Alerts
			let alerts_wrap = doc.new({type: "div", class: "alerts-wrap"});
			let alerts_heading = doc.new({type: "div", class: "alerts-heading", text: "Alerts"});
		
			let reach_alert = stock_alerts[id] ? stock_alerts[id].reach : "";
			let input_wrap_reach = doc.new({type: "div", class: "alerts-input-wrap"});
			let reach_text = doc.new({type: "div", class: "alerts-text", text: "Reaches"});
			let reach_input = doc.new({type: "input", class: "alerts-input", value: reach_alert});
			input_wrap_reach.appendChild(reach_text);
			input_wrap_reach.appendChild(reach_input);
			
			let fall_alert = stock_alerts[id] ? stock_alerts[id].fall : "";
			let input_wrap_fall = doc.new({type: "div", class: "alerts-input-wrap"});
			let fall_text = doc.new({type: "div", class: "alerts-text", text: "Falls to"});
			let fall_input = doc.new({type: "input", class: "alerts-input", value: fall_alert});
			input_wrap_fall.appendChild(fall_text);
			input_wrap_fall.appendChild(fall_input);
		
			alerts_wrap.appendChild(alerts_heading);
			alerts_wrap.appendChild(input_wrap_reach);
			alerts_wrap.appendChild(input_wrap_fall);
			stock_info_content.appendChild(alerts_wrap);
		
			div.appendChild(hr);
			div.appendChild(heading);
		
			div.appendChild(stock_info);
			div.appendChild(stock_info_content)
		
			if(benefit_description){
				div.appendChild(benefit_info);
				div.appendChild(benefit_info_content);
			}
		
			parent.appendChild(div);
		
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
		
			if(benefit_description){
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
		
			// add event listeners to pirce alerts
			reach_input.addEventListener("change", function(){
				local_storage.change({"stock_alerts": {
					[id]: {
						"reach": reach_input.value
					}
				}});
			});
		
			fall_input.addEventListener("change", function(){
				local_storage.change({"stock_alerts": {
					[id]: {
						"fall": fall_input.value
					}
				}});
			});
		}

		// setup searchbar
        doc.find("#search-bar").addEventListener("keyup", function(event){
			let keyword = event.target.value.toLowerCase();
			let stocks = doc.findAll("#all-stocks>div");

			if(keyword == ""){
				doc.find("#all-stocks").style.display = "none";
				doc.find("#user-stocks").style.display = "block";
				return;
			}

			doc.find("#user-stocks").style.display = "none";
			doc.find("#all-stocks").style.display = "block";

			for(let stock of stocks){
				if(stock.getAttribute("name").indexOf(keyword) > -1){
					stock.style.display = "block";
				} else {
					stock.style.display = "none";
				}
			}
		});

		doc.find("#search-bar").addEventListener("click", function(event){
			event.target.value = "";

			doc.find("#all-stocks").style.display = "none";
			doc.find("#user-stocks").style.display = "block";
		});
	});
});