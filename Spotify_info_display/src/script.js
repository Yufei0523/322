export const clientId = "034e6eebfdf44cf4bef77047c2647420"; // Replace with your client id
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {

    redirectToAuthCodeFlow(clientId);

} else {

    // Loading of the Data

    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    console.log(profile);
    populateUI(profile);

    // createPlaylistButton

    const createPlaylistButton = document.getElementById("create_playlist_button");
    const playlistName = document.getElementById("playlist_name");
    const keywordTitle = document.getElementById("keyword_title");

    // Genre display function

    async function fetchAndRenderGenres() {
        try {
            const result_genre = await fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` }
            });
        
            const genre_json = await result_genre.json();
        
            const genres = genre_json.genres;
        
            // DOM elements

            const genre_input = document.getElementById("genre_input");
            const optionsContainer = document.getElementById("genre_options");
        
            // Display options

            function renderOptions(filteredOptions) {

                optionsContainer.innerHTML = ""; // Erase old options

                filteredOptions.forEach(option => {
                    const div = document.createElement("div");
                    div.textContent = option; // Display text
                    div.onclick = () => {
                        genre_input.value = option;
                        optionsContainer.innerHTML = "";
                    };
                    optionsContainer.appendChild(div);
                });
            }
        
            // User input

            genre_input.addEventListener("input", () => {
                const searchText = genre_input.value.toLowerCase();
                const filteredOptions = genres.filter(option =>
                option.toLowerCase().includes(searchText)
                );
                renderOptions(filteredOptions);
            });
        
            // Remove commentary if you want to display options directly
            // renderOptions(genres);

        } catch (error) {
            console.error("Genre recovery error :", error);
        }
    }

    // Always working

    fetchAndRenderGenres();

    if (createPlaylistButton) {
        createPlaylistButton.addEventListener("click", async () => {
            const userID = profile.id;
            try {
                const playlist = await createPlaylist(userID, accessToken, playlistName.value);
                if (keywordTitle.value) {
                    const playlist_id = playlist.id;
                    addSong_based_on_title(accessToken, playlist_id, keywordTitle.value, genre_input.value);
                }
                console.log("Playlist created", playlist);
            } catch (error) {
                console.error("Error creating playlist", error);
            }
        });
    }
}

//// getAccessToken function ////

export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

//////////// fetchProfile function ////////////

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

//////////// populateUI function ////////////

function populateUI(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
        document.getElementById("imgUrl").innerText = profile.images[0].url;
    }
    document.getElementById("id").innerText = profile.id;
    document.getElementById("email").innerText = profile.email;
    document.getElementById("uri").innerText = profile.uri;
    document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url").innerText = profile.href;
    document.getElementById("url").setAttribute("href", profile.href);
}

//////////// Recovery of Spotify data ////////////

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "playlist-modify-public playlist-modify-private user-read-private user-read-email");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

//////////// createPlaylist function ////////////

async function createPlaylist(userID, accessToken, playlistName) {

    // parameters of the playlist (can be changed by the user later)
    if (!playlistName) {
        playlistName = "NewPlaylist";
    }

    const param = {
        name: playlistName,
        public: false,
        collaborative: false,
        description: "Playlist generated by KeywordAI"
    };

    const result = await fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
        method: "POST",
        headers: { 
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify(param)
    });

    if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
    }

    // Confirmation message

    const message = document.getElementById("playlist_created");
    if (message) {
        message.innerText = "Playlist created successfully!";
    }

    return await result.json();
}

//////////// addSong_based_on_title function ////////////

async function addSong_based_on_title(accessToken, playlist_id, keywordTitle, genre) {

    if (!keywordTitle) {
        keywordTitle = "Blue";
    }

    // song uris recovery

    const result_research = await fetch(`https://api.spotify.com/v1/search?q=track:${keywordTitle}%20genre:${genre}%20&type=track`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });

    if (!result_research.ok) {
        throw new Error(`HTTP error! status: ${result_research.status}`);
    }

    const result_json = await result_research.json();
    let uris = [];
    console.log(result_json);
    console.log('IDs des pistes :');
    result_json.tracks.items.forEach(item => {
        uris.push(item.uri);
        console.log(`ID de la piste: ${item.id}`);
    });

    console.log(`tableau uris: ${uris}`);

    // playlist song adding

    const param_add = {
        uris: uris,
        position: 0
    };

    const result_add = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify(param_add)
    });

    if (!result_add.ok) {
        throw new Error(`HTTP error! status: ${result_add.status}`);
    }
    
    return await result_add.json();
}