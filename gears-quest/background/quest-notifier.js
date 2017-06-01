chrome.runtime.onMessage.addListener(
    function(req) {
        imgur.uploadImg(req.image);
    }
);

// RFC 2822 specification https://tools.ietf.org/html/rfc2822#appendix-A
function webSafeBase64(email) {
  return btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sendEmail(imgURL = "http://i.imgur.com/U8a2EHc.png") {
  gmail.xhrWithAuth(imgURL);
}

// imgur API v3 https://apidocs.imgur.com
let imgur = {

    clientId: '407efac196bb4bd',
    albumHash: '8LR9FGKu85h2ALx',
    uploadURL: 'https://api.imgur.com/3/image',

    uploadImg(imgBase64) {

        let data = new FormData();
        data.append("image", imgBase64);
        data.append("album", imgur.albumHash);
        data.append("title", "QuestIcon");
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
            sendEmail(imgURL);
        });
    }
}

let gmail = {
    oAuthRetry: true,
    errorRetry: true,
    url: "https://www.googleapis.com/gmail/v1/users/me/messages/send?alt=json",

    xhrWithAuth(imgURL) {
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
                // gmail template
                let email =
                    "To: " + storage.emailTo + "\r\n" +
                    "Subject: Gears Quest Update!\r\n" +
                    "Content-Type: text/html; charset=utf-8\r\n" +
                    "Content-Transfer-Encoding: base64\r\n\r\n" +

                    "<body>" +
                      "<h1>Gears Live Notification</h1>" +
                      "<p>A new quest is ready for you to view:</p>" +
                      "<p>" +
                        "<a href=\"http://live.gearsofwar.com\" target=\"_blank\">" +
                          "<img src=\"" + imgURL + "\" alt=\"Test\"/>" +
                        "</a>" +
                      "</p>" +
                      "<p>" +
                        "<b>Quest Description:</b>" +
                      "</p>" +
                      "<p>Description of the reward goes here</p>" +
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