var _wa;
var _tg_user;
var _player;
var _toast;
var _current_actives_tab = 'round';
var _start_param = null;
var _wheel_interval;
var _active_page = 'loadscreen';
var _levels = {
    1: 0,
    2: 5000,
    3: 25000,
    4: 100000,
    5: 1000000,
    6: 10000000,
    7: 50000000,
    8: 100000000
}
var _actives_daily_interval;
var _actives_daily_countdown;
var _show_offline_income = true;
var _base_url = "https://game-backend.umperium.com";
var _page_templates = {};
var _offline_timeout_time_max = 7200 * 3;
var _offline_timeout_time_current = 0;
var _offline_timeout;
var _offline_balance_update_time = 60;

document.addEventListener('DOMContentLoaded', async () => {
    _wa = window.Telegram.WebApp;
    _wa.headerColor = '#295067';
    _wa.backgroundColor = '#295067';
    _wa.expand();
    window.addEventListener("scroll", (e) => {
        // e.preventDefault();
    });
} );

document.addEventListener('preload', async () => {
    _wa.BackButton.onClick(() => {
        document.getElementById('body').classList.remove('modalShown');
        document.getElementById('pageContent').classList.remove('blur');
        loadHomePage();
        _active_page = "home";
        document.getElementById('body').classList.remove('modalShown');
        document.getElementById('pageContent').classList.remove('blur');
    });

    const toastEl = document.getElementById('toast');
    _toast = new bootstrap.Toast(toastEl);

    await loadHomePage();

    _wa.headerColor = '#01290F';
    _wa.backgroundColor = '#01290F';
    renderBottomMenu();
    document.getElementById('bottomMenu').style = null;
    document.getElementById('toast').style = null;
    document.getElementById('body').style.backgroundColor = '#01290F';

    const scrollableElement = document.getElementById('pageContent');
    scrollableElement.addEventListener("touchstart", preventCollapse);
});

async function preload() {
    const ver = 114;

    const scripts = [
        `/scripts/index.js?v=${ver}`,
        `/scripts/bootstrap.bundle.min.js?v=${ver}`,
        `/scripts/mustache.min.js?v=${ver}`,
        `/scripts/swiper-bundle.min.js?v=${ver}`,
        `/scripts/translations.js?v=${ver}`,
        `/scripts/navigate.js?v=${ver}`,
        `/scripts/boost.js?v=${ver}`,
        `/scripts/actives.js?v=${ver}`,
        `/scripts/airdrop.js?v=${ver}`,
    ];
    const styles = [
        `/scss/bootstrap.min.css?v=${ver}`,
        `/scss/swiper-bundle.min.css?v=${ver}`,
        `/scss/bundle.min.css?v=${ver}`,
        `/scss/tmp.min.css?v=${ver}`
    ];
    const templates = {
        "home": `/pages/home/home.template.html?v=${ver}`,
        "friends": `/pages/friends/friends.template.html?v=${ver}`,
        "boost": `/pages/boost/boost.template.html?v=${ver}`,
        "actives": `/pages/actives/actives.template.html?v=${ver}`,
        "airdrop": `/pages/airdrop/airdrop.template.html?v=${ver}`,
    }

    let promises = [];
    scripts.forEach(script => {
        const promise = fetchResource(script, 'script');
        promises.push(promise);
    });

    styles.forEach(style => {
        const promise = fetchResource(style, 'style');
        promises.push(promise);
    });

    Object.entries(templates).forEach(([name, url]) => {
        const promise = fetchResource(url, 'template', name);
        promises.push(promise);
    });

    await Promise.all(promises);

    document.dispatchEvent(new Event('preload'));
}

async function fetchResource(url, type, template_name = '') {
    const response = await fetch(url);
    const payload = await response.text();

    if (type === 'style') {
        const style = document.createElement('style');
        // const head =  || document.getElementsByTagName('head')[0];
        style.rel = 'stylesheet';
        style.innerHTML = payload;
        document.head.appendChild(style);
    }

    if (type === 'script') {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = payload;
        document.body.appendChild(script);
    }

    if (type === 'template') {
        _page_templates[template_name] = payload;
    }
}
