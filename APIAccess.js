const clientID = 'TU_CLIENT_ID';
const clientSecret = 'TU_CLIENT_SECRET';
const redirectURI = 'TU_REDIRECT_URI'; // La URI que configuraste en tu aplicación de Spotify
let accessToken = '';

async function obtenerToken() {
    const credentials = `${clientID}:${clientSecret}`;
    const encodedCredentials = btoa(credentials);

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    accessToken = data.access_token;
}

async function obtenerCancionesMasEscuchadas() {
    if (!accessToken) {
        console.log("No se ha obtenido el token.");
        return;
    }

    const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    const canciones = data.items.map((item) => ({
        name: item.name,
        artist: item.artists[0].name
    }));

    return canciones;
}

async function reproducirCanciones() {
    const cola = new Cola();
    const canciones = await obtenerCancionesMasEscuchadas();

    // Almacenar las canciones en la cola
    canciones.forEach(cancion => {
        cola.enqueue(cancion);
    });

    // Simular reproducción
    while (!cola.isEmpty()) {
        const cancion = cola.dequeue();
        console.log(`Reproduciendo: ${cancion.name} de ${cancion.artist}`);
    }
}

obtenerToken().then(() => {
    reproducirCanciones();
});


