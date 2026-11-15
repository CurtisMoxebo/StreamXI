import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-8 text-center text-white">StreamXI Home</div>} />
        <Route path="/match/:id" element={<div className="p-8 text-center text-white">StreamXI Match Detail</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
