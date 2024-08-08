function changeActiveButton(page) {
    const buttons = document.getElementsByClassName('bottomMenu--item');

    for (let button of buttons) {
        const icon = button.getElementsByClassName('bottomMenu--itemIcon')[0];
        if (button.dataset.page === page) {
            button.classList.add('bottomMenu--item--active');
            icon.src = icon.dataset.active;
        } else {
            button.classList.remove('bottomMenu--item--active');
            icon.src = icon.dataset.inactive;
        }
    }
}

async function loadHomePage(reload = false) {
    if (_active_page === "home" && !reload) {
        return;
    }

    changeActiveButton('home');

    if (_active_page !== "loadscreen") {
        showPagePreloader();
    }

    await getTgUserData();

    let offline_income = 0;

    if (_show_offline_income) {
        try {
            const offlineIncomeRequest = await fetch(`${_base_url}/player/${_tg_user.id}/offline_income`);
            const payload = await offlineIncomeRequest.json();
            offline_income = payload.offline_income;
        } catch (ex) {
            offline_income = 0;
            _show_offline_income = false;
        }
    }

    if (offline_income === 0) {
        _show_offline_income = false;
    }

    await getUserData();

    const view = {
        name: _player.name,
        balance: formatBalance(_player.balance),
        current_energy: _player.current_energy,
        max_energy: _player.max_energy,
        level: _player.player_level.level,
        pnl: _player.average_cards_profit,
        text: _translations[_player.language_code].home,
        text_levels: _translations[_player.language_code].levels,
        language_code: _player.language_code,
        show_offline_income: _show_offline_income,
        offline_income: offline_income,
    }

    const template = _page_templates['home'];
    document.getElementById('pageContent').innerHTML = Mustache.render(template, view);

    drawLevelBars();

    _wa.BackButton.hide();
    document.dispatchEvent(new Event('loadHome'));
    _toast.hide();
    _active_page = "home";
    clearInterval(_actives_daily_interval);
    _show_offline_income = false;
    resetOfflineTimeout();
    document.getElementById('body').classList.remove('modalShown');
}

async function loadFriendsPage(reload = false) {
    if (_active_page === "friends" && !reload) {
        return;
    }

    changeActiveButton('friends');
    showPagePreloader();

    const viewDataPayload = await fetch(`${_base_url}/player/friends/${_player.ref_id}`);
    const viewData = await viewDataPayload.json();

    for (let item of viewData) {
        item.level_name = _translations[_player.language_code].levels[item.player_level.level].name;
    }

    const view = {
        friends_count: viewData.length,
        ref_id: _player.ref_id,
        friends: viewData,
        text: _translations[_player.language_code].friends
    }

    const template = _page_templates['friends'];
    document.getElementById('pageContent').innerHTML = Mustache.render(template, view);
    _wa.BackButton.show();
    _toast.hide();
    _active_page = "friends";

    clearInterval(_actives_daily_interval);
    resetOfflineTimeout();
    document.getElementById('body').classList.remove('modalShown');
}

async function loadBoostPage() {
    if (_active_page === "boost") {
        return;
    }

    changeActiveButton('boost');
    showPagePreloader();

    const tasksRequest = await fetch(`${_base_url}/player/${_player.language_code}/${_tg_user.id}/tasks`);
    const tasks = await tasksRequest.json();

    const view = {
        countdown: new Date(_player.time_to_next_spin * 1000).toISOString().slice(11, 19),
        can_spin: _player.friends_total >= 3,
        can_not_spin: _player.friends_total < 3,
        invites_left: 3 - _player.friends_total,
        timer_hidden: _player.time_to_next_spin <= 0,
        tasks: tasks,
        text: _translations[_player.language_code].boost
    }

    const template = _page_templates['boost'];
    document.getElementById('pageContent').innerHTML = Mustache.render(template, view);
    document.dispatchEvent(new Event('loadBoost'));
    _wa.BackButton.show();
    _toast.hide();
    _active_page = "boost";

    clearInterval(_actives_daily_interval);
    document.getElementById('body').classList.remove('modalShown');
}

async function loadActivesPage(tab = 'round', reload = false) {
    if (_active_page === `actives_${tab}` && !reload) {
        return;
    }

    changeActiveButton('actives');

    if (!reload && !_active_page.includes('actives_')) {
        showPagePreloader();
    }

    if (_active_page.includes('actives_')) {
        const buttons = document.getElementsByClassName('activesTabs--item');
        for (let button of buttons) {
            button.classList.remove('activesTabs--item--active');
        }
        document.getElementById(`activesTabs--item--${tab}`).classList.add('activesTabs--item--active');
        document.getElementById('activesContent--wrapper').innerHTML = '<div class="activesContent--preloader"><img src="https://cdn.umperium.com/static/infinite-spinner-orange.svg" alt="loading"></div>';
    }

    _current_actives_tab = tab;

    let data;
    let daily_active = false;

    try {
        if (!_active_page.includes('actives_')) {
            await Promise.all([
                dailyData = await loadDaily(),
                data = await loadActives(tab)
            ]);
        } else {
            data = await loadActives(tab);
        }
    } catch (ex) {

    }

    if (dailyData) {
        try {
            dailyBonus = dailyData.reward;
            _actives_daily_countdown = 86400 - Math.floor((new Date().getTime() - new Date(dailyData.countdown).getTime()) / 1000);
            dailyData.countdown_time = new Date(_actives_daily_countdown * 1000).toISOString().slice(11, 16);
            daily_active = true;
        } catch (ex) {

        }

        if (dailyData.has_answered) {
            if (dailyData.correct_answer === dailyData.user_answer) {
                for (let i = 0; i < 3; i++) {
                    const answer = dailyData.answers[i];

                    if (answer.id === dailyData.correct_answer) {
                        answer.cssClass = 'activesModalDaily--answer--correct';
                    } else {
                        answer.cssClass = '';
                    }
                }
            } else {
                for (let i = 0; i < 3; i++) {
                    const answer = dailyData.answers[i];

                    if (answer.id === dailyData.correct_answer) {
                        answer.cssClass = 'activesModalDaily--answer--correct';
                    } else if (answer.id === dailyData.user_answer) {
                        answer.cssClass = 'activesModalDaily--answer--wrong';
                    } else {
                        answer.cssClass = '';
                    }
                }
            }
        }
    }

    let total_income = 0;
    let total_purchased = 0;

    for (let item of data) {
        if (item.level > 0) {
            total_purchased += item.level;
            total_income += item.income;
        }
    }

    const view = {
        tab_rounds: tab === 'round',
        tab_directions: tab === 'direction',
        tab_projects: tab === 'project',
        tab_specials: tab === 'special',
        header_notification: `${_translations[_player.language_code].actives.header_actives}: ${total_purchased} | ${_translations[_player.language_code].actives.header_income}: ${formatTotalIncome(total_income)}`,
        items: data,
        text: _translations[_player.language_code].actives,
        daily: dailyData,
        daily_active: daily_active,
        balance: formatBalance(_player.balance),
    };

    const template = _page_templates['actives'];
    document.getElementById('pageContent').innerHTML = Mustache.render(template, view);
    _wa.BackButton.show();

    if (!reload) {
        _toast.hide();
    }
    _active_page = `actives_${tab}`;
    resetOfflineTimeout();
    document.dispatchEvent(new Event('loadActives'));
    document.getElementById('body').classList.remove('modalShown');
}

async function loadAirdropPage() {
    if (_active_page === "airdrop") {
        return;
    }

    changeActiveButton('airdrop');
    showPagePreloader();

    const view = {
        balance: formatBalance(_player.balance),
        text: _translations[_player.language_code].airdrop
    }

    const template = _page_templates['airdrop'];
    document.getElementById('pageContent').innerHTML = Mustache.render(template, view);
    _wa.BackButton.show();
    _toast.hide();
    _active_page = "airdrop";

    clearInterval(_actives_daily_interval);
    resetOfflineTimeout();
    document.getElementById('body').classList.remove('modalShown');
}

function showPagePreloader() {
    // clearInterval(energyInterval);
    clearInterval(_actives_daily_interval);
    document.getElementById('pageContent').innerHTML = '<div class="pagePreloader"><img src="https://cdn.umperium.com/static/infinite-spinner-orange.svg" alt="loading"></div>';
    document.getElementById('body').classList.remove('modalShown');
    document.getElementById('pageContent').classList.remove('blur');
}
