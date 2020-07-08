DBloaded().then(function(){
	itemmarketLoaded().then(function(){
        console.log("TT - Item Market");

        if(subview() == "item_view"){
            for(let el of doc.findAll("ul.guns-list>li:not(.clear)")){
                el.find(".item").onclick = function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    
                    let price = el.find(".price").innerText.split(" (")[0].replace("$", "").replace(/,/g, "");
                    let item_id = el.find("img").getAttribute("src").split("items/")[1].split("/")[0];

                    window.location = `${el.find("a").getAttribute("href").replace("userID", "userId")}&tt_itemid=${item_id}&tt_itemprice=${price}`;
                }
            }
        } else if(subview() == "browse_view"){
            console.log("here")
            doc.addEventListener("click", function(event){
                if(event.target.classList && event.target.classList.contains("bazaar-market-icon")){
                    console.log("ADS")
                    event.preventDefault();
                    event.stopPropagation();

                    let price = findParent(event.target, {class: "item"}).find(".cost-price").innerText.replace("$", "").replace(/,/g, "");
                    let item_id = doc.find(".wai-hover").getAttribute("itemid");

                    window.location = `${event.target.parentElement.getAttribute("href")}&tt_itemid=${item_id}&tt_itemprice=${price}`;
                }
            });
        }
    });
});

function itemmarketLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(!doc.find("#item-market-main-wrap .info-msg .msg .ajax-placeholder")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function subview(){
    if(window.location.hash.indexOf("searchname=") > -1){
        return "item_view";
    } else {
        return "browse_view";
    }
}