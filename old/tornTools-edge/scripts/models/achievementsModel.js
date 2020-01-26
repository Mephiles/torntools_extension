export function appendItems(items, inner_content, completed){
	for(let item in items){
		let ach = items[item]["ach"]
		let stats = items[item]["stats"]

		if(!stats){
			this.addRow(`${item}: 0/${ach[0]}`, inner_content)
		} else if (stats >= ach[ach.length-1] && completed) {
			this.addRow(`${item}: Completed!`, inner_content)
		} else {
			for(let milestone of ach){
				if(stats < milestone){
					this.addRow(`${item}: ${stats}/${milestone}`, inner_content)
					break;
				}
			}
		}
	}
}

export function setItemHonors(items, honors){
	for(let item in items){
		let term;
		if(items[item]["alt"]){
			term = items[item]["alt"][0]
		} else {
			term = item.split(" ")[0]
		}

		for(let honor in honors) {
			let desc = honors[honor].description;

			if(desc.indexOf(term) !== -1 || desc.indexOf(term.toLowerCase()) !== -1){
				if(items[item]["excl"]){
					let unique = true;
					for(let word of items[item]["excl"]){
						if(desc.indexOf(word) !== -1 || desc.indexOf(word.capitalize()) !== -1){
							unique = false
						}
					}
					if(unique){
						let nr = parseInt(desc.replace(/\D/g,''));
						if(!isNaN(nr)){
							items[item]["ach"].push(nr)
						}
					}
				} else if(items[item]["incl"]){
					let correct = true;
					for(let word of items[item]["incl"]){
						if(desc.indexOf(word) === -1 && desc.indexOf(word.capitalize()) === -1){
							correct = false;
						}
					}
					if(correct) {
						let nr = parseInt(desc.replace(/\D/g,''));
						if(!isNaN(nr)){
							items[item]["ach"].push(nr)
						}
					}
				} else {
					let nr = parseInt(desc.replace(/\D/g,''));
					if(!isNaN(nr)){
						items[item]["ach"].push(nr)
					}
				}
			}
		}
		items[item]["ach"].sort(function(a,b){return a-b})
	}

	return items
}

export function addRow(html, inner_content){
	let row = document.createElement("div");
	let row_inner = document.createElement("div");
	row.classList.add("area-desktop___29MUo");
	if(status == "hospital"){row.classList.add("in-hospital___2RRIG")}
	else if(status == "jail"){row.classList.add("in-jail___3XdP8")}
	row_inner.innerHTML = this.numberWithCommas(html);
	row_inner.classList.add("area-row___51NLj")
	row_inner.style.height = "23px"
	row_inner.style.lineHeight = "23px"
	row_inner.style.paddingLeft = "5px"

	if(html.slice(-10) === "Completed!"){
		row_inner.style.color = "#11c511"
	}

	row.appendChild(row_inner)
	inner_content.appendChild(row)
}

export function getStatus(){
	let nav = document.querySelector("#sidebarroot");
	
	if(!nav){
		return "flying";
	}
	
	let hdr = nav.firstElementChild.firstElementChild
				.firstElementChild.firstElementChild
				.firstElementChild.firstElementChild
				.firstElementChild;

	for(let class_ of hdr.classList){
		if(class_.indexOf("hospital") !== -1){
			return "hospital";
		} else if (class_.indexOf("in-jail") !== -1){
			return "jail";
		}
	}
	return "okay";
}

export function createAwardsWindow(){
	// Create window
	var containers = document.getElementsByClassName("sidebar-block___1Cqc2");
	var last_block = containers[containers.length-1]

	var content = document.createElement("div");
	var block = document.createElement("div");
	var header = document.createElement("h2");
	var inner_content = document.createElement("div");

	return {last_block: last_block, content: content, block: block, header: header, inner_content: inner_content}
}

export function setAwardsWindow(window_, status){
	window_.header.innerText = "Awards";
	window_.content.classList.add("content___kMC8x");
	window_.block.classList.add("toggle-block___13zU2");
	window_.header.classList.add("header___30pTh");
	window_.header.classList.add("desktop___vemcY")
	if(status == "hospital"){window_.header.classList.add("in-hospital___3XdP8")}
	else if(status == "jail"){window_.header.classList.add("in-jail___nwOPJ")}
	window_.inner_content.classList.add("toggle-content___3XKOC");

	window_.block.appendChild(window_.header)
	window_.block.appendChild(window_.inner_content)
	window_.content.appendChild(window_.block)
	window_.last_block.insertBefore(window_.content, window_.last_block.firstChild)
}