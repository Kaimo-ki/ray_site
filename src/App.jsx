// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import FloatingRay from './components/FloatingRay';
import Satellite from './components/Satellite';
import { RayProvider } from './context/RayContext';
import './App.css';

function App() {
  return (
    <RayProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          
          {/* Глобальные компоненты */}
          <FloatingRay />
          <Satellite />
        </div>
      </Router>
    </RayProvider>
  );
}

export default App;