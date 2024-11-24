import React, { useState,useEffect } from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';

const MusicHome = () =>{
    const [keyword, setKeyword] = useState('');
    const [genre, setGenre] = useState('');
    const [decade, setDecade] = useState('');
    const [mood, setMood] = useState('');
    const navigate = useNavigate(); 

    const handleClick = () => {
      navigate('/musicList',{
        state: {
          keyword,
          genre,
          decade,
          mood
        }
      });
    };
    return(

      <div className="maindiv">
        <div className="div-top">
                <label>KeywordAI</label>
        </div>
        <div  className="div-bottom">
           <div className="div-left">
                <input className="div-left-top" type="text" placeholder="Type Keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)}/>
                <div className="ellipse-div">
                    <label>Genre</label>
                    <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)}/>
                </div>
                <div className="ellipse-div">
                    <label>Decade</label>
                    <input type="text" value={decade} onChange={(e) => setDecade(e.target.value)}/>
                </div>
                <div className="ellipse-div">
                    <label>Mood</label>
                    <input type="text" value={mood} onChange={(e) => setMood(e.target.value)}/>
                </div>

           </div>
           <div className="div-right">
                <div onClick={handleClick}></div>
           </div>
        </div>

      </div>
      
    );
};
export default MusicHome