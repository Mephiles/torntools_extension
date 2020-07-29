requireDatabase().then(function(){
	vaultLoaded().then(function(){
        console.log("TT - Properties | Vault Sharing");

        if(!settings.pages.properties.vault_sharing){
            return;
        }

        Main(vault);

        window.addEventListener("hashchange", function(){
            if(doc.find("#tt-vault-container")){
                return;
            }
            
            vaultLoaded().then(function(){
                ttStorage.get("vault", function(vault){
                    Main(vault);
                })
            });
        });
    });
});

function Main(vault, need_to_save){
    console.log("VAULT", vault);
    let vault_container = content.newContainer("Vault Sharing", {id: "tt-vault-container", next_element: doc.find(".vault-wrap+hr")}).find(".content");

    if(!vault.initialized){
        // Sub Heading
        let sub_heading = doc.new("div");
            sub_heading.setClass("sub-heading");
            sub_heading.innerText = "Please enter the amount of money owned by either user.";

        vault_container.appendChild(sub_heading);
    }

    // Container
    let split = doc.new("div");
        split.setClass("split");

    // divider
    if(!vault.initialized){
        let divider = doc.new("span");
            divider.setClass("divider");
            divider.innerText = "- OR -";
        split.appendChild(divider);
    } else {  // Check history for changes
        for(let transaction of doc.findAll("ul.vault-trans-list>li:not(.title)")){
            console.log("looping");
            let date = transaction.find(".date .transaction-date").innerText;
            let date_parts = date.split("/")
            let time = transaction.find(".date .transaction-time").innerText;

            var months = [ "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December" ];

            let transaction_date = new Date(`${months[parseInt(date_parts[1])-1]} ${date_parts[0]}, ${date_parts[2]} ${time}`);

            if(transaction_date > new Date(vault.last_transaction)){
                console.log("found");
                let username = doc.find(".menu-info-row___3lvjL a").innerText;
                let user = true;
                let type = "withdraw";
                let amount = parseInt(transaction.find("li.amount").innerText.replace("$", "").replace(/,/g, ""));

                if(transaction.find("li.user a.user.name span").getAttribute("title").indexOf(username) == -1){
                    user = false;
                }
                if(transaction.find("li.type").innerText.indexOf("Deposit") > -1){
                    type = "deposit";
                }

                console.log("User", user);
                console.log("Type", type);
                console.log("Amount", amount);
                
                if(user){
                    vault.user.current_money = (type == "withdraw" ? vault.user.current_money - amount : vault.user.current_money + amount);
                } else {
                    vault.partner.current_money = (type == "withdraw" ? vault.partner.current_money - amount : vault.partner.current_money + amount);
                }

                need_to_save = true;

            } else {
                console.log("No new transactions.")
                break;
            }
        }
    }

    // left
    let left_side = doc.new("div");
        left_side.setClass("column");

    let left_text = doc.new("div");
        left_text.innerText = "Your share:";

    let left_input = doc.new("input");
        left_input.setAttribute("type", "text");
        left_input.value = numberWithCommas(vault.user.current_money, shorten=false) || numberWithCommas(total_money, shorten=false);

    left_side.appendChild(left_text);
    left_side.appendChild(left_input);
    split.appendChild(left_side);
        
    // right
    let right_side = doc.new("div");
        right_side.setClass("column");

    let right_text = doc.new("div");
        right_text.innerText = "Partner's share:";

    let right_input = doc.new("input");
        right_input.setAttribute("type", "text");
        right_input.value = numberWithCommas(vault.partner.current_money, shorten=false) || 0;

    right_side.appendChild(right_text);
    right_side.appendChild(right_input);
    split.appendChild(right_side);

    // Save
    let saving_div = doc.new("div");
        saving_div.setClass("save-div");
    let saving_text = doc.new("div");
        saving_text.setClass("text");
        saving_text.innerText = "save";
    let saving_img_div = doc.new("div");
        saving_img_div.setClass("loading-icon");
        saving_img_div.style.backgroundImage = `url(${chrome.runtime.getURL("images/loading.gif")})`;

    saving_div.appendChild(saving_text);
    saving_div.appendChild(saving_img_div);
    vault_container.appendChild(split);
    vault_container.appendChild(saving_div);

    // Logic
    let total_money = parseInt(doc.find(".vault-cont .wvalue").innerText.replace(/,/g, ""));

    // Input changes
    left_input.addEventListener("keyup", function(){
        let left_value = parseInt(left_input.value.replace(/,/g, "")) || 0;
        let right_value = total_money - left_value;

        if(left_value > total_money){
            left_value = total_money;
            right_value = 0;
        }

        left_input.value = numberWithCommas(left_value, shorten=false);
        right_input.value = numberWithCommas(right_value, shorten=false);
    });

    right_input.addEventListener("keyup", function(){
        let right_value = parseInt(right_input.value.replace(/,/g, "")) || 0;
        let left_value = total_money - right_value;

        if(right_value > total_money){
            right_value = total_money;
            left_value = 0;
        }

        right_input.value = numberWithCommas(right_value, shorten=false);
        left_input.value = numberWithCommas(left_value, shorten=false);
    });

    // Saving
    saving_text.addEventListener("click", function(){
        if(saving_text.classList.contains("active")){
            return;
        }

        // Saving text
        saving_text.classList.add("active");
        saving_text.innerText = "saving..";
        saving_img_div.style.display = "inline-block";

        // Data
        let user_value = parseInt(left_input.value.replace(/,/g, "")) || 0;
        let partner_value = parseInt(right_input.value.replace(/,/g, "")) || 0;

        console.log("User's share", user_value);
        console.log("Partner's share", partner_value);

        let last_transaction = getLastTransactionDate();
        console.log("Last Transaction", last_transaction);

        vault.user.current_money = user_value;
        vault.partner.current_money = partner_value;
        ttStorage.set({"vault": {
            "initialized": true,
            "last_transaction": last_transaction.toString(),
            "total_money": total_money,
            "user": {
                "initial_money": vault.initialized ? vault.user.initial_money : user_value,
                "current_money": user_value
            },
            "partner": {
                "initial_money": vault.initialized ? vault.partner.initial_money : partner_value,
                "current_money": partner_value
            }
        }}, function(){
            console.log("Vault info set.");

            // Saving complete
            saving_text.innerText = "saved!";
            saving_img_div.style.display = "none";

            setTimeout(function(){
                saving_text.classList.remove("active");
                saving_text.innerText = "save";
            }, 1000);
        });
    });

    // Widthdraw & Deposit reload
    doc.find("input[value=WITHDRAW]").addEventListener("click", function(event){
        if(!event.target.parentElement.parentElement.classList.contains("disable")){
            let amount = parseInt(doc.find(".withdraw-icon+div input[name=withdraw]").getAttribute("value"));
            
            containerRemoved().then(function(){
                vault.user.current_money = vault.user.current_money - amount;
                vault.last_transaction = getLastTransactionDate();
                Main(vault, true);
            });
        }
    });
    doc.find("input[value=DEPOSIT]").addEventListener("click", function(event){
        if(!event.target.parentElement.parentElement.classList.contains("disable")){
            let amount = parseInt(doc.find(".deposit-icon+div input[name=deposit]").getAttribute("value"));
            
            containerRemoved().then(function(){
                vault.user.current_money = vault.user.current_money + amount;
                vault.last_transaction = getLastTransactionDate();
                Main(vault, true);
            });
        }
    });

    if(need_to_save){
        saving_text.click();
    }
}

function vaultLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".withdraw-icon")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function getLastTransactionDate(){
    let date = doc.find("ul.vault-trans-list>li:not(.title) .date .transaction-date").innerText;
    let date_parts = date.split("/")
    let time = doc.find("ul.vault-trans-list>li:not(.title) .date .transaction-time").innerText;

    var months = [ "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December" ];

    return new Date(`${months[parseInt(date_parts[1])-1]} ${date_parts[0]}, ${date_parts[2]} ${time}`);
}

function containerRemoved(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            console.log("checking")
            if(!doc.find("#tt-vault-container")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}