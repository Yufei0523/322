# Spotify API Backend Documentation

Base URL:  
`http://localhost:3000`

---

## 1. Authorization Token Endpoint

**Route:**  
`POST /auth/token`

**Description:**  
Exchanges an authorization code obtained from Spotify for an access token.

**Required Inputs (Request Body):**  
- `code` (string): The authorization code provided by Spotify after user login.  
- `code_verifier` (string): The PKCE code verifier used during authorization.

**Response:**  
- On success:
    - A JSON object containing the following:
        - `access_token` (string): Token to be used for subsequent API calls.
        - `token_type` (string): Type of token (e.g., "Bearer").
        - `expires_in` (number): Token lifetime in seconds.
        - `refresh_token` (string): Token to refresh the access token when it expires.
- On failure:
    - 500 status with the message: "Failed to fetch token" or details of the error.

---

## 2. Getting verifier and challenge codes

**Route:**
`POST /auth/ver-cha-code`

**Description:**
Returns verifier and challenge code which are needed to authenticate to Spotify

**Required Inputs (Request Body):**
- `client_id`(string): ID of the Spotify account

**Response:**
- On success:
    - A JSON object containing the following:
        - `verifier`(string): the verifier code generated
        - `challenge`(string): the challenge code generated
- On failure:
    - 500 status with the message: "Error generating code challenge and verifier" or details of the error.

---

## 3. Fetching User Profile

**Route:**
`POST /auth/profile`

**Description:**
Recover user profil information.

**Required input (Request Body):**
- `access_token`(string): A valid token.

**Response:**
- On success:
    - A JSON object containing the user details
- On failure:
    - 500 status with the message: "Error fetching profile" or details of the error.

---

## 4. Create Playlist Endpoint

**Route:**  
`POST /api/create-playlist`

**Description:**  
Creates a new playlist for the authenticated user.

**Required Inputs (Request Body):**  
- `playlist_name` (string): The name of the playlist to be created.  
- `access_token` (string): A valid access token for authentication.

**Process:**  
1. Fetches the user profile to get the `user_id` using the `access_token`.  
2. Sends a POST request to Spotify's API to create a playlist for the user.  
3. Returns the playlist details.

**Response:**  
- On success:
    - A JSON object containing details of the newly created playlist:
    - `id` (string): Playlist ID.
    - `name` (string): Name of the playlist.
    - `href` (string): Link to the playlist.
- On failure:
    - 400 status if `playlist_name` or `access_token` is missing
    - 500 status if the playlist creation fails.

---

## 5. Add Song to Playlist Endpoint

**Route:**  
`POST /api/add-song`

**Description:**  
Searches for songs based on a keyword and genre, and adds them to a specified playlist.

**Required Inputs (Request Body):**  
- `playlist_id` (string): The ID of the playlist where songs will be added.  
- `keywordTitle` (string): The keyword used to search for songs.  
- `genre` (string): The genre filter for the song search.  
- `access_token` (string): A valid access token for authentication.

**Process:**  
1. Sends a GET request to Spotify's search API to find songs matching the provided `keywordTitle` and `genre`.  
2. Extracts the `uris` of the matching songs.  
3. Sends a POST request to add the songs to the specified playlist.

**Response:**  
- On success:  
  - A JSON object confirming the songs were added successfully.
- On failure:  
  - An error response detailing the issue, such as:
    - `No songs found for the given keyword and genre`.
    - `Error adding song to playlist`.

---

## 6. Get List of Available Genres

**Route:**
`POST /api/get-genre`

**Description:**
Search the list of all Spotify genres.

**Required Inputs (Request Body):**
- `access_token` (string): A valid access token for authentication.

**Process:**
1. Send a GET request to Spotify's API to get a json list of all genres provided by Spotify.

**Response:**
- On success:
    - A JSON object containing a list of all genres
        {
            "genres": ["alternative", "samba"]
        }
- On failure:
  - An error response detailing the issue, such as:
    - `Error fetching genres`.

---


| **Variable**      | **Type**   | **Description**                                            |
|--------------------|------------|------------------------------------------------------------|
| `code`            | `string`   | Authorization code obtained via Spotify's OAuth process.    |
| `code_verifier`   | `string`   | Code verifier for the PKCE flow.                            |
| `access_token`    | `string`   | Token used to authenticate Spotify API requests.            |
| `playlist_name`   | `string`   | Desired name for the new playlist.                          |
| `playlist_id`     | `string`   | ID of the playlist where songs will be added.               |
| `keywordTitle`    | `string`   | Search keyword for song titles.                             |
| `genre`           | `string`   | Optional genre filter for song search.                       |
| `client_id`           | `string`   | Id of the Spotify Developer Account                    |
| `verifier`           | `string`   | Verifier code needed to authorize connexion    | 
| `challenge`           | `string`   | Challenge code needed to authorize connexion                    |
--- 

Use `npm install` then `npm start` to launch.

---