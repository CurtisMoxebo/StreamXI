import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../src/components/Layout.js';
import '../src/i18n/index.js';

describe('Frontend Step 2: Global Layout & Navigation Tests', () => {
  it('renders Header with StreamXI logo and search bar', () => {
    render(
      <BrowserRouter>
        <Layout searchQuery="" onSearchChange={() => {}}>
          <div>Page Content</div>
        </Layout>
      </BrowserRouter>
    );

    const streamElements = screen.getAllByText(/Stream/i);
    expect(streamElements.length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Search teams/i)).toBeInTheDocument();
  });

  it('opens and closes the side drawer with Football and Live TV options', () => {
    render(
      <BrowserRouter>
        <Layout searchQuery="" onSearchChange={() => {}}>
          <div>Page Content</div>
        </Layout>
      </BrowserRouter>
    );

    // Click hamburger button to open drawer
    const hamburgerBtn = screen.getByLabelText('Open Navigation Drawer');
    fireEvent.click(hamburgerBtn);

    // Verify both options exist inside drawer
    expect(screen.getByText('Football')).toBeInTheDocument();
    expect(screen.getByText('Live TV')).toBeInTheDocument();
    expect(screen.getByText('Soon')).toBeInTheDocument();

    // Close drawer
    const closeBtn = screen.getByLabelText('Close Menu Drawer');
    fireEvent.click(closeBtn);
  });

  it('renders minimal footer with copyright, date, and app name', () => {
    render(
      <BrowserRouter>
        <Layout searchQuery="" onSearchChange={() => {}}>
          <div>Page Content</div>
        </Layout>
      </BrowserRouter>
    );

    const footerText = screen.getByText(/© 2026 StreamXI. All rights reserved./i);
    expect(footerText).toBeInTheDocument();
  });

  it('allows language menu to toggle languages with flags', () => {
    render(
      <BrowserRouter>
        <Layout searchQuery="" onSearchChange={() => {}}>
          <div>Page Content</div>
        </Layout>
      </BrowserRouter>
    );

    const langBtn = screen.getByLabelText('Language selector');
    fireEvent.click(langBtn);

    // Check all 3 language options with their flags
    expect(screen.getByText(/English \(EN\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Français \(FR\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Español \(ES\)/i)).toBeInTheDocument();

    // Switch to French
    fireEvent.click(screen.getByText(/Français \(FR\)/i));
    expect(screen.getByText('FR')).toBeInTheDocument();
  });
});
