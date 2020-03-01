Function.prototype.extend = function(fn) {
    var self = this;
    return function() {
        self.apply(this, arguments);
        fn.apply(this, arguments);
    };
};

window.onload = function(){
    console.log("TT - Global");

    if(flying())
        return

    chrome.storage.local.get(["updated"], function(data) {
        if(data.updated)
            showTTLink();
    });
}

function showTTLink(){
    let headers = document.querySelectorAll("h2");
    let container;
    for(let header of headers){
        if(header.innerText == "Areas")
            container = header.nextElementSibling;
    }

    let link = chrome.runtime.getURL("/views/settings.html");

    let div_1 = document.createElement("div");
    let div_2 = document.createElement("div");
    let a = document.createElement("a");
    let span = document.createElement("span");

    div_1.setAttribute("class", "area-desktop___2YU-q");
    div_2.setAttribute("class", "area-row___34mEZ");
    div_2.style.height = "25px";
    div_2.style.backgroundColor = "#93ff93";
    a.setAttribute("class", "desktopLink___2dcWC");
    a.setAttribute("href", link);
    a.setAttribute("target", "_blank");
    span.innerText = "TornTools updated: v" + chrome.runtime.getManifest().version;

    a.appendChild(span);
    div_2.appendChild(a);
    div_1.appendChild(div_2);
    container.insertBefore(div_1, container.firstChild);
}