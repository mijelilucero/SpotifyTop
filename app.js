// Crear una instancia global de la cola
let colaCanciones;

// Función para obtener las canciones más escuchadas del usuario
async function getTopTracks() {
    const accessToken = await getValidToken();
    if (!accessToken) {
        alert('No se pudo obtener un token válido. Por favor, inicia sesión nuevamente.');
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener las canciones');
        }

        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error al obtener las canciones:', error);
        return [];
    }
}

// Función para obtener la información del usuario
async function getUserProfile() {
    const accessToken = await getValidToken();
    if (!accessToken) return null;

    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener el perfil');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        return null;
    }
}

// Función para renderizar el perfil del usuario
function renderUserProfile(user) {
    if (!user) return;

    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
        let userImage = '';
        if (user.images && user.images.length > 0) {
            userImage = `<img src="${user.images[0].url}" alt="Foto de perfil" class="profile-image" />`;
        }

        userInfoElement.innerHTML = `
            <div class="user-header">
                ${userImage}
                <div class="user-details">
                    <h2>${user.display_name || 'Usuario de Spotify'}</h2>
                    <p>${user.followers?.total || 0} seguidores</p>
                </div>
            </div>
        `;
    }
}

// Función para renderizar las canciones en la cola
function renderTracks(tracks) {
    const topTracksElement = document.getElementById('top-tracks');
    if (!topTracksElement) return;

    colaCanciones = new Cola();

    let tracksHTML = '<ul class="tracks-list">';

    tracks.forEach((track, index) => {
        // Añadir cada canción a la cola
        colaCanciones.enqueue({
            id: track.id,
            name: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            image: track.album.images[0]?.url || '',
            preview_url: track.preview_url
        });

        // Crear el elemento visual para cada canción
        tracksHTML += `
            <li class="track-item" data-index="${index}">
                <div class="track-index">${index + 1}</div>
                <img src="${track.album.images[0]?.url || ''}" alt="Portada del álbum" class="track-image" />
                <div class="track-info">
                    <strong>${track.name}</strong>
                    <span>${track.artists.map(artist => artist.name).join(', ')}</span>
                    <span class="album-name">${track.album.name}</span>
                </div>
            </li>
        `;
    });

    tracksHTML += '</ul>';
    topTracksElement.innerHTML = tracksHTML;
}

// Función para reproducir (o simular la reproducción) de la siguiente canción en la cola
function playNextTrack() {
    const currentTrackElement = document.getElementById('current-track');
    const nowPlayingElement = document.getElementById('now-playing');

    if (!colaCanciones || colaCanciones.estaVacia()) {
        alert('No hay más canciones en la cola');
        return;
    }

    // Obtener y eliminar la siguiente canción de la cola (FIFO)
    const nextTrack = colaCanciones.dequeue();

    if (nextTrack) {
        // Mostrar la sección "reproduciendo ahora"
        nowPlayingElement.classList.remove('hidden');

        // Actualizar la información de la canción actual
        currentTrackElement.innerHTML = `
            <div class="current-track-container">
                <img src="${nextTrack.image}" alt="Portada del álbum" class="current-track-image" />
                <div class="current-track-info">
                    <strong>${nextTrack.name}</strong>
                    <span>${nextTrack.artist}</span>
                    <span class="album-name">${nextTrack.album}</span>
                </div>
            </div>
        `;

        // Si hay una URL de previsualización disponible, reproducirla
        if (nextTrack.preview_url) {
            const audioPlayer = document.createElement('audio');
            audioPlayer.src = nextTrack.preview_url;
            audioPlayer.controls = true;
            audioPlayer.autoplay = true;
            currentTrackElement.appendChild(audioPlayer);
        } else {
            currentTrackElement.innerHTML += '<p>Vista previa no disponible</p>';
        }

        // Actualizar visualmente la lista de canciones
        updateTracksList();
    }
}

// Función para actualizar visualmente la lista de canciones
function updateTracksList() {
    const tracksListElement = document.querySelector('.tracks-list');
    if (!tracksListElement) return;

    // Si la cola está vacía, mostrar un mensaje
    if (colaCanciones.estaVacia()) {
        tracksListElement.innerHTML = '<li class="empty-queue">No hay más canciones en la cola</li>';
        return;
    }

    // Mostrar las canciones restantes en la cola
    const remainingTracks = colaCanciones.mostrar();

    tracksListElement.innerHTML = '';
    remainingTracks.forEach((track, index) => {
        const trackItem = document.createElement('li');
        trackItem.className = 'track-item';
        trackItem.dataset.index = index;

        trackItem.innerHTML = `
            <div class="track-index">${index + 1}</div>
            <img src="${track.image}" alt="Portada del álbum" class="track-image" />
            <div class="track-info">
                <strong>${track.name}</strong>
                <span>${track.artist}</span>
                <span class="album-name">${track.album}</span>
            </div>
        `;

        tracksListElement.appendChild(trackItem);
    });
}

// Inicializar la aplicación cuando se carga la página de callback
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('/callback.html')) {
        try {
            // Obtener el perfil del usuario
            const user = await getUserProfile();
            if (user) {
                renderUserProfile(user);

                // Obtener las canciones top del usuario
                const tracks = await getTopTracks();
                if (tracks && tracks.length > 0) {
                    renderTracks(tracks);

                    // Configurar el botón para reproducir la siguiente canción
                    const playButton = document.getElementById('play-button');
                    if (playButton) {
                        playButton.addEventListener('click', playNextTrack);
                    }
                } else {
                    document.getElementById('top-tracks').innerHTML =
                        '<p>No se pudieron cargar tus canciones más escuchadas.</p>';
                }
            }
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            alert('Ocurrió un error al cargar los datos. Por favor, intenta nuevamente.');
        }
    }
});