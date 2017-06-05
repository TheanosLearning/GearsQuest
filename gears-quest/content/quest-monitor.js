// check for updates every 30 sec
setInterval(checkQuests, 30 * 1000);

let questIds = new Set();

function selectQuestsTab() {
    let sidebar = document.getElementById('sidebar');
    let tabs = sidebar.querySelector('div.footer');
    let quests = Array.from(tabs.children).filter(item => item.innerText === "Quests").pop();
    if (quests && !quests.className.includes("active")) {
        quests.click();
    }
}

function checkQuests() {
    selectQuestsTab();
    questLog("Checking for quest updates.");
    let sidebar = document.getElementById('sidebar');
    let quests = Array.from(sidebar.querySelectorAll('div.quest-wrapper.completed'));
    quests.map(q => claim(q));
}

// when reward is officially ready, claim and send email notification
function claim(quest) {
    let questId = quest.dataset.questId;
    let claimable = !questIds.has(questId);
    if (claimable) {
        questLog("Quest " + questId + " is claimable.");
        let rewardBtn = quest.querySelector('.reward .button');
        rewardBtn.click();
        // click outside of confirmation text
        setTimeout(document.querySelector('.dobi-modal-backdrop').click(), 5 * 1000);
        questIds.add(questId);
        setTimeout(() => getDataUrl(quest), 10 * 1000);
    }
}

function getDataUrl(quest) {
    html2canvas(quest, {
        onrendered: function(canvas) {
        	let imgBase64 = canvas.toDataURL("image/png");
            let title = quest.querySelector('.title').innerText;
        	notifyUser(imgBase64, title);
        }
    });
}

function notifyUser(imgBase64, rewardTitle) {
    chrome.runtime.sendMessage({
        rewardImage: imgBase64.replace('data:image/png;base64,', ''),
        rewardTitle: rewardTitle
    }, function(response) {
        questLog("Quest claimed! Sending notification to user.");
    });
}

function questLog(message) {
    const marquee = {
        text: "Gears Quest",
        style: "font-size:40px;color:#da2317;font-family:Arial Black;"
    }
    console.log("%c" + marquee.text, marquee.style);
    console.info(`[${marquee.text}] ${message}`);
}