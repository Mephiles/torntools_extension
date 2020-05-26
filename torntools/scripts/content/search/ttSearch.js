window.addEventListener('load', async (event) => {
    console.log("TT - Search");

    if(await flying() || await abroad()){
        return;
    }

    if(window.location.search.indexOf("sid=UserList")){
        local_storage.get(["settings", "personalized"], function([settings, personalized]){
            if(personalized.mass_messages){
                console.log("MASS MESSAGES");

                searchLoaded().then(function(loaded){
                    if(!loaded){
                        return;
                    }
                    massMessages(settings.theme);
                });
            }
        });
    }
});

function searchLoaded(){
    let promise = new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            console.log("checking")
            if(doc.find("ul.user-info-list-wrap li:not(.last)")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });

    return promise.then(function(data){
        return data;
    });
}

function massMessages(theme){
    let container = content.new_container("TornTools - Search", {first: true, theme: theme, id: "ttSearchContainer", collapsed: false}).find(".content");

    let add_all_to_list = doc.new({type: "div", id: "tt-add-all-to-mm-list", text: "Add all to List"});
    container.appendChild(add_all_to_list);

    add_all_to_list.addEventListener("click", function(){
        let list = [];

        for(let li of doc.findAll("ul.user-info-list-wrap>li:not(.last)")){
            let user = li.find("a.user.name").getAttribute("data-placeholder") || li.find("a.user.name>span").getAttribute("title");
            list.push(user);
        }

        console.log("LIST", list);
        local_storage.get("mass_messages", function(mass_messages){
            mass_messages.list = [...mass_messages.list, ...list];
            local_storage.set({"mass_messages": mass_messages});
        });
    });
}