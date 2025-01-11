import React from 'react';

import MusicHome from './pages/MusicHome';
import MusicList from './pages/MusicList';
import { BrowserRouter,Routes,Route} from 'react-router-dom';

const App =()=>{
  return(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MusicHome />} />
      <Route path="/musicList" element={<MusicList />} />
    </Routes>
  </BrowserRouter>
  );
}
export default App
