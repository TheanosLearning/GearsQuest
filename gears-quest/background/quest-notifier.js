chrome.runtime.onMessage.addListener(
    function(req) {
        let options = {
            type: "image",
            title: "Gears Quest Update:",
            message: `The ${req.rewardTitle} is ready for you to claim!`,
            iconUrl: "img/reward48.png",
            requireInteraction: true,
            imageUrl: "https://prodcmsassets.blob.core.windows.net:443/media/Default/E-Sports/Evan/Maestro/submitgif-caaa16d7a9a0476e9502a614e0e31dce.gif"
        }
        chrome.notifications.create('GearsQuest', options);
        imgur.uploadImg(req.rewardImage, req.rewardTitle);
    }
);

// RFC 2822 specification https://tools.ietf.org/html/rfc2822#appendix-A
function webSafeBase64(email) {
  return btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sendEmail(imgURL = "http://i.imgur.com/U8a2EHc.png", imgTitle = "Quest Reward") {
  gmail.xhrWithAuth(imgURL, imgTitle);
}

// imgur API v3 https://apidocs.imgur.com
let imgur = {

    clientId: '407efac196bb4bd',
    albumHash: '8LR9FGKu85h2ALx',
    uploadURL: 'https://api.imgur.com/3/image',

    uploadImg(imgBase64, title) {

        let data = new FormData();
        data.append("image", imgBase64);
        data.append("album", imgur.albumHash);
        data.append("title", title);
        data.append("type", "base64");

        let headers = new Headers();
        headers.append('Authorization', 'Client-ID ' + imgur.clientId);

        let imgurRequest = new Request(imgur.uploadURL, {
            method: 'POST',
            headers: headers,
            body: data
        });

        fetch(imgurRequest).then((res) =>
            res.json()).then((rJson) => {
            let imgURL = rJson.data.link.replace('http:', 'https:');
            sendEmail(imgURL, title);
        });
    }
}

let gmail = {
    oAuthRetry: true,
    errorRetry: true,
    url: "https://www.googleapis.com/gmail/v1/users/me/messages/send?alt=json",

    xhrWithAuth(rewardImgURL, rewardTitle) {
        let access_token;
        getToken();

        function getToken() {
            chrome.identity.getAuthToken({
                interactive: false
            }, function(token) {
                if (chrome.runtime.lastError) {
                    gmail.onResponse(chrome.runtime.lastError);
                    return;
                }
                access_token = token;
                postEmail();
            });
        }

        function postEmail() {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", gmail.url);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
            xhr.onload = requstComplete;

            chrome.storage.sync.get("emailTo", (storage) => {
                // email template
                const bodyStyle = "style=\"background-position: 50% 30%;color:white;background-image:url(https://static-cdn.jtvnw.net/jtv_user_pictures/gearsofwar-channel_offline_image-d199e49000f76bc5-1920x1080.jpeg)\"";
                const h1Style = "style=\"background-color:#da2317;padding:5px;text-align:center\"";
                // TODO: use ES6 template literals
                let email =
                    "To: " + storage.emailTo + "\r\n" +
                    "Subject: Gears Quest\r\n" +
                    "Content-Type: text/html; charset=utf-8\r\n" +
                    "Content-Transfer-Encoding: base64\r\n\r\n" +

                    "<body " + bodyStyle + ">" +
                      "<header>" +
                        "<h1 " + h1Style + ">The " + rewardTitle + " has been claimed!</h1>" +
                      "</header>" +
                      "<p>" +
                        "<a href=\"http://live.gearsofwar.com\" target=\"_blank\">" +
                          "<img src=\"" + rewardImgURL + "\" alt=\"@live.gearsofwar.com\"/>" +
                        "</a>" +
                      "</p>" +
                    "</body>";

                let emailWebSafeBase64 = webSafeBase64(email);
                let requestPayload = {
                    'raw': emailWebSafeBase64
                }
                xhr.send(JSON.stringify(requestPayload));
            });

        }

        function requstComplete() {
            if (this.status == 401) {
                chrome.identity.removeCachedAuthToken({
                        token: access_token
                    },
                    getToken);
            } else {
                gmail.onResponse(null, this.status, this.response);
            }
        }
    },

    getTokenInteractive() {
        chrome.identity.getAuthToken({
            interactive: true
        }, function(token) {
            if (request.errorRetry) {
                request.errorRetry = false;
                access_token = token;
                return;
            }
        });
    },

    onResponse(error, status, response) {
        if (!error && status == 200) {
            let messageStatus = JSON.parse(response).labelIds[0];
            console.info(new Date().toLocaleTimeString() + " Message: " + messageStatus);
        } else if (!error) { // 401 Unauthenticated | 403 Unauthorized | 400 Bad Request (Parse Error, Invalid Value etc..)
            let errorMessage = JSON.parse(response).error.message;
            console.error(errorMessage);
        } else { // runtime error
            // try authenticating in interactive mode
            gmail.getTokenInteractive();
        }
    }
};