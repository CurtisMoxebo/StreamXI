import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout.js';
import { HomePage } from './pages/HomePage.js';
import { MatchDetailPage } from './pages/MatchDetailPage.js';
import { LiveTvPage } from './pages/LiveTvPage.js';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <BrowserRouter>
      <Layout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                searchQuery={searchQuery}
                onResetSearch={() => setSearchQuery('')}
              />
            }
          />
          <Route
            path="/match/:id"
            element={<MatchDetailPage />}
          />
          <Route
            path="/live-tv"
            element={
              <LiveTvPage
                searchQuery={searchQuery}
                onResetSearch={() => setSearchQuery('')}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
