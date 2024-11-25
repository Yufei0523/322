import React from 'react';
const MusicPlayer = ({ currentSong }) => {
  return (
    <div className="music-player">
      <h3>Now Playing: {currentSong ? `${currentSong.name} - ${currentSong.artist_name}` : "Select a song"}</h3>
      <div>
         {currentSong && (
              <audio src={currentSong.audio} controls>
            </audio>
         )}
      </div>
    </div>
  );
};

export default MusicPlayer;
