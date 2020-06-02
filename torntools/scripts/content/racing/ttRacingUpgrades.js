upgradeView().then(function(){
    console.log("TT - Racing Upgrades");
    
    if(!settings.pages.racing.upgrades){
        return;
    }

    Main();

    // start checking again when left site
    for(let category of doc.findAll(".categories li")){
        category.addEventListener("click", function(){
            upgradeView().then(Main);
        });
    }
});

function Main(){
    let items = document.querySelectorAll(".pm-items-wrap .d-wrap .pm-items .unlock");
    for(let item of items){
        item.style.position = "relative";
        let title = item.find(".title");
        title.style.fontSize = "11px";
        
        let properties = item.findAll(".properties");
        for(let property of properties){
            let span = doc.new("span");
                span.setClass("tt-upgrade-text");
                span.style.top = `${7 + (10*[...properties].indexOf(property))}px`;

            let name = property.find(".name").innerText.trim();
            let stat_gray = parseInt(property.find(".bar-gray-light-wrap-d").style.width);
            let stat_color = parseInt(property.find(".bar-color-wrap-d").style.width);
            let difference = stat_color - stat_gray;
            
            if(property.find(".negative")){
                difference = `-${difference}`;
                span.style.color = "#ff4444";
            } else
                difference = `+${difference}`;

            span.innerText = `${difference} ${name}`;
            title.appendChild(span);
        }
    }
}

function upgradeView(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(document.querySelector(".pm-categories-wrap")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}