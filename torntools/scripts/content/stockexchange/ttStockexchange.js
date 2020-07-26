DBloaded().then(function(){
	stocksLoaded().then(function(){
        console.log("TT - Stock Exchange");

        let stocks = doc.findAll(".stock-list>.item");

        // Open torntools redirect
        let torntools_redirect = getSearchParameters().has("torntools_redirect") ? getSearchParameters().get("torntools_redirect").replace(/%20/g, " ") : undefined;
        if(torntools_redirect){
            for(let stock of stocks){
                let stock_name = stock.find(".name").innerText;
        
                if(stock_name == torntools_redirect){
                    stock.firstElementChild.click();
                }
            }
        }

        // Add acronyms
        if(settings.pages.stockexchange.acronyms){
            for(let stock of stocks){
                stock = stock.firstElementChild; // heading
                let stock_id = stock.getAttribute("action").split("ID=")[1];
                let acronym = torndata.stocks[stock_id].acronym
                
                let text = `(${acronym}) ${stock.find(".name").innerText}`;
                stock.find(".name").innerText = text;
            }
        }
    });
});

function stocksLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".stock-list .item")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}