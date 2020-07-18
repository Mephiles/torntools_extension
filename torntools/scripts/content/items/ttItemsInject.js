(function(){
    const doc = document;

    Document.prototype.find = function (type) {
        if (type.indexOf("=") > -1) {
            let key = type.split("=")[0];
            let value = type.split("=")[1];

            for (let element of document.querySelectorAll(key)) {
                if (element.innerText == value) {
                    return element;
                }
            }

            try {
                this.querySelector(type)
            } catch(err){
                return undefined;
            }
        }
        return this.querySelector(type);
    }
    Element.prototype.find = function (type) {
        if (type.indexOf("=") > -1) {
            let key = type.split("=")[0];
            let value = type.split("=")[1];

            for (let element of document.querySelectorAll(key)) {
                if (element.innerText == value) {
                    return element;
                }
            }

            try {
                this.querySelector(type)
            } catch (err) {
                return undefined;
            }
        }
        return this.querySelector(type);
    }

    // Global functions
    function isJsonString(str) {
        if (!str || str === "") return false;

        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    /*
     * JavaScript Get URL Parameter (https://www.kevinleary.net/javascript-get-url-parameters/)
     */
    function getUrlParams(url, prop) {
        const search = decodeURIComponent(((url) ? url : window.location.href).slice(window.location.href.indexOf('?') + 1));
        const definitions = search.split('&');

        let params = {};
        definitions.forEach(function(val, key) {
            const parts = val.split('=', 2);

            params[parts[0]] = parts[1];
        });

        return (prop && prop in params) ? params[prop] : params;
    }

    function interceptRequest(callback) {
        const oldXHROpen = window.XMLHttpRequest.prototype.open;
        const oldXHRSend = window.XMLHttpRequest.prototype.send;

        window.XMLHttpRequest.prototype.open = function() {
            this.addEventListener('readystatechange', function() {
                if (this.readyState > 3 && this.status === 200) {
                    const page = this.responseURL.substring(this.responseURL.indexOf("torn.com/") + "torn.com/".length, this.responseURL.indexOf(".php"));

                    let json, uri;
                    if (isJsonString(this.response)) json = JSON.parse(this.response);
                    else uri = getUrlParams(this.responseURL);

                    callback({page, json, uri, xhr: this});
                }
            });

            return oldXHROpen.apply(this, arguments);
        }
        window.XMLHttpRequest.prototype.send = function(body) {
            this.requestBody = body;

            return oldXHRSend.apply(this, arguments);
        }
    }

    // Torn functions
    interceptRequest(({page, json, xhr}) => {
        if (page === "item" && json) {
            if (!json.success) return;

            const params = new URLSearchParams(xhr.requestBody);
            if (params.get("step") !== "useItem") return;
            if (params.has("fac") && params.get("fac") !== "0") return;

            const item = params.get("itemID");

            const quantity = doc.find(`#ttQuick .inner-content .item[item-id="${item}"] .tt-quickitems-quantity`);
            if (!quantity) return;

            let newQuantity = parseInt(quantity.getAttribute("quantity")) - 1;
            quantity.innerText = newQuantity + "x";
            quantity.setAttribute("quantity", newQuantity);
        }
    });

    console.log("Items script injected");
})();