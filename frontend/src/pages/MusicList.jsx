import React, { useState, useEffect } from 'react';
import { Pagination, Spinner} from 'react-bootstrap';
import { useNavigate, useLocation} from 'react-router-dom';
import axios from 'axios';
import MusicPlayer from '../components/MusicPlayer';

const MusicList = () => {
  const location = useLocation();
  const { keyword, genre,decade,mood,token } = location.state || {};
  const [musicData, setMusicData] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1); 
  const [size, setSize] = useState(10); 
  const [loading, setLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);

  const navigate = useNavigate(); 
  const toHome = () => {
    navigate('/');
  };
  useEffect(() => {getMusicData();}, []);

  const getMusicData = async () => {
    setLoading(true); 
    try {
      let url= `https://api.jamendo.com/v3.0/tracks?name=${keyword}&tags=${genre}&client_id=98308d20&limit=50`;
      const response = await axios.get(url);
      setMusicData(response.data.results);
    } catch (error) {
      console.error('Error fetching music data', error);
    } finally {
      setLoading(false);
    }
  };

  

  const totalPages = Math.ceil(musicData.length / size);

  const indexOfLastData= currentPage * size;
  const indexOfFirstData = indexOfLastData - size;
  const currentData = musicData.slice(indexOfFirstData, indexOfLastData);

  const getPagination= () => {
    const items = []; 
    items.push(
      <button
        key="prev"
        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >{"<"}</button>
    );
    items.push(
      <label>
        {currentPage}/{totalPages}
      </label>
    );
    
    items.push(
      <button
        key="next"
        onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >{">"}</button>
    );
    return items;
  };

 
  const playSong = (song) => {
    setCurrentSong(song);
  };

  return (
    <div className='div-music'>
      <h3 onClick={toHome}>KeywordAI</h3>
      <div className='div-musicList'>
              
              {loading ? (
              <Spinner animation="border" variant="primary" />) : (
                <table><tr></tr>
                {currentData.map((song) => (
                  <tr>
                    <td>{song.name}</td>
                    <td>{song.artist_name }</td>
                    <td><button onClick={() => playSong(song)}>Play</button></td>
                  </tr>
                ))}
                </table>
              )}
      </div>
      <div>
      <Pagination className="div-pagination"> {getPagination()}</Pagination>
      </div>
      <div className='div-musicplayer'>{<MusicPlayer currentSong={currentSong} />}</div>
    </div>
    
  );
};

export default MusicList;
