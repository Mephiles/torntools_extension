export function appendItems(items, inner_content, completed){
	for(let item in items){
		let ach = items[item]["ach"]
		let stats = items[item]["stats"]

		if(!stats){
			this.addRow(`${item}: 0/${ach[0]}`, inner_content)
		} else if (stats >= ach[ach.length-1] && completed) {
			this.addRow(`${item}: Completed!`, inner_content)
		} else if(items[item]["extra"] === "###"){
			this.addRow(`${item}: ${stats}`, inner_content)
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
	html = html.replace("/undefined", "")

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

export function setAwardsWindow(window_, status, date){
	console.log("DATE", date)
	window_.header.innerHTML = `Awards <span style="font-size: 10px; color: orange">${time_ago(Date.parse(date))}</span>`;
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
	window_.last_block.insertBefore(window_.content, window_.last_block.firstChild);

	function time_ago(time) {

	  switch (typeof time) {
	    case 'number':
	      break;
	    case 'string':
	      time = +new Date(time);
	      break;
	    case 'object':
	      if (time.constructor === Date) time = time.getTime();
	      break;
	    default:
	      time = +new Date();
	  }
	  var time_formats = [
	    [60, 'seconds', 1], // 60
	    [120, '1 minute ago', '1 minute from now'], // 60*2
	    [3600, 'minutes', 60], // 60*60, 60
	    [7200, '1 hour ago', '1 hour from now'], // 60*60*2
	    [86400, 'hours', 3600], // 60*60*24, 60*60
	    [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
	    [604800, 'days', 86400], // 60*60*24*7, 60*60*24
	    [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
	    [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
	    [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
	    [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
	    [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
	    [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
	    [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
	    [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
	  ];
	  var seconds = (+new Date() - time) / 1000,
	    token = 'ago',
	    list_choice = 1;

	  if (seconds == 0) {
	    return 'Just now'
      }
      if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
      }
      var i = 0,
        format;
      while (format = time_formats[i++])
        if (seconds < format[0]) {
          if (typeof format[2] == 'string')
            return format[list_choice];
          else
            return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
        }
      return time;
    }
}