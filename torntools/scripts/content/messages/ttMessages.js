window.addEventListener('load', async (event) => {
    console.log("TT - Messages");

    if(await flying() || await abroad()){
        return;
    }

    if(window.location.hash == "#/p=compose"){
        local_storage.get(["personalized", "mass_messages"], function([personalized, mass_messages]){
            if(personalized.mass_messages){
                console.log("MASS MESSAGES", mass_messages);
                
                messageBoxLoaded().then(function(loaded){
                    if(!loaded)
                        return;
                    
                    massMessages(mass_messages);
                });
            }
        });
    }

    document.addEventListener("click", function(event){
        if(event.srcElement.href == "https://www.torn.com/messages.php#/p=compose"){
            console.log("click");
            local_storage.get(["personalized", "mass_messages"], function([personalized, mass_messages]){
                if(personalized.mass_messages){
                    console.log("MASS MESSAGES", mass_messages);
                    
                    messageBoxLoaded().then(function(loaded){
                        if(!loaded)
                            return;
                        
                        massMessages(mass_messages);
                    });
                }
            });
        }
    });
});

function messageBoxLoaded(){
    let promise = new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            console.log("checking")
            if(
                window.location.hash.indexOf("compose") > -1 && doc.find(".mailbox-container form>div") && 
            ((doc.find("#mailcompose_ifr") && doc.find("#mailcompose_ifr").contentWindow.document.querySelector("#tinymce")) || doc.find("#mailcompose"))){
                resolve(true);
                return clearInterval(checker);
            }
        }, 500);
    });

    return promise.then(function(data){
        return data;
    });
}

