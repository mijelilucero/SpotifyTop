const clientId = '';
const clientSecret = '';
const redirectUri = 'http://localhost:63342/SpotifyQueue/callback.html';
const scopes = 'user-top-read'; // Permiso para leer el top de canciones del usuario

// Guarda el estado para prevenir ataques CSRF
const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// Función para iniciar el proceso de autenticación
function login() {
    console.log("Función login() ejecutada");
    console.log("Client ID:", clientId);
    console.log("Redirect URI:", redirectUri);

    const state = generateRandomString(16);
    console.log("Estado generado:", state);
    localStorage.setItem('spotify_auth_state', state);

    // Construir la URL de autorización
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);

    const finalUrl = authUrl.toString();
    console.log("URL de redirección:", finalUrl);

    // Redirigir al usuario a la página de autenticación de Spotify
    console.log("Intentando redireccionar...");
    window.location.href = finalUrl;
}

// Función para obtener el token de acceso
async function getAccessToken(code) {
    // NOTA: Esta función debería estar en el backend para proteger tu Client Secret
    // Si no tienes backend, considera usar el flujo implícito en su lugar
    console.log("Secret Client:", clientSecret);

    const bodyParams = new URLSearchParams();
    bodyParams.append('grant_type', 'authorization_code');
    bodyParams.append('code', code);
    bodyParams.append('redirect_uri', redirectUri);
    bodyParams.append('client_id', clientId);
    bodyParams.append('client_secret', clientSecret);

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: bodyParams
        });

        if (!response.ok) {
            throw new Error('Error al obtener el token de acceso');
        }

        const data = await response.json();

        // Guardar el token y su expiración
        const expiresIn = data.expires_in * 1000; // convertir a milisegundos
        const expiresAt = Date.now() + expiresIn;

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('expires_at', expiresAt);

        return data.access_token;
    } catch (error) {
        console.error('Error en la autenticación:', error);
        return null;
    }
}


// Función para renovar el token cuando expira
async function refreshToken() {

    console.log("Secret Client:", clientSecret);

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    const bodyParams = new URLSearchParams();
    bodyParams.append('grant_type', 'refresh_token');
    bodyParams.append('refresh_token', refreshToken);
    bodyParams.append('client_id', clientId);
    bodyParams.append('client_secret', clientSecret);

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: bodyParams
        });

        if (!response.ok) {
            throw new Error('Error al renovar el token');
        }

        const data = await response.json();

        // Actualizar el token y su expiración
        const expiresIn = data.expires_in * 1000;
        const expiresAt = Date.now() + expiresIn;

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('expires_at', expiresAt);

        // Si hay un nuevo refresh_token, almacenarlo también
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }

        return data.access_token;
    } catch (error) {
        console.error('Error al renovar el token:', error);
        return null;
    }
}

// Función para obtener un token válido
async function getValidToken() {
    const accessToken = localStorage.getItem('access_token');
    const expiresAt = localStorage.getItem('expires_at');

    // Si no hay token o está próximo a expirar (menos de 5 minutos)
    if (!accessToken || !expiresAt || Date.now() > (expiresAt - 300000)) {
        return await refreshToken();
    }

    return accessToken;
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('spotify_auth_state');
    window.location.href = '/index.html';
}

// Asegurarnos de quetodo el DOM esté cargado antes de agregar event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM completamente cargado");

    // Verificar la URL actual de una forma más robusta
    const path = window.location.pathname;
    const isIndexPage = path === '/' || path === '/index.html' || path.endsWith('/index.html');

    if (isIndexPage) {
        console.log("En página de inicio, buscando botón de login");
        const loginButton = document.getElementById('login-button');

        if (loginButton) {
            console.log("Botón de login encontrado, añadiendo event listener");
            loginButton.addEventListener('click', function(e) {
                console.log("Botón de login clickeado");
                e.preventDefault();
                login();
            });

            // Alternativa: usar onclick directamente
            loginButton.onclick = function(e) {
                console.log("Botón clickeado (onclick)");
                e.preventDefault();
                login();
                return false;
            };
        } else {
            console.error("ERROR: No se encontró el botón de login con ID 'login-button'");
        }
    }

    // Manejador para la página de callback
    if (path.includes('/callback.html')) {
        console.log("En página de callback, procesando autorización");
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = localStorage.getItem('spotify_auth_state');

        console.log("Código recibido:", code ? "Sí" : "No");
        console.log("Estado coincide:", state === storedState);

        if (code && state === storedState) {
            getAccessToken(code).then(accessToken => {
                if (accessToken) {
                    console.log("Autenticación exitosa");
                    // La inicialización se manejará en app.js
                } else {
                    console.error("Error en la autenticación");
                    alert('Error en la autenticación. Por favor intenta de nuevo.');
                    window.location.href = '/index.html';
                }
            });
        } else {
            console.error("Error de autorización. Estado no coincide o código faltante.");
            alert('Error de autorización. Por favor intenta de nuevo.');
            window.location.href = '/index.html';
        }

        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }
    }
});

// Exponer funciones necesarias globalmente
window.login = login;
window.logout = logout;
window.getValidToken = getValidToken;