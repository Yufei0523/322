export const clientId = "034e6eebfdf44cf4bef77047c2647420"; // Replace with your client id

// Verify if the code is present in the URL
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
    const result = await fetch("http://localhost:3000/auth/ver-cha-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId })
    });
    console.log(result);
    const { verifier, challenge } = await result.json();
    redirectToAuthCodeFlow(clientId, verifier, challenge);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    console.log(profile);
    populateUI(profile);

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
    
    document.getElementById("create_playlist_button").addEventListener("click", async () => {
        try {
            const playlistName = document.getElementById("playlist_name").value;
            const playlist = await createPlaylist(playlistName, accessToken);
            const keywordTitle = document.getElementById("keyword_title");

            if (keywordTitle.value) {
                const playlist_id = playlist.id;
                const res_add = await addSong_based_on_title(accessToken, playlist_id, keywordTitle.value, genre_input.value);
                const tracks = res_add.song_list;
                console.log(tracks);
            }       
        } catch (error) {
            console.error("Error creating playlist", error);
        }
    });
}

// Function to get the access token

export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("http://localhost:3000/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    if (!result.ok) {
        throw new Error("Failed to fetch access token");
    }

    const { access_token } = await result.json();
    return access_token;
}

// Function to fetch the user profile

async function fetchProfile(token) {

    const result = await fetch("http://localhost:3000/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token })
    })

    return await result.json();
}

// Function to populate the user interface

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

// Function to redirect to the Spotify authentication page

export async function redirectToAuthCodeFlow(clientId, verifier, challenge) {

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

// ----------- createPlaylist function ----------- //

async function createPlaylist(playlistName, accessToken) {
    if (!playlistName) {
        playlistName = "New Playlist";
    }

    try {
        const response = await fetch('http://localhost:3000/api/create-playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                playlist_name: playlistName,
                access_token: accessToken,
            }),
        });

        const data = await response.json();
    
        if (response.ok) {
            document.getElementById("playlist_created").innerText = `Playlist created successfully: ${data.name}`;
        } else {
            document.getElementById("playlist_created").innerText = `Error: ${data.error}`;
        }
        
        return data;
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("playlist_created").innerText = "An error occurred while creating the playlist.";
    }
}

// ----------- addSong function ----------- //

async function addSong_based_on_title(accessToken, playlist_id, keywordTitle, genre) {
    if (!keywordTitle) {
        keywordTitle = "Blue";
    }

    if (!genre) {
        genre = "pop";
    }

    try {
        const response = await fetch('http://localhost:3000/api/add-song', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playlist_id: playlist_id,
                keywordTitle: keywordTitle,
                genre: genre,
                access_token: accessToken
            }),
        });

        // Vérifier si la réponse est ok
        if (!response.ok) {
            // Essayer de récupérer la réponse JSON (si disponible) ou le texte brut
            const errorData = await response.json().catch(() => response.text());
            throw new Error(`Error: ${errorData.error || errorData}, Details: ${errorData.details || 'No details'}`);
        }

        const data = await response.json();  // Lire la réponse JSON
        return data;

    } catch (error) {
        console.error("Error:", error);
        alert(error.message);  // Afficher le message d'erreur
    }
}