function massMessages(mass_messages){
    // went over = all done
    if(mass_messages.list.length == mass_messages.index){
        mass_messages = {
            active: false,
            index: 0,
            message: "",
            subject: "",
            list: mass_messages.list
        }
        local_storage.change({"mass_messages": mass_messages});
    }

    // Setup NAMELIST
        let name_list = doc.new({type: "div", id: "ttNameList"});

        for(let name of mass_messages.list){
            let item = doc.new({type: "div", text: name});
            let icon = doc.new({type: "i", class: "fas fa-times"});

            item.appendChild(icon);
            name_list.appendChild(item);

            // Remove item
            icon.addEventListener("click", function(){
                item.remove();

                mass_messages.list.splice(mass_messages.list.indexOf(name), 1);
                // Update list
                local_storage.change({"mass_messages": {"list": mass_messages.list}});
            });
        }

        let input_item = doc.new({type: "div", class: "input"});
        let input = doc.new({
            type: "input",
            attributes: {
                "type": "text",
                "placeholder": "Add.."
            }
        });
        let add_icon = doc.new({type: "i", class: "fas fa-plus", id: "tt_add_name"});
        
        input_item.appendChild(input);
        input_item.appendChild(add_icon);
        name_list.appendChild(input_item);

        doc.find(".mailbox-container form>div").style.position = "relative";
        doc.find(".mailbox-container form>div").style.height = "70px";
        doc.find(".mailbox-container form>div").appendChild(name_list);

        // Auto-scroll down
        name_list.scrollTop = name_list.scrollHeight;

        // Add to list
        add_icon.addEventListener("click", function(){
            mass_messages.list.push(input.value);
            let row = doc.new({type: "div", text: input.value});
            let remove_icon = doc.new({type: "i", class: "fas fa-times"});

                // Remove item
                remove_icon.addEventListener("click", function(){
                    row.remove();

                    mass_messages.list.splice(mass_messages.list.indexOf(name), 1);
                    // Update list
                    local_storage.change({"mass_messages": {"list": mass_messages.list}});
                });

            row.appendChild(remove_icon);
            name_list.insertBefore(row, input_item);

            // Auto-scroll down
            name_list.scrollTop = name_list.scrollHeight;

            // Clear input
            input.value = "";

            console.log("NAMES", mass_messages.list);

            // Save list
            local_storage.change({"mass_messages": {"list": mass_messages.list}})
        });

    // Setup BUTTONS
        // Enable/Disable Button
        let active_button = doc.new({type: "div", id: "ttMassMessages", text: "Mass Messages: "});
        let span = doc.new({
            type: "span", 
            text: mass_messages.active? "Enabled" : "Disabled", 
            class: mass_messages.active? "enabled" : "disabled"
        });
    
        active_button.appendChild(span);
        doc.find(".mailbox-container form>div").appendChild(active_button);
    
        // How many left
        if(mass_messages.active){
            let span = doc.new({type: "span", text: `${mass_messages.list.length - mass_messages.index} letter(s) left`, id: "ttMassMessagesNote"});
            doc.find(".mailbox-container form>div").appendChild(span);
        }
    
        // Clear all button
        let clear_all = doc.new({type: "div", id: "tt-clear-all", text: "Clear List"});
        doc.find(".mailbox-container form>div").appendChild(clear_all);
        clear_all.addEventListener("click", function(){
            local_storage.change({"mass_messages": {"list": []}}, function(){
                mass_messages.list = [];
                for(let item of doc.findAll("#ttNameList div:not(.input)")){
                    item.remove();
                }
    
                // Disable if needed
                if(active_button.find("span").classList.contains("enabled")){
                    active_button.click();
                }
            });
        });

    // Main
    if(mass_messages.active){
        console.log("Filling boxes");
        if(doc.find("#ac-search-1")){
            doc.find("#ac-search-1").value = mass_messages.list[mass_messages.index];
        } else if(doc.find(".user-id.ac-search.message-search")){
            doc.find(".user-id.ac-search.message-search").value = mass_messages.list[mass_messages.index];
        }
        doc.find(".subject").value = mass_messages.subject;

        if(doc.find("#mailcompose_ifr")){
            doc.find("#mailcompose_ifr").contentWindow.document.querySelector("#tinymce").innerText = mass_messages.message;
        } else if(doc.find("#mailcompose")){
            doc.find("#mailcompose").value = mass_messages.message;
        }
    }

    // SEND button
    doc.find(".form-message-input-text .form-submit-wrapper input").addEventListener("click", function(){
        let subject = doc.find(".subject").value;
        let message = doc.find("#mailcompose_ifr").contentWindow.document.querySelector("#tinymce").innerText || doc.find("#mailcompose").innerText;

        local_storage.change({"mass_messages": {
            "index": mass_messages.index+1,
            "message": message,
            "active": true,
            "subject": subject
        }});
    });

    // Enable/Disable mass messages
    active_button.addEventListener("click", function(event){
        if(event.srcElement.nodeName == "DIV"){
            if(event.target.firstElementChild.innerText == "Enabled"){
                console.log("DISABLED");
                event.target.firstElementChild.innerText = "Disabled";
                event.target.firstElementChild.setClass("disabled");

                // remove note
                doc.find("#ttMassMessagesNote").innerText = "0 letter(s) left";
                doc.find("#ttMassMessagesNote").style.display = "none";

                local_storage.change({"mass_messages": {
                    "index": 0,
                    "message": "",
                    "active": false,
                    "subject": ""
                }});

            } else {
                console.log("ENABLED");
                event.target.firstElementChild.innerText = "Enabled";
                event.target.firstElementChild.setClass("enabled");

                // add note
                if(doc.find("#ttMassMessagesNote")){
                    doc.find("#ttMassMessagesNote").innerText = `${mass_messages.list.length} letter(s) left`;
                    doc.find("#ttMassMessagesNote").style.display = "block";
                } else {
                    let span = doc.new({type: "span", text: `${mass_messages.list.length} letter(s) left`, id: "ttMassMessagesNote"});
                    doc.find(".mailbox-container form>div").appendChild(span);
                }

                doc.find("#ac-search-1").value = mass_messages.list[0];
            }
        } else if(event.srcElement.nodeName == "SPAN"){
            if(event.target.innerText == "Enabled"){
                console.log("DISABLED");
                event.target.innerText = "Disabled";
                event.target.setClass("disabled");

                // remove note
                doc.find("#ttMassMessagesNote").innerText = "0 letter(s) left";
                doc.find("#ttMassMessagesNote").style.display = "none";

                local_storage.change({"mass_messages": {
                    "index": 0,
                    "message": "",
                    "active": false,
                    "subject": ""
                }});
            } else {
                console.log("ENABLED");
                event.target.innerText = "Enabled";
                event.target.setClass("enabled");

                // add note
                if(doc.find("#ttMassMessagesNote")){
                    doc.find("#ttMassMessagesNote").innerText = `${mass_messages.list.length} letter(s) left`;
                    doc.find("#ttMassMessagesNote").style.display = "block";
                } else {
                    let span = doc.new({type: "span", text: `${mass_messages.list.length} letter(s) left`, id: "ttMassMessagesNote"});
                    doc.find(".mailbox-container form>div").appendChild(span);
                }

                doc.find("#ac-search-1").value = mass_messages.list[0];
            }
        }
    });
}