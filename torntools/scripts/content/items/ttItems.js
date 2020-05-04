window.addEventListener('load', async (event) => {
    console.log("TT - Items");

    if(await flying() || await abroad())
        return;

	local_storage.get(["settings", "itemlist"], function([settings, itemlist]){
		if(settings.pages.items.prices)
            Main(itemlist.items);
        
	});
});

function Main(itemlist){
    let sorting_icons = doc.findAll("ul[role=tablist] li:not(.no-items):not(.m-show):not(.hide)");

    for(let icon of sorting_icons){
        icon.addEventListener("click", function(){
            itemsLoaded().then(function(loaded){
                if(!loaded)
                    return;

                displayItemPrices(itemlist)
            });
            
        });
    }
    
    itemsLoaded().then(function(loaded){
        if(!loaded)
            return;

        displayItemPrices(itemlist)
    });
}

function itemsLoaded(){
    let promise = new Promise(function(resolve, reject){
        setTimeout(function(){
            let counter = 0;
            let checker = setInterval(function(){
                if([doc.findAll(".items-cont[aria-expanded=true]>li")].length != 0 && !doc.find(".items-cont[aria-expanded=true]>li.ajax-item-loader")){
                    resolve(true);
                    return clearInterval(checker);
                } else if(counter == 1000){
                    resolve(false);
                    return clearInterval(checker);
                } else {
                    counter++;
                }
            }, 100);
        }, 250);
    });

    return promise.then(function(data){
        return data;
    });
}

function displayItemPrices(itemlist){
    let items = doc.findAll(".items-cont[aria-expanded=true]>li");
    
    for(let item of items){
        let id = item.getAttribute("data-item");
        let price = itemlist[id].market_value;
        let total_price;
        let qty;

        let parent = item.find(".bonuses-wrap") || item.find(".name-wrap");
        let new_element;

        if(parent.find(".tt-item-price"))
            continue;
        
        if(item.find(".bonuses-wrap")){
            new_element = doc.new("li");
            new_element.setClass("bonus left tt-item-price");
        } else {
            new_element = doc.new("span");
            new_element.setClass("tt-item-price");

            qty = parseInt(parent.find(".qty").innerText.replace("x", ""));
            total_price = qty * parseInt(price);

            if(item.find("button.group-arrow")){
                new_element.style.paddingRight = "30px";
            }
        }
        
        if(total_price){
            // new_element.innerText = `$${numberWithCommas(price, shorten=false)} | ${qty}x = $${numberWithCommas(total_price, shorten=false)}`;
            let one_price = doc.new("span");
                one_price.innerText = `$${numberWithCommas(price, shorten=false)} |`;
            let quantity = doc.new("span");
                quantity.innerText = ` ${qty}x = `;
                quantity.setClass("tt-item-quantity");
            let all_price = doc.new("span");
                all_price.innerText = `$${numberWithCommas(total_price, shorten=false)}`;

            new_element.appendChild(one_price);
            new_element.appendChild(quantity);
            new_element.appendChild(all_price);
        } else if(price == 0) {
            new_element.innerText = `N/A`;
        } else {
            new_element.innerText = `$${numberWithCommas(price, shorten=false)}`;
        }

        parent.appendChild(new_element);
    }
}