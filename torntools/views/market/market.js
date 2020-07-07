window.addEventListener("load", function(){
    console.log("Start Market");

    local_storage.get(["settings", "api_key", "api", "itemlist"], function([settings, api_key, api, itemlist]){
        
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
                div.id = name.toLowerCase().replace(/\s+/g, '').replace(":","_");  // remove spaces
                div.innerText = name;

            list.appendChild(div);

            // display item if clicked on it
            div.addEventListener("click", async function(){
                let view_item = doc.find("#view-item");
                view_item.style.display = "block";

                view_item.find("a").innerText = name;
                view_item.find("a").href = `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${name}`;

                list.style.display = "none";

                showMarketInfo(id, api_key);
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

            doc.find("#view-item").style.display = "none";
            doc.find("#item-list").style.display = "none";
            doc.find("#market-info").style.display = "none";
        });
    });
});

function showMarketInfo(id, api_key){
    get_api(`https://api.torn.com/market/${id}?selections=bazaar,itemmarket`, api_key).then(function(data){
        if(!data.ok){
            doc.find(".error").style.display = "block";
            doc.find(".error").innerText = data.error;
            return;
        }

        data = data.result;

        console.log("Getting Bazaar & Itemmarket info");
        
        let list = doc.find("#market-info");
        list.style.display = "block";
        list.innerHTML = "";

        for(let type of Object.keys(data)){
            let heading_div = doc.new("div");
                heading_div.setClass("heading");
                heading_div.innerText = capitalize(type);

            list.appendChild(heading_div);

            for(let i = 0; i < 3; i++){
                let price_div = doc.new("div");
                    price_div.setClass("price");
                    // price_div.innerText = `$${numberWithCommas(data[type][i].cost, shorten=false)} | ${data[type][i].quantity}x`;
                    price_div.innerText = `${data[type][i].quantity}x | $${numberWithCommas(data[type][i].cost, shorten=false)}`;

                list.appendChild(price_div);
            }
        }
    });
}