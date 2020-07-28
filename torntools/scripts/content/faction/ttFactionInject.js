(function(){
    interceptXHR("tt-xhr");

    console.log("Faction script injected");
})();

function interceptFetch(channel) {
    const oldFetch = window.fetch;
    window.fetch = function() {
        return new Promise((resolve, reject) => {
            oldFetch.apply(this, arguments)
                .then(async (response) => {
                    const page = response.url.substring(response.url.indexOf("torn.com/") + "torn.com/".length, response.url.indexOf(".php"));
                    const json = await response.clone().json();

                    window.dispatchEvent(new CustomEvent(channel, {
                        detail: {page, json, fetch: response.clone()}
                    }));

                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                })
        });
    }
}

function interceptXHR(channel) {
    const oldXHROpen = window.XMLHttpRequest.prototype.open;
    const oldXHRSend = window.XMLHttpRequest.prototype.send;

    window.XMLHttpRequest.prototype.open = function() {
        this.addEventListener('readystatechange', function() {
            if (this.readyState > 3 && this.status === 200) {
                const page = this.responseURL.substring(this.responseURL.indexOf("torn.com/") + "torn.com/".length, this.responseURL.indexOf(".php"));

                let json, uri;
                if (isJsonString(this.response)) json = JSON.parse(this.response);
                else uri = getUrlParams(this.responseURL);

                window.dispatchEvent(new CustomEvent(channel, {
                    detail: {page, json, uri, xhr: {...this}}
                }));
            }
        });

        return oldXHROpen.apply(this, arguments);
    }
    window.XMLHttpRequest.prototype.send = function(body) {
        this.requestBody = body;

        return oldXHRSend.apply(this, arguments);
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
}