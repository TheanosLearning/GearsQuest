const marquee = {
	text: "Gears Quest",
	style: "font-size:40px;color:#da2317;font-family:Arial Black;"
}

// wait for page to load and then select `Quests` tab
//setTimeout(selectQuestsTab, 10 * 1000);

// check for updates every 10 sec
//setInterval(checkQuests, 10 * 1000);

let questsLoaded = false;

function selectQuestsTab() {
    let sidebar = document.getElementById('sidebar');
    let footer = sidebar.querySelector('div.footer');
    let quests = Array.from(footer.children).filter(item => item.innerText === "Quests").pop();
    if (quests && !quests.className.includes("active")) {
        quests.click();
    }
    questsLoaded = true;
}

function checkQuests() {
    if (questsLoaded) {
        let sidebar = document.getElementById('sidebar');
        let quest = sidebar.querySelectorAll('[data-quest-id]')[0];
        let rewardBtn = quests.querySelector('.reward .button');
        if (rewardBtn.innerText.toUpperCase().includes("SUBMIT ENTRY")) {
            // claim the reward and send out an email notification
            rewardBtn.click();
            getDataUrl();
        }
    }
}

function getDataUrl() {
    // let sidebar = document.getElementById('sidebar');
    // let quest = sidebar.querySelectorAll('[data-quest-id]')[0];
    // let reward = quest.querySelector('.reward-description');
    // html2canvas(reward, {
    //     onrendered: function(canvas) {
    //     	let imgBase64 = canvas.toDataURL("image/png")
    //     	notifyUser(imgBase64);
            
    //     }
    // });
    
    let sidebar = document.getElementById('sidebar');
    let chat = sidebar.querySelector('.icon.icon-chat');
    
    html2canvas(chat, {
        onrendered: function(canvas) {
        	let imgBase64 = canvas.toDataURL("image/png");
        	notifyUser(imgBase64);
        }
    });
}

function notifyUser(imgBase64) {
    chrome.runtime.sendMessage({
        image: imgBase64.replace('data:image/png;base64,', '')
    }, function(response) {
    	console.clear();
    	console.log("%c" + marquee.text, marquee.style);
        console.info("Sending quest update notification to user.");
    });
}

function init() {
	let footer = document.getElementById('footer');
	footer.addEventListener("click", getDataUrl);
}

window.onload = init;