let _wheelRotated;
var _countdownInterval;

document.addEventListener('loadBoost', function() {
    _wheelRotated = !!_player.time_to_next_spin;

    const screenTopNotification = document.getElementById("screenTopNotification");
    const timer = document.getElementById("screenTopNotification--boostCountdown");

    clearInterval(_countdownInterval);
    _countdownInterval = setInterval(() => {
        timer.innerHTML = new Date(_player.time_to_next_spin * 1000).toISOString().slice(11, 19);

        if (_player.time_to_next_spin <= 0) {
            _wheelRotated = false;
            window.clearInterval(_countdownInterval);
            screenTopNotification.style.display = "none";
        }
    }, 1000);
});

async function spinWheel() {
    resetOfflineTimeout();

    if (_player.friends_total < 3) {
        return await loadFriendsPage();
    }

    if (_wheelRotated) {
        return ;
    }

    const sectors = [
        0, 1000, -1, 1000, 3000, 10000, 0, 1000, 5000, 3000
    ]

    const result = await backendAPIRequest(`/player/${_tg_user.id}/spin_wheel`);

    if (result.status !== 200) {
        return;
    }

    const data = JSON.parse(result.body);
    const targetSector = data.sector_id - 1;

    let div = document.getElementById('wheelOfFortune--spinner'),
        deg = 3600 - targetSector * 36 - 18;

    div.style.transform = 'rotate('+deg+'deg)';
    div.style.webkitTransform = 'rotate('+deg+'deg)';

    _wheelRotated = true;


    const screenTopNotification = document.getElementById("screenTopNotification");
    const timer = document.getElementById("screenTopNotification--boostCountdown");

    timer.innerHTML = new Date(data.time_to_next_spin * 1000).toISOString().slice(11, 19);
    _player.time_to_next_spin = data.time_to_next_spin;
    _player.balance += data.prize;

    setTimeout(() =>{
        screenTopNotification.style.display = "block";
        document.getElementById("toast-body").innerHTML = `${_translations[_player.language_code].boost.spin_success} ${sectors[targetSector]}`;
        _toast.show();

        _countdownInterval = setInterval(() => {
            timer.innerHTML = new Date(_player.time_to_next_spin * 1000).toISOString().slice(11, 19);

            if (_player.time_to_next_spin <= 0) {
                _wheelRotated = false;
                window.clearInterval(countDown);
                screenTopNotification.style.display = "none";
            }
        }, 1000);

    }, 3000);
}

async function applyPromocode() {
    const input = document.getElementById('promocodeValue');
    const code = input.value;

    resetOfflineTimeout();

    try {
        const response = await backendAPIRequest(`/player/${_tg_user.id}/redeem_promo_code`, "post", {
            code: code
        });

        if (response.status === 200) {
            const data = JSON.parse(response.body);
            _player.balance += data.bonus;
            document.getElementById("toast-body").innerHTML = `${_translations[_player.language_code].boost.promocode_success} ${data.bonus}`;
            _toast.show();
        } else {
            document.getElementById("toast-body").innerHTML = _translations[_player.language_code].boost.promocode_error;
            _toast.show();
        }
    } catch (ex) {
        document.getElementById("toast-body").innerHTML = _translations[_player.language_code].boost.promocode_error;
        _toast.show();
    }
}

async function clickTask(el) {
    resetOfflineTimeout();

    const modal = document.getElementById('taskModal');
    const blur = document.getElementById('taskBlur');
    const content = document.getElementById('pageContent');

    document.getElementById('taskModal--titleContent').innerHTML = el.dataset.title;
    document.getElementById('taskModal--buttonSubscribe').dataset.id = el.dataset.id;
    document.getElementById('taskModal--buttonSubscribe').dataset.url = el.dataset.url;

    if (el.dataset.needsVerification.toString() === 'true') {
        document.getElementById('taskModal--buttonCheck').classList.remove('d-none');
        document.getElementById('taskModal--buttonCheck').dataset.id = el.dataset.id;
    } else {
        document.getElementById('taskModal--buttonCheck').classList.add('d-none');
    }

    document.getElementById('body').classList.add('modalShown');
    blur.classList.remove('activesBlur--hidden');
    modal.classList.remove('activesModal--hidden');
    content.classList.add('blur');
}

async function doTask(el) {
    const id = el.dataset.id;
    const url = el.dataset.url;
    const needsVerification = el.dataset.needsVerification.toString() === "true";


    if (el.classList.contains('boostTask--item--clicked')) {
        openLink(url);
        return;
    }

    resetOfflineTimeout();

    //если таске не нужна проверка, сразу шлем на бэк что она нажата
    if (!needsVerification) {
        const response = await backendAPIRequest(`/player/${_tg_user.id}/tasks/${id}`, "post", null);

        if (response.status === 200) {
            const taskEl = document.getElementById(`boostTask--${id}`);
            taskEl.classList.add('boostTask--item--clicked');
            taskEl.getElementsByClassName('boostTask--itemCheck')[0].classList.add('d-inline-flex');
        }

        await hideTaskModal();
    }

    openLink(url);
}

async function checkTask(el) {
    const id = el.dataset.id;

    try {
        const response = await backendAPIRequest(`/player/${_tg_user.id}/tasks/${id}`, "post", null);

        const body = JSON.parse(response.body);
        if (response.status === 200 && body.status === "success") {
            const taskEl = document.getElementById(`boostTask--${id}`);
            taskEl.classList.add('boostTask--item--clicked');
            taskEl.getElementsByClassName('boostTask--itemCheck')[0].classList.add('d-inline-flex');
        }
    } catch (ex) {

    }

    await hideTaskModal();
}

async function hideTaskModal() {
    resetOfflineTimeout();

    document.getElementById('taskBlur').classList.add('activesBlur--hidden');
    document.getElementById('taskModal').classList.add('activesModal--hidden');
    document.getElementById('body').classList.remove('modalShown');
    document.getElementById('pageContent').classList.remove('blur');
}

function openLink(url) {
    if (url.includes('t.me/')) {
        _wa.openTelegramLink(url);
    } else {
        _wa.openLink(url);
    }
}