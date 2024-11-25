import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/main.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/musiclist.css';
import './styles/home.css';

createRoot(document.getElementById('root')).render(
    <App />
)
