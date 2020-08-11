window.addEventListener("load", function () {
    console.log("TT - Company");

    switch (getHashParameters().get("option")) {
        case "employees":
            if (settings.pages.company.member_info) showUserInfo();
            break;
        default:
            break;
    }

    // Employees
    doc.find("ul.company-tabs>li[aria-controls='employees']").addEventListener("click", function () {
        companyContentLoaded("employees").then(function () {
            if (settings.pages.company.member_info) showUserInfo();
        });
    });

});

function companyContentLoaded(aria_controls) {
    return new Promise(function (resolve, reject) {
        let checker = setInterval(function () {
            if (!doc.find(`#${aria_controls} .ajax-placeholder:not(.hide)`)) {
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function showUserInfo() {
    // fetchApi(`https://api.torn.com/company/?selections=`, api_key)
    fetchApi_v2('torn', { section: 'company' })
        .then(result => {
            console.log("result", result);

            doc.find("#employees .employee-list").classList.add("tt-modified");

            for (let user of doc.findAll("#employees .employee-list>li")) {
                let user_id = user.getAttribute("data-user");

                let li = doc.new({ type: "li", class: "tt-user-info" });
                let inner_wrap = doc.new({ type: "div", class: "tt-user-info-inner-wrap" });
                let texts = [
                    `Last action: ${result.company.employees[user_id].last_action.relative}`
                ]

                for (let text of texts) {
                    let div = doc.new({ type: "div", text: text });
                    inner_wrap.appendChild(div);

                    if (texts.indexOf(text) != texts.length - 1) {
                        let divider = doc.new({ type: "div", class: "tt-divider", text: "—" });
                        inner_wrap.appendChild(divider);
                    }
                }

                li.appendChild(inner_wrap);
                user.parentElement.insertBefore(li, user.nextElementSibling);

                // Activity notifications
                let checkpoints = settings.inactivity_alerts_company;
                for (let checkpoint of Object.keys(checkpoints).sort(function (a, b) { return b - a })) {
                    if (new Date() - new Date(result.company.employees[user_id].last_action.timestamp * 1000) >= parseInt(checkpoint)) {
                        console.log(checkpoints[checkpoint])
                        user.style.backgroundColor = `${checkpoints[checkpoint]}`;
                        break;
                    }
                }
            }
        })
        .catch(err => {
            console.log("ERROR", err);
        })
}