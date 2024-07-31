var tapsCount = 0;
var tapsTimeout, animateTimeout;
var energyCurrent, homePlayerBalance, homeTapContainer;
var energyInterval;
var tapsStartTime = new Date();
var dailyData;
var lastBalanceUpdate = window.performance.now();

var sessionTaps = 0, totalSentTaps = 0;

function tapEventListener(event) {
    let posX, posY;

    if (event.type === 'touchstart') {
        posX = event.changedTouches[0].clientX;
        posY = event.changedTouches[0].clientY;
    } else {
        posX = event.pageX;
        posY = event.pageY;
    }

    if (_player.current_energy > 0) {
        _player.current_energy--;
        energyCurrent.innerHTML = _player.current_energy;

        _player.balance += _player.tap_increment;
        homePlayerBalance.innerHTML = _player.balance;

        if (_player.balance >= _levels[_player.player_level.level + 1]) {
            _player.player_level.level++;

            const image = document.getElementById('tapGame--player');
            image.src = `https://d25ebjvanew4na.cloudfront.net/static/character-level-${_player.player_level.level}.png.webp`;
            image.srcset = `https://d25ebjvanew4na.cloudfront.net/static/character-level-${_player.player_level.level}@2x.png.webp 2x, https://d25ebjvanew4na.cloudfront.net/static/character-level-${_player.player_level.level}@3x.png.webp 3x`;

            document.getElementById('level--infoNumberValue').innerHTML = _player.player_level.level;
        }

        homeTapContainer.classList.add('tapGame--tapped');
        drawTapResult(posX, posY);
        drawLevelBars();
        tapsCount++;
        sessionTaps++;
        clearTimeout(tapsTimeout);
        resetOfflineTimeout();
    }
}

document.addEventListener('loadHome', () => {
    ensureDocumentIsScrollable();

    const target = document.getElementById("tapGame--game");
    homeTapContainer = document.getElementById('tapGame');
    energyCurrent = document.getElementById('level--energyValueCurrent');
    homePlayerBalance = document.getElementById('screenHeader--balance');
    const selectedLangButton = document.getElementsByClassName(`changeLangButton--${_player.language_code}`)[0];

    selectedLangButton.classList.add('changeLangButton--active');

    const eventParams = { passive: false };
    target.addEventListener('touchstart', ignore, eventParams);
    target.addEventListener('touchcancel', ignore, eventParams);
    target.addEventListener('touchend', ignore, eventParams);
    target.addEventListener('touchmove', ignore, eventParams);
    target.addEventListener('scroll', ignore, eventParams);

    function ignore(e) {
        preventCollapse();
        e.preventDefault();
    }

    clearInterval(energyInterval);
    energyInterval = setInterval(async () => {
        const tmpTapsCount = tapsCount;
        const tmpTapsStartTime = tapsStartTime.toISOString();

        tapsCount = 0;
        tapsStartTime = new Date();

        if (tmpTapsCount > 0) {
            backendAPIRequest(`/player/${_tg_user.id}/update_taps`, 'post', {
                taps: tmpTapsCount,
                timestamp: tmpTapsStartTime,
            }).then(res => {
                const body = JSON.parse(res.body);
                _player.current_energy = body.new_energy;
                energyCurrent.innerHTML = _player.current_energy;
                lastBalanceUpdate = window.performance.now();
                totalSentTaps += tmpTapsCount;
            });
        } else if (_player.current_energy === _player.max_energy) {
            const timeFromLastUpdate = Math.round((window.performance.now() - lastBalanceUpdate) / 1000);

            if (timeFromLastUpdate >= _offline_balance_update_time) {
                const req = await fetch(`${_base_url}/player/${_tg_user.id}/balance`);
                const body = await req.json();

                if (_player.current_energy < body.energy) {
                    _player.current_energy = body.energy;
                    energyCurrent.innerHTML = _player.current_energy;
                }
                if (_player.balance < body.balance) {
                    _player.balance = body.balance;
                    document.getElementById('screenHeader--balance').innerHTML = _player.balance;
                }
                lastBalanceUpdate = window.performance.now();
            }
        } else {
            const req = await fetch(`${_base_url}/player/${_tg_user.id}/balance`);
            const body = await req.json();

            if (_player.current_energy < body.energy) {
                _player.current_energy = body.energy;
                energyCurrent.innerHTML = _player.current_energy;
            }
            if (_player.balance < body.balance) {
                _player.balance = body.balance;
                document.getElementById('screenHeader--balance').innerHTML = _player.balance;
            }
            lastBalanceUpdate = window.performance.now();
        }
    }, 1000);

    ['pointerdown'].forEach(eventType => {
        target.addEventListener(eventType, tapEventListener);
    });

    ['pointerup'].forEach(eventType => {
        target.addEventListener(eventType, (e) => {
            // tapsTimeout = setTimeout(() => {
            //     if (tapsCount > 0) {
            //         totalSentTaps += tapsCount;
            //         backendAPIRequest(`/player/${_tg_user.id}/update_taps`, 'post', {
            //             taps: tapsCount,
            //             timestamp: tapsStartTime.toISOString(),
            //         }).then(res => {
            //             tapsCount = 0;
            //             console.log(`Total taps timeout: ${sessionTaps}, total sent: ${totalSentTaps}`);
            //         });
            //     }
            // }, 1000);
            animateTimeout = setTimeout(() => {
                homeTapContainer.classList.remove('tapGame--tapped');
            }, 100);
        });
    });
});

async function showLevelModal() {
    resetOfflineTimeout();

    _active_page = "level_modal";

    const swiper = new Swiper('.swiper', {
        // Optional parameters
        direction: 'horizontal',
        loop: false,
        initialSlide: _player.player_level.level - 1,

        // Navigation arrows
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });

    const response = await fetch(`${_base_url}/player/${_tg_user.id}/stats`);
    const data = await response.json();

    document.getElementById('levelModal--statsValue--totalActives').innerHTML = data.total_investments_count;
    document.getElementById('levelModal--statsValue--totalSpent').innerHTML = data.total_investments_amout;
    document.getElementById('levelModal--statsValue--totalIncome').innerHTML = data.total_income_from_cards;
    document.getElementById('levelModal--statsValue--pnl').innerHTML = data.total_average_cards_profit_percent + '%';
    document.getElementById('levelModal--statsValue--rounds').innerHTML = data.card_type_distribution.round + '%';
    document.getElementById('levelModal--statsValue--directions').innerHTML = data.card_type_distribution.direction + '%';
    document.getElementById('levelModal--statsValue--projects').innerHTML = data.card_type_distribution.project + '%';
    document.getElementById('levelModal--statsValue--specials').innerHTML = data.card_type_distribution.special + '%';
    document.getElementById('levelModal--rankingCurrent').innerHTML = data.leaderboard_position;
    document.getElementById('levelModal--rankingTotal').innerHTML = data.total_players;

    const progress = document.getElementsByClassName('progress--level');
    for (let el of progress) {
        el.classList.add('d-none');
    }
    const scores = document.getElementsByClassName('progress--minScore');
    for (let el of scores) {
        el.classList.remove('d-none');
    }

    const progressEL = document.getElementById(`progress--level--${_player.player_level.level}`);
    progressEL.classList.remove('d-none');
    document.getElementById(`progress--minScore--${_player.player_level.level}`).classList.add('d-none');

    const width = Math.floor(_player.balance / _levels[_player.player_level.level + 1] * 100);
    progressEL.getElementsByClassName('progress-bar')[0].style.width = `${width}%`;
    progressEL.getElementsByClassName('progress-bar')[0].getElementsByClassName('progress--levelText')[0].innerHTML = `${_player.balance} / ${_levels[_player.player_level.level + 1]}`;

    document.getElementById('levelModal').classList.remove('d-none');
    _wa.BackButton.show();
}

function drawTapResult(x, y) {
    var el = document.createElement('div');
    el.innerHTML = '+' + _player.tap_increment;
    el.classList.add('tapResult');
    el.style.left = `${x - 20}px`;
    el.style.top = `${y - 20}px`;
    document.body.appendChild(el);

    el.animate([
        { transform:'translateY(0px)', opacity: 1 },
        { transform:'translateY(-150px)', opacity: 0 },
    ], {
        duration: 500,
        iterations: 1,
    });

    setTimeout(() => {
        el.remove();
    }, 500);
}

async function changeLanguage(el) {
    resetOfflineTimeout();

    const newLang = el.dataset.lang;
    if (_player.language_code === newLang) {
        return;
    }

    _player.language_code = newLang;
    await backendAPIRequest(`/player/${_tg_user.id}/lang`, 'post', {
        language_code: newLang
    });
    renderBottomMenu();
    loadHomePage(true);
}

function drawLevelBars() {
    const pointsPerBar = Math.floor(_levels[_player.player_level.level + 1] / 9);

    let coloredBars = 0;
    let barsScore = 0;

    if (_player.player_level.level === 7) {
        coloredBars = 9;
    } else {
        while (barsScore < _player.balance) {
            barsScore += pointsPerBar;
            coloredBars++;
        }
    }

    for (let i = 1; i <= coloredBars; i++) {
        document.getElementsByClassName(`level--bar--${i}`)[0].classList.add('level--bar--active');
    }
    for (let i = coloredBars + 1; i <= 9; i++) {
        document.getElementsByClassName(`level--bar--${i}`)[0].classList.remove('level--bar--active');
    }
}

function hideIncomeModal() {
    document.getElementById('incomeModal').classList.add('incomeModal--hidden');
    document.getElementById('incomeModal--backdrop').classList.add('d-none');
}