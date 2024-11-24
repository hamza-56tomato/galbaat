import React from "react";
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.min.css'; 
import './styles.css';
import App from './components/app';
import './styles2.scss';




const root = createRoot(document.getElementById('root'));
root.render(<App />);