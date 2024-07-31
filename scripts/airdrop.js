async function donate() {
    resetOfflineTimeout();

    const input = document.getElementById('donationValue');
    const value = parseInt(input.value);

    if (value > _player.balance) {
        document.getElementById("toast-body").innerHTML = `${_translations[_player.language_code].airdrop.error_insufficient_funds}`;
        _toast.show();
        return;
    }

    const response = await backendAPIRequest(`/player/${_tg_user.id}/donate`, "post", {
        amount: value
    });

    if (response.status === 200) {
        document.getElementById("toast-body").innerHTML = `${_translations[_player.language_code].airdrop.success}`;
        _toast.show();
        _player.balance -= value;
        document.getElementById('airdropBalance').innerHTML = formatBalance(_player.balance);
    } else {
        document.getElementById("toast-body").innerHTML = `${_translations[_player.language_code].airdrop.error}`;
        _toast.show();
    }

    input.value = "";
}