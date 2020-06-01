window.addEventListener("load", async function(){
    console.log("TT - Faction");

    if(settings.pages.faction.oc_time){
        if(Object.keys(oc).length == 0){
            console.log("NO DATA (might be no API access)");
            return;
        }

        if(subpage() == "crimes"){
            ocTimes(oc, settings.format);
        }

        doc.find(".faction-tabs li[data-case=crimes]").addEventListener("click", function(){
            ocTimes(oc, settings.format);
        });
    } 
    
    if(settings.pages.faction.armory){
        if(subpage() == "main"){
            armoryLog();
        }

        doc.find(".faction-tabs li[data-case=main]").addEventListener("click", function(){
            armoryLog();
        });
    }
});

function ocTimes(oc, format){
    subpageLoaded("crimes").then(function(loaded){
        if(!loaded){
            return;
        }
        
        let crimes = doc.findAll(".organize-wrap .crimes-list>li");
        for(let crime of crimes){
            let crime_id = crime.find(".details-wrap").getAttribute("data-crime");

            let finish_time = oc[crime_id].time_ready;
            let [day, month, year, hours, minutes, seconds]  = dateParts(new Date(finish_time*1000));

            let span = doc.new("span");
                span.setClass("tt-oc-time");
                span.innerText =`${formatTime([hours, minutes], format.time)} | ${formatDate([day, month], format.date)}`;

            crime.find(".status").appendChild(span);
        }
    });
}

function armoryLog(){
    subpageLoaded("main").then(function(){
        
        newstabLoaded("armory").then(function(){
            shortenNews();

            document.addEventListener("click", function(event){
                if(event.target.classList.contains("page-number") || 
                event.target.classList.contains("page-nb") || 
                event.target.classList.contains("pagination-left") || 
                event.target.classList.contains("pagination-right")){
                    setTimeout(function(){
                        newstabLoaded("armory").then(function(){
                            shortenNews();
                        });
                    }, 400)
                }
            })

            function shortenNews(){
                let all_news = doc.findAll("#tab4-4 .news-list>li");
                let db = {}
                for(let news of all_news){
                    let info = news.find(".info").innerText;

                    if(info in db){
                        db[info].count++;
                        db[info].first_date = news.find(".date").innerText;
                    } else {
                        db[info] = {
                            count: 1,
                            username: news.find(".info a").innerText,
                            link: news.find(".info a").getAttribute("href"),
                            last_date: news.find(".date").innerText
                        };
                    }
                }
                
                doc.find("#tab4-4 .news-list").innerHTML = "";
                console.log("db", db)

                for(let key in db){
                    let li = doc.new("li");
                    let date = doc.new("span");
                        date.setClass("date");
                    let info = doc.new("span");
                        info.setClass("info");
                        let a = doc.new("a");
                            a.href = db[key].link;
                            a.innerText = db[key].username;
                            info.appendChild(a);

                    if(db[key].first_date){
                        let upper_time = db[key].first_date.slice(0, db[key].first_date.length-(db[key].first_date.indexOf("\n")+4));
                        let upper_date = db[key].first_date.slice(db[key].first_date.indexOf("\n"), db[key].first_date.length-3);
                        let lower_time = db[key].last_date.slice(0, db[key].last_date.length-(db[key].last_date.indexOf("\n")+4));
                        let lower_date = db[key].last_date.slice(db[key].last_date.indexOf("\n"), db[key].last_date.length-3);

                        let upper_date_span = doc.new("span");
                            upper_date_span.setClass("left-date");
                            upper_date_span.innerText = `${upper_time}${upper_date}`;
                        let separator = doc.new("span");
                            separator.setClass("separator");
                            separator.innerText = "-";
                        let lower_date_span = doc.new("span");
                            lower_date_span.setClass("right-date");
                            lower_date_span.innerText = `${lower_time}${lower_date}`;

                        date.appendChild(upper_date_span);
                        date.appendChild(separator);
                        date.appendChild(lower_date_span);
                    } else {
                        date.innerText = db[key].last_date;
                    }

                    let inner_span = doc.new("span");

                    if(key.indexOf("used one") > -1 || key.indexOf("filled one") > -1){
                        let used = key.indexOf("used one") > -1;

                        let left_side = doc.new("span");
                            left_side.innerText = used ? " used " : " filled ";
                        let amount = doc.new("span");
                            amount.innerText = db[key].count + "x ";
                            amount.style.fontWeight = "600";
                        let right_side = doc.new("span");
                            right_side.innerText = used ? key.split(" used one ")[1] : key.split(" filled one ")[1];

                        inner_span.appendChild(left_side);
                        inner_span.appendChild(amount);
                        inner_span.appendChild(right_side);
                    } else {
                        inner_span.innerText = key;
                    }

                    info.appendChild(inner_span);
                    li.appendChild(date);
                    li.appendChild(info);
                    doc.find("#tab4-4 .news-list").appendChild(li);
                }
            }
        });
    });
}

function subpage(){
    let hash = window.location.hash.replace("#/", "");
    if(hash == ""){
        return "main";
    }

    let key = hash.split("=")[0];
    let value = hash.split("=")[1];

    if(key == "tab"){
        return value;
    }
    return "";
}

function subpageLoaded(page){
    return new Promise(function(resolve, reject){
        let counter = 50;
        let checker = setInterval(function(){
            console.log("checking");
            if(page == "crimes" && doc.find(".organize-wrap ul.crimes-list li")){
                resolve(true);
                return clearInterval(checker);
            } else if(page == "main" && doc.find("#war-react-root")){
                resolve(true);
                return clearInterval(checker);
            } else if(counter == 0){
                resolve(false);
                return clearInterval(checker);
            } else {
                counter--;
            }
        }, 100);
    });
}

function newstabLoaded(tab){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(tab == "armory" && doc.find("#tab4-4 .news-list li:not(.last)")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}