bountiesLoaded().then(function(){
    console.log("TT - Newspaper | Bounties");
    Main(filters);

    let newspaper_content_observer = new MutationObserver(function(mutations){
        for(let mutation of mutations){
            if(mutation.type == "childList" && mutation.addedNodes.length > 0){
                if(doc.find("#ttBountyContainer")) return;
                
                local_storage.get("filters", function(filters){
                    bountiesLoaded().then(function(){
                        if(!doc.find("#ttBountyContainer")){
                            Main(filters);
                        }
                    });
                });
            }
        }
    });
    newspaper_content_observer.observe(doc.find(".content-wrapper"), {childList: true, subtree: true});
});

function Main(filters){
    let container = content.new_container("Bounty Filter", {header_only: true, id: "ttBountyContainer", next_element: doc.find(".bounties-total").nextElementSibling});

    let option_1 = doc.new({type: "div", class: "tt-checkbox-wrap in-title"});
    let checkbox_1 = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text_1 = doc.new({type: "div", text: "Hide unavailable"});

    if(filters.bounties.hide_unavailable){
        checkbox_1.checked = true;
    }

    option_1.appendChild(checkbox_1);
    option_1.appendChild(text_1);

    let option_2 = doc.new({type: "div", class: "tt-input-wrap in-title"});
    let text_2 = doc.new({type: "div", text: "Max level"});
    let input_2 = doc.new({type: "input"});

    if(filters.bounties.max_level){
        input_2.value = filters.bounties.max_level;
    }

    option_2.appendChild(text_2);
    option_2.appendChild(input_2);

    container.find(".tt-title .tt-options").appendChild(option_1);
    container.find(".tt-title .tt-options").appendChild(option_2);

    checkbox_1.onclick = filter;
    input_2.onkeyup = filter;

    filter();

    function filter(){
        let people = doc.findAll(".bounties-list>li:not(.clear)");

        let hide_unavailable = checkbox_1.checked;
        let max_level = input_2.value;

        for(let person of people){
            person.classList.remove("filter-hidden");

            // Unavailable
            if(hide_unavailable && person.find(".status .t-red")){
                person.classList.add("filter-hidden");
                continue;
            }

            // Max level
            let person_level = parseInt(person.find(".level").innerText.replace("Level:", ""));
            if(max_level && person_level > parseInt(max_level)){
                person.classList.add("filter-hidden");
                continue;
            }
        }
        
        local_storage.change({"filters": {"bounties": {"hide_unavailable": hide_unavailable, "max_level": parseInt(max_level)}}});
    }
}

function bountiesLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".bounties-list>li>ul>li .reward")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}