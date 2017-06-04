window.onload = showPopup;

function showPopup() {
    let update = document.getElementById('updateEmail');
    let emailTo = document.getElementById('emailTo');

    chrome.storage.sync.get("emailTo", function(storage) {
        if (storage.emailTo) {
            emailTo.setAttribute("placeholder", storage.emailTo);
        }
    });

    update.addEventListener('click', () => {
            chrome.storage.sync.set({
                'emailTo': emailTo.value
            }, confirmUpdate);
    });

    function confirmUpdate() {
        update.value = '\u2714';
        update.classList.add('confirm');
        setTimeout(close, 800);
    }
}