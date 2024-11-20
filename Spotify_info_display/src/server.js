import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import bodyParser from "body-parser";
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Spotify App Credentials
const CLIENT_ID = "034e6eebfdf44cf4bef77047c2647420";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost:5173/callback";

// 1. Endpoint to get the authorization code
app.post("/auth/token", async (req, res) => {
    const { code, code_verifier } = req.body;

    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);
    params.append("code_verifier", code_verifier);

    try {
        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });

        if (!result.ok) {
            return res.status(result.status).send("Failed to fetch token");
        }

        const data = await result.json();
        res.json(data); // Send the access token back to the client
    } catch (error) {
        console.error("Error fetching access token:", error);
        res.status(500).send("Error fetching access token");
    }
});

// 2. Endpoint to get verifier and challenge codes

app.post("/auth/ver-cha-code", async (req, res) => {
    const {client_id} = req.body;

    try {
        const verifier = generateCodeVerifier(128);
        const challenge = await generateCodeChallenge(verifier);
        res.json({ verifier, challenge });

    } catch (error) {
        console.error("Error generating code challenge and verifier", error);
    }

    

});

// Function to generate a code verifier

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Function to generate a code challenge

async function generateCodeChallenge(codeVerifier) {
    // Use Node.js crypto module to generate the SHA-256 digest
    const hash = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

    // Convert the hash to a URL-safe format if necessary
    return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// 3. Endpoint to fetch the user profile

app.post("/auth/profile", async (req, res) => {
    const { access_token } = req.body;

    try {
        const result = await fetch("https://api.spotify.com/v1/me", {
            method: "GET",
            headers: { Authorization: `Bearer ${access_token}` }
        });

        res.json(await result.json());
    } catch (error) {
        console.error("Error fetching profile", error);
    }
});

// 4. Endpoint to create a playlist

app.post("/api/create-playlist", async (req, res) => {
    const { playlist_name, access_token } = req.body;

    if (!playlist_name || !access_token) {
        return res.status(400).send("Playlist name and access token are required");
    }

    const userProfileResponse = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });

    if (!userProfileResponse.ok) {
        return res.status(userProfileResponse.status).send("Error fetching user profile");
    }

    const userProfile = await userProfileResponse.json();
    const userId = userProfile.id;

    try {
        const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: playlist_name,
                public: false,
                collaborative: false,
                description: `Playlist generated by KeywordAI`,
            }),
        });

        if (!playlistResponse.ok) {
            return res.status(playlistResponse.status).send("Error creating playlist");
        }

        const playlistData = await playlistResponse.json();
        res.json(playlistData); // Send the created playlist data back to the client
    } catch (error) {
        console.error("Error creating playlist:", error);
        res.status(500).send("Error creating playlist");
    }
});

// 5. Endpoint to add songs in the playlist

app.post("/api/add-song", async (req, res) => {
    const { playlist_id, keywordTitle, genre, access_token } = req.body;

    if (!playlist_id || !access_token) {
        return res.status(400).json("Playlist id and access token are required");
    }

    let uris = [];

    // Research of songs

    console.log(genre);
    try {
        const result_research = await fetch(`https://api.spotify.com/v1/search?q=track:${keywordTitle}%20genre:${genre}%20&type=track`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${access_token}`
            }
        });
    
        if (!result_research.ok) {
            throw new Error(`HTTP error! status: ${result_research.status}`);
        }
    
        const result_json = await result_research.json();

        result_json.tracks.items.forEach(item => {
            uris.push(item.uri);
        });
    } catch (error) {
        console.error("Error searching for song", error);
        res.status(500).json("Error searching for song");
    }
    
    if (uris.length === 0) {
        return res.status(400).json({ error: "No songs found for the given keyword and genre" });
    }

    // Add song to playlist
    try {
        const param_add = {
            uris: uris,
            position: 0
        };
    
        const result_add = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(param_add),
        });
    
        if (!result_add.ok) {
            throw new Error(`HTTP error! status: ${result_add.status}`);
        }
        
        const response_add = await result_add.json();
        res.json(response_add); 
    } catch (error) {
        console.error("Error adding song to playlist");
        res.status(500).json({ error: "Error adding song to playlist", details: error.message });
    }
    
});

// 6. Endpoint to get list of available genres

app.post("/api/get-genre", async (req, res) => {
    const { access_token } = req.body;
    try {
        const result_genre = await fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
            method: "GET",
            headers: { Authorization: `Bearer ${access_token}` }
        });

        res.json(await result_genre.json());
    } catch (error) {
        console.error("Error fetching genres", error);
    }
});



// Server listening on port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});