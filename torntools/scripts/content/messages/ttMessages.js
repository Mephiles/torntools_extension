window.addEventListener('load', async (event) => {
    console.log("TT - Messages");

    if(await flying() || await abroad())
        return;

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
    // Setup
    let button = doc.new("div");
        button.id = "ttMassMessages";
        button.innerText = "Mass Messages: ";
    let span = doc.new("span");
        span.innerText = mass_messages.active ? "Enabled" : "Disabled";
        span.setClass((mass_messages.active ? "enabled": "disabled"));

    button.appendChild(span);
    doc.find(".mailbox-container form>div").style.position = "relative";
    doc.find(".mailbox-container form>div").appendChild(button);

    button.addEventListener("click", function(event){
        if(event.srcElement.nodeName == "DIV"){
            if(event.target.firstElementChild.innerText == "Enabled"){
                event.target.firstElementChild.innerText = "Disabled";
                event.target.firstElementChild.setClass("disabled");

                local_storage.change({"mass_messages": {
                    "index": 0,
                    "message": "",
                    "active": false,
                    "subject": ""
                }}, function(){
                    local_storage.get("mass_messages", function(mass_messages){
                        console.log("mass_messages", mass_messages);
                    });
                });

            } else {
                event.target.firstElementChild.innerText = "Enabled";
                event.target.firstElementChild.setClass("enabled");

                doc.find("#ac-search-1").value = getFirstName(mass_messages);
            }
        } else if(event.srcElement.nodeName == "SPAN"){
            if(event.target.innerText == "Enabled"){
                event.target.innerText = "Disabled";
                event.target.setClass("disabled");

                local_storage.change({"mass_messages": {
                    "index": 0,
                    "message": "",
                    "active": false,
                    "subject": ""
                }}, function(){
                    local_storage.get("mass_messages", function(mass_messages){
                        console.log("mass_messages", mass_messages);
                    });
                });
            } else {
                event.target.innerText = "Enabled";
                event.target.setClass("enabled");

                doc.find("#ac-search-1").value = getFirstName(mass_messages);
            }
        }
    });

    // Main
    if(mass_messages.active){
        console.log("Filling boxes");
        if(doc.find("#ac-search-1")){
            doc.find("#ac-search-1").value = getNextName(mass_messages);
        } else if(doc.find(".user-id.ac-search.message-search")){
            doc.find(".user-id.ac-search.message-search").value = getNextName(mass_messages);
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
            "index": parseInt(mass_messages.index)+1,
            "message": message,
            "active": true,
            "subject": subject
        }});
    });
}

function getNextName(mass_messages){
    return "Mephiles [2087524]";
}

function getFirstName(mass_messages){
    return "Mephiles [2087524]";
}