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
            } catch(err){
                return undefined;
            }
        }
        return this.querySelector(type);
    }

    $(".content-wrapper").off("submit");

    $(".content-wrapper").on("submit", "form", function (event) {
        console.log("TornTools - hijack");
        
        let loadingPlaceholderContent = `
        <div class="content-title m-bottom10">
            <h4 class="left">Crimes</h4>
            <hr class="page-head-delimiter">
            <div class="clear"></div>
        </div>`

        loadingPlaceholderContent += `<div id="ttQuick">${doc.find("#ttQuick").innerHTML}</div>`;
        loadingPlaceholderContent += `<img class="ajax-placeholder" src="/images/v2/main/ajax-loader.gif"/>`;

        let formElement = this;
        var $form = $(formElement);
        if (formElement.isSubmitting) return;
        formElement.isSubmitting = true;
        event.preventDefault();
        var data = $form.serializeArray();
        window.location.hash = "#";
        $(".content-wrapper").html(loadingPlaceholderContent);

        var action = $form.attr("action");
        action = action[0] == "/" ? action.substr(1) : action;
        var urlParamsDelimier = action.indexOf("?") > -1 ? "&" : "?";
        action += urlParamsDelimier + "timestamp=" + Date.now();
        ajaxWrapper({
            url: action,
            type: "POST",
            data: data,
            oncomplete: function (resp) {
                preventTextSelectionOnDoubleClick({ invokeType: "callback", duaration: 500 });
                formElement.isSubmitting = false;

                if(resp.responseText.indexOf("success-message") == -1 && resp.responseText.indexOf("ready-message") == -1){
                    $(".content-wrapper").html(resp.responseText);
                } else {
                    let parts = resp.responseText.split('<div class="tutorial-cont');
                    let top = parts[0];
                    let middle = doc.createElement("div");
                        middle.id = "ttQuick";
                        middle.innerHTML = doc.find("#ttQuick").innerHTML;
                    let bottom = '<div class="tutorial-cont'+parts[1];

                    doc.find(".content-wrapper").innerHTML = top;
                    doc.find(".content-wrapper").appendChild(middle);
                    doc.find(".content-wrapper").innerHTML += bottom;
                }

                initCrimes();
                var steps = action.split("?"),
                    step = steps[1] ? steps[1].split("=")[1] : "";
                if (step == "docrime2" || step == "docrime4") refreshTopOfSidebar();
                if (animElement) clearTimeout(animElement);
                highlightElement("/" + step + ".php");
            },
            onerror: function (ee) {
                console.error(ee);
            },
        });
    });

    // Torn functions
    function initCrimes() {
        if ($(".content-wrapper").find(".choice-container input.radio-css").is(":checked")) {
            activateDoSpecialButton();
        }
    }
    function activateDoSpecialButton() {
        $(".content-wrapper").find(".special.btn-wrap .torn-btn").prop("disabled", false);
    }

    console.log("Quick Crime script injected");
})();