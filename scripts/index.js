function copyUrlButtonClick() {
    navigator.clipboard.writeText(`https://t.me/UmperiumTGBot/umperium?startapp=${_player.ref_id}`);
    document.getElementById("toast-body").innerHTML = _translations[_player.language_code].friends.url_copied;
    _toast.show();
}

async function getTgUserData() {
    let userPayload = decodeURIComponent(_wa.initData);
    userPayload = userPayload.substring(userPayload.indexOf('user=') + 5, userPayload.lastIndexOf('}') + 1);

    if (userPayload) {
        _tg_user = JSON.parse(userPayload);
    }

    if (!_tg_user) {
        _tg_user = {
            id: 131705404
        }
    }
}

async function getUserData() {
    const urlParams = new URLSearchParams(decodeURIComponent(window.location.href));
    if (urlParams.has('start_param')) {
        _start_param = urlParams.get('start_param');
    }

    if (!_available_translations.includes(_tg_user.language_code)) {
        _tg_user.language_code = 'en';
    }

    if (_tg_user) {
        let playerPayload;
        try {
            playerPayload = await fetch(`${_base_url}/player/${_tg_user.id}`);
        } catch (ex) {

        }
        if (playerPayload.status === 200) {
            _player = await playerPayload.json();
        } else {
            let name = _tg_user.username;

            if (!name && _tg_user.last_name) {
                name = _tg_user.last_name;
            }

            if (!name && _tg_user.first_name) {
                name = _tg_user.first_name;
            }

            if (!name) {
                name = "BOSS";
            }

            const body = {
                "user_id": _tg_user.id,
                "user_name": name,
                "inviter_ref_id": _start_param,
                "avatar_link": "",
                "language_code": _tg_user.language_code
            }

            const response = await backendAPIRequest('/player', 'post', body);
            if (response.status === 200 || response.status === 201) {
                _player = JSON.parse(response.body);
            }
        }

        clearInterval(_wheel_interval);
        _wheel_interval = setInterval(() => {
            _player.time_to_next_spin--;
            if (_player.time_to_next_spin <= 0) {
                _player.time_to_next_spin = 0;
                clearInterval(_wheel_interval);
            }
        }, 1000);
    }
}

async function backendAPIRequest(url, method = 'post', data = null) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();

        try {
            xhr.open(method, _base_url + url, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.onload = function () {
                var status = xhr.status;
                if (status < 300) {

                    resolve({
                        status: status,
                        body: xhr.responseText
                    });
                } else {
                    resolve({
                        status: status,
                        error: xhr.responseText
                    });
                }
            };
            xhr.send(data ? JSON.stringify(data) : null);
        } catch (ex) {
            resolve({
                status: xhr.status,
                error: xhr.responseText
            });
        }

    });
}

function renderBottomMenu() {
    document.getElementById('bottomMenu--itemText--home').innerHTML = _translations[_player.language_code].menu.home;
    document.getElementById('bottomMenu--itemText--actives').innerHTML = _translations[_player.language_code].menu.actives;
    document.getElementById('bottomMenu--itemText--friends').innerHTML = _translations[_player.language_code].menu.friends;
    document.getElementById('bottomMenu--itemText--boost').innerHTML = _translations[_player.language_code].menu.boost;
    document.getElementById('bottomMenu--itemText--airdrop').innerHTML = _translations[_player.language_code].menu.airdrop;

    document.getElementById('offlineModal').classList.remove('d-none');
    document.getElementById('offlineModal--title').innerHTML = _translations[_player.language_code].offline.offline_title;
    document.getElementById('offlineModal--cta').innerHTML = _translations[_player.language_code].offline.offline_text;
    document.getElementById('offlineModal--button').innerHTML = _translations[_player.language_code].offline.offline_button;
}

function resetOfflineTimeout() {
    clearTimeout(_offline_timeout);
    _offline_timeout_time_current = 0;
    document.getElementById('offlineModal').classList.add('offlineModal--hidden');
    document.getElementById('offlineModal--backdrop').classList.add('d-none');

    _offline_timeout = setInterval(() => {
        _offline_timeout_time_current++;

        if (_offline_timeout_time_current >= _offline_timeout_time_max) {
            document.getElementById('offlineModal').classList.remove('offlineModal--hidden');
            document.getElementById('offlineModal--backdrop').classList.remove('d-none');

            clearTimeout(_offline_timeout);
            clearInterval(energyInterval);
        }
    }, 1000);
}

// Ensure the document is scrollable
function ensureDocumentIsScrollable() {
    const isScrollable =
        document.documentElement.scrollHeight > window.innerHeight;
    // Check if the document is scrollable
    if (!isScrollable) {
        /*
        Set the document's height to 100 % of
        the viewport height plus one extra pixel
        to make it scrollable.
        */
        document.documentElement.style.setProperty(
            "height",
            "calc(100vh + 1px)",
            "important"
        );
    }
}

function preventCollapse(event) {
    if (window.scrollY === 0) {
        window.scrollTo(0, 1);
    }
}
