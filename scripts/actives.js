var dailyBonus;

document.addEventListener('loadActives', async () => {
    clearInterval(_actives_daily_interval);
    _actives_daily_interval = setInterval(() => {
        _actives_daily_countdown--;

        if (_actives_daily_countdown <= 0) {
            try {
                const wrapper = document.getElementById('dailyCardWrapper');

                if (wrapper) {
                    wrapper.classList.add('d-none');
                }
            } catch (ex) {

            }

            hideActivesModal();
            clearInterval(_actives_daily_interval);
            return;
        }

        if (_actives_daily_countdown) {
            document.getElementById("dailyCard--timerCountdown").innerHTML = new Date(_actives_daily_countdown * 1000).toISOString().slice(11, 16);
        }
    }, 1000);
});

function showActivesModal(el) {
    resetOfflineTimeout();

    const modal = document.getElementById('activesModal');
    const blur = document.getElementById('activesBlur');
    const content = document.getElementById('pageContent');

    document.getElementById('activesModal--titleContent').innerHTML = el.dataset.title;
    document.getElementById('activesModal--logoImg').src = el.dataset.icon;
    document.getElementById('activesModal--incomePrice').innerHTML = el.dataset.incomePrice;
    document.getElementById('activesModal--incomeValue').innerHTML = el.dataset.incomeValue;
    document.getElementById('activesModal--text').innerHTML = el.dataset.text;
    document.getElementById('activesModal--level').innerHTML = el.dataset.level;
    document.getElementById('activesModal--income').innerHTML = el.dataset.income;
    document.getElementById('activesModal--startPrice').innerHTML = el.dataset.startPrice;
    document.getElementById('activesModal--button').dataset.id = el.dataset.id;
    document.getElementById('activesModal--button').dataset.price = el.dataset.priceRaw;

    document.getElementById('body').classList.add('modalShown');
    blur.classList.remove('activesBlur--hidden');
    modal.classList.remove('activesModal--hidden');
    content.classList.add('blur');
}

function showActivesModalDaily() {
    resetOfflineTimeout();

    const modal = document.getElementById('activesModalDaily');
    const blur = document.getElementById('activesBlur');
    const content = document.getElementById('pageContent');

    document.getElementById('body').classList.add('modalShown');
    blur.classList.remove('activesBlur--hidden');
    modal.classList.remove('activesModal--hidden');
    content.classList.add('blur');
}

function hideActivesModal() {
    resetOfflineTimeout();

    document.getElementById('activesBlur').classList.add('activesBlur--hidden');
    document.getElementById('activesModal').classList.add('activesModal--hidden');
    document.getElementById('activesModalDaily').classList.add('activesModal--hidden');
    document.getElementById('body').classList.remove('modalShown');
    document.getElementById('pageContent').classList.remove('blur');
}

async function loadActives(type = 'round') {
    resetOfflineTimeout();

    const payload = await fetch(`${_base_url}/cards/player/${_player.language_code}/${_tg_user.id}/${type}`);
    return await payload.json();
}

async function loadDaily() {
    try {
        const payload = await fetch(`${_base_url}/player/${_player.language_code}/${_tg_user.id}/daily`);
        return await payload.json();
    } catch (ex) {
        return null;
    }
}

async function upgradeActive(el) {
    resetOfflineTimeout();
    const price = parseInt(el.dataset.price);

    if (_player.balance < price) {
        hideActivesModal();

        document.getElementById("toast-body").innerHTML = _translations[_player.language_code].actives.toast_fail;
        _toast.show();

        return;
    }

    let is_success = await upgradeRequest(el.dataset.id);
    hideActivesModal();

    if (is_success) {
        document.getElementById("toast-body").innerHTML = _translations[_player.language_code].actives.toast_success;
        _toast.show();
        await loadActivesPage(_current_actives_tab, true);
        _player.balance -= price;
        document.getElementById('screenHeader--balance').innerHTML = formatBalance(_player.balance);
    } else {
        document.getElementById("toast-body").innerHTML = _translations[_player.language_code].actives.toast_fail;
        _toast.show();
    }
}

async function upgradeRequest(id) {
    return new Promise(function (resolve, ) {
        let xhr = new XMLHttpRequest();
        xhr.open('post', `${_base_url}/cards/player/${_tg_user.id}/upgrade`, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.onload = function () {
            var status = xhr.status;
            if (status === 200) {
                resolve(true);
            } else {
                resolve(false);
            }
        };
        xhr.send(JSON.stringify({
            card_id: id
        }));
    });
}

async function dailyAnswerClick(el) {
    const answerId = parseInt(el.dataset.id);

    const response = await backendAPIRequest(`/player/${_tg_user.id}/daily`, 'post', {
        id: answerId
    });

    if (response.status === 400 && response.error === `{"status":"error","message":"You have already answered today's question."}`) {
        document.getElementById("toast-body").innerHTML = _translations[_player.language_code].actives.daily_answer_repeated;
        _toast.show();
    } else if (response.status === 200) {
        const data = JSON.parse(response.body);
        _toast.hide();

        if (data.correct_answer !== data.user_answer) {
            document.getElementById("toast-body").innerHTML = _translations[_player.language_code].actives.daily_answer_wrong;
            document.getElementById(`activesModalDaily--answer--${data.correct_answer}`).classList.add('activesModalDaily--answer--correct');
            document.getElementById(`activesModalDaily--answer--${data.user_answer}`).classList.add('activesModalDaily--answer--wrong');
        } else {
            document.getElementById("toast-body").innerHTML = _translations[_player.language_code].actives.daily_answer_correct + ' ' + dailyBonus + ' <img src="https://cdn.umperium.com/static/icon-coin.svg">';
            _player.balance += dailyBonus;
            document.getElementById('screenHeader--balance').innerHTML = formatBalance(_player.balance);
            document.getElementById(`activesModalDaily--answer--${data.correct_answer}`).classList.add('activesModalDaily--answer--correct');
        }

        _toast.show();
    }

    hideActivesModal();

    // document.getElementById("toast-body").innerHTML = `${_translations[_player.language_code].airdrop.error_insufficient_funds}`;
    // _toast.show();
}

function formatTotalIncome(income) {
    if (income > 1000) {
        const formatted = (income / 1000).toString();
        return formatted.substring(0, formatted.indexOf('.') + 3) + 'K';
    }

    if (income > 1000000) {
        const formatted = (income / 1000000).toString();
        return formatted.substring(0, formatted.indexOf('.') + 3) + 'M';
    }

    return income.toString();
}