function renderUsuario() {
    let usuarioJSON = sessionStorage.getItem('usuarioCorrente');

    if (!usuarioJSON) return;

    let usuario = JSON.parse(usuarioJSON);

    const nomeEl = document.getElementById('nome-usuario');

    if (nomeEl) nomeEl.textContent = usuario.nome;
}

renderUsuario();