window.addEventListener("load", function(){
    console.log("TT - Newspaper | Bounties");
    
    if(extensions.doctorn == false || extensions.doctorn == "force_false" || settings.force_tt){
        Main();
    
        document.addEventListener("click", function(event){
            let tar = event.target;
    
            if(tar.classList.contains("pagination") || hasParent(tar, {class: "pagination"})){
                setTimeout(function(){
                    bountiesLoaded().then(Main);
                }, 500);
            }
        });
    }
});

function Main(){
    let container = content.new_container("Bounty Filter", {header_only: true, id: "ttBountyContainer", next_element: doc.find(".bounties-total").nextElementSibling});
    console.log(container);

    let option_1 = doc.new({type: "div", class: "tt-option"});
    let checkbox_1 = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text_1 = doc.new({type: "div", class: "tt-text", text: "Hide unavailable"});

    if(settings.bounties_filter.hide_unavailable){
        checkbox_1.checked = true;
    }

    option_1.appendChild(checkbox_1);
    option_1.appendChild(text_1);

    let option_2 = doc.new({type: "div", class: "tt-option"});
    let text_2 = doc.new({type: "div", class: "tt-text", text: "Max level"});
    let input_2 = doc.new({type: "input", class: "tt-input-box"});

    if(settings.bounties_filter.max_level){
        input_2.value = settings.bounties_filter.max_level;
    }

    option_2.appendChild(text_2);
    option_2.appendChild(input_2);

    container.find(".tt-title").appendChild(option_2);
    container.find(".tt-title").appendChild(option_1);

    // Hide unavailable
    checkbox_1.addEventListener("click", function(){
        console.log("CHECKBOX EVENT");
        let people = doc.findAll(".bounties-list>li:not(.clear)");

        if(input_2.value == "" && !checkbox_1.checked){
            for(let person of people){
                person.style.display = "block";
            }
        } else if(checkbox_1.checked && input_2.value == ""){
            for(let person of people){
                if(person.find(".status .t-red")){
                    person.style.display = "none";
                } else {
                    person.style.display = "block";
                }
            }
        } else if(checkbox_1.checked && input_2.value != ""){
            for(let person of people){
                if(person.style.display == "none") continue;

                if(person.find(".status .t-red")){
                    person.style.display = "none";
                } else {
                    person.style.display = "block";
                }
            }
        } else if(!checkbox_1.checked && input_2.value != ""){
            input_2.dispatchEvent(new Event("keyup"));
        }

        local_storage.change({"settings": {"bounties_filter": {"hide_unavailable": checkbox_1.checked, "max_level": parseInt(input_2.value)}}});
    });

    // Max level
    input_2.addEventListener("keyup", function(){
        console.log("INPUT EVENT");
        let people = doc.findAll(".bounties-list>li:not(.clear)");

        if(input_2.value == "" && !checkbox_1.checked){
            for(let person of people){
                person.style.display = "block";
            }
        } else if(input_2.value != "" && !checkbox_1.checked){
            for(let person of people){
                if(parseInt(person.find(".level").innerText.replace("Level:", "")) <= parseInt(input_2.value)){
                    person.style.display = "block";
                } else {
                    person.style.display = "none";
                }
            }
        } else if(input_2.value != "" && checkbox_1.checked){
            for(let person of people){
                if(person.style.display == "none") continue;
                
                if(parseInt(person.find(".level").innerText.replace("Level:", "")) <= parseInt(input_2.value)){
                    person.style.display = "block";
                } else {
                    person.style.display = "none";
                }
            }
        } else if(checkbox_1.checked && input_2.value == ""){
            checkbox_1.dispatchEvent(new Event("click"));
        }
        
        local_storage.change({"settings": {"bounties_filter": {"hide_unavailable": checkbox_1.checked, "max_level": parseInt(input_2.value)}}});
    });

    bountiesLoaded().then(function(){
        if(settings.bounties_filter.hide_unavailable){
            checkbox_1.dispatchEvent(new Event("click"));
        }

        if(settings.bounties_filter.max_level){
            input_2.dispatchEvent(new Event("keyup"));
        }
    });
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