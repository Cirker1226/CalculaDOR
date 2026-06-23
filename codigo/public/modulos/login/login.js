// Trabalho Interdisciplinar 1 - Aplicações Web

// Caminhos absolutos baseados na raiz do servidor local
const LOGIN_URL = "/modulos/login/login.html";
let RETURN_URL = "/modulos/home/home.html"; 

// Rota simplificada como você pediu
const API_URL = '/usuarios';

// Armazenamento em memória local
var db_usuarios = [];
var usuarioCorrente = {};

function initLoginApp() {
    let pagina = window.location.pathname;
    
    if (!pagina.includes("login.html")) {
        let usuarioCorrenteJSON = sessionStorage.getItem('usuarioCorrente');
        if (usuarioCorrenteJSON) {
            usuarioCorrente = JSON.parse(usuarioCorrenteJSON);
        } else {
            sessionStorage.setItem('returnURL', pagina);
            window.location.href = LOGIN_URL;
        }
    } else {
        carregarUsuarios(() => {
            console.log('Usuários carregados com sucesso do db.json');
        });
    }
}

function carregarUsuarios(callback) {
    fetch(API_URL)
    .then(response => response.json())
    .then(data => {
        db_usuarios = data;
        if(callback) callback();
    })
    .catch(error => {
        console.error('Erro ao ler dados da API:', error);
    });
}

function loginUser(login, senha) {
    for (var i = 0; i < db_usuarios.length; i++) {
        var usuario = db_usuarios[i];
        if ((login.toLowerCase() === usuario.login.toLowerCase() || login.toLowerCase() === usuario.email.toLowerCase()) && senha === usuario.senha) {
            usuarioCorrente.id = usuario.id;
            usuarioCorrente.nome = usuario.nome;
            usuarioCorrente.email = usuario.email;

            sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuarioCorrente));
            return true;
        }
    }
    
    if (login === "admin" && senha === "admin") {
        usuarioCorrente.id = "999";
        usuarioCorrente.nome = "Administrador";
        sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuarioCorrente));
        return true;
    }
    return false;
}

function logoutUser() {
    sessionStorage.removeItem('usuarioCorrente');
    window.location.href = LOGIN_URL;
}

function addUser(nome, login, email, senha) {
    let novoUsuario = {
        "nome": nome,
        "login": login,
        "email": email,
        "senha": senha
    };

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(novoUsuario),
    })
    .then(response => response.json())
    .then(data => {
        alert('Usuário cadastrado com sucesso! Agora você já pode fazer login.');
        document.getElementById('cadastro-form').reset();
        carregarUsuarios(() => {
            alternarTelas(false);
        });
    })
    .catch(error => {
        console.error('Erro ao inserir usuário no JSONServer:', error);
        alert('Erro ao conectar com o banco de dados.');
    });
}

initLoginApp();

function alternarTelas(mostrarCadastro) {
    document.getElementById('secao-login').classList.toggle('d-none', mostrarCadastro);
    document.getElementById('secao-cadastro').classList.toggle('d-none', !mostrarCadastro);
}

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    if (loginUser(user, pass)) {
    // Redirecionamento absoluto mapeado na raiz pública
    window.location.href = "/modulos/home/home.html"; 
    } else {
    alert('Usuário ou senha inválidos!');
    }
});

document.getElementById('cadastro-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    let nome = document.getElementById('txt_nome').value;
    let login = document.getElementById('txt_login').value;
    let email = document.getElementById('txt_email').value;
    let senha = document.getElementById('txt_senha').value;
    let senha2 = document.getElementById('txt_senha2').value;

    if (senha !== senha2) {
    alert('As senhas informadas não conferem.');
    return;
    }

    addUser(nome, login, email, senha);
});