window.addEventListener("load", function(){
	console.log("Start Calculator");

	local_storage.get(["settings", "itemlist", "api"], function([settings, itemlist, api]){
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

        // setup itemlist
        let list = doc.find("#item-list");
        for(let id in itemlist.items){
            let name = itemlist.items[id].name;
            
            let div = doc.new("div");
                div.setClass("item");
                div.id = name.toLowerCase().replace(/\s+/g, '');  // remove spaces
				div.innerText = name;
			
			let input = doc.new("input");
				input.setClass("quantity");
				input.setAttribute("type", "number");
				if(!usingChrome()){
					input.style.right = "51px"
				}

			let add_btn = doc.new("button");
				add_btn.setClass("add");
				add_btn.innerText = "Add";

			div.appendChild(add_btn);
			div.appendChild(input);
            list.appendChild(div);

            // display item if clicked on it
			add_btn.addEventListener("click", function(event){
				let quantity = input.value;

				if(!quantity){
					return;
				}

				// add price to list
				let item_price = itemlist.items[id].market_value;
				let div = doc.new("div");
					div.innerText = `${quantity}x ${name}  = $${numberWithCommas(item_price*quantity, shorten=false)}`;

				doc.find("#items-selected").appendChild(div);

				// increase total
				let total_value = parseInt(doc.find("#total-value").getAttribute("value"));
				doc.find("#total-value").setAttribute("value", total_value+(item_price*quantity));

				doc.find("#total-value").innerText = `Total: $${numberWithCommas(total_value+(item_price*quantity), shorten=false)}`;
				
				// clear input box
				input.value = "";
            });
        }

        // setup searchbar
        doc.find("#search-bar").addEventListener("keyup", function(event){
            let keyword = event.target.value.toLowerCase();
            let items = doc.findAll("#item-list div");

            if(keyword == ""){
                list.style.display = "none";
                return;
            }

            for(let item of items){
                if(item.id.indexOf(keyword) > -1){
                    item.style.display = "block";
                    list.style.display = "block";
                } else {
                    item.style.display = "none";
                }
            }
        });

        doc.find("#search-bar").addEventListener("click", function(event){
            event.target.value = "";

            doc.find("#item-list").style.display = "none";
        });

		// setup clear button
		doc.find("#clear-all").addEventListener("click", function(){
			doc.find("#items-selected").innerHTML = "";
			doc.find("#total-value").innerText = "";
			doc.find("#total-value").setAttribute("value", "0");
			doc.find("#search-bar").value = "";
			doc.find("#item-list").style.display = "none";
		});

		// Firefox
		if(!usingChrome()){
			console.log("Firefox edition.");
			doc.find("body").style.paddingRight = "17px";
		}
	});
});