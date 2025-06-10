# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Conversation Guidelines

- 常に日本語で会話する

## Project Overview

This is a client-side bookmark manager (v2) that allows users to manage bookmarks and folders hierarchically across multiple columns. The application uses vanilla JavaScript with external libraries and stores data in localStorage.

## Development Commands

### Testing
- `npm test` - Run unit tests with Jest
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:coverage` - Run unit tests with coverage report
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:headed` - Run e2e tests with browser UI visible
- `npm run test:all` - Run both unit and e2e tests

### Setup
- `npm install` - Install dependencies
- `npm run setup` - Install dependencies and Playwright browsers
- `npx playwright install` - Install Playwright browsers only

### Running the Application
- Open `index.html` directly in browser (no build process required)
- Use local file server for CORS-free development: `python -m http.server 8000`

## Architecture

### Module Structure
The codebase has been refactored into a modular architecture:

- **Utils.js**: Utility functions (UUID generation, color conversion, DOM helpers)
- **IconService.js**: Icon management with automatic favicon fetching and persistence
- **BookmarkManager.js**: Main application logic and UI management
- **index.html**: Application entry point with script loading order

### Core Features
- Multi-column layout with drag-and-drop reordering
- Hierarchical tree view within each column for bookmarks/folders
- Favorites bar displaying selected bookmarks across all columns
- Modal-based editing system using Micromodal.js
- Automatic favicon fetching with Base64 persistence
- Icon picker with categorized Font Awesome icons

### Data Model
localStorage structure:
- `bookmarkManager`: Main data object containing:
  - `columns[]`: Column objects with hierarchical item trees
  - `columnOrder[]`: Column display sequence  
  - `favoritesOrder[]`: Favorites bar item sequence
- `iconCache`: Domain-to-icon mapping for favicon cache
- `faviconStyles`: CSS styles for custom favicon display

### External Dependencies
- SortableJS: Drag & drop functionality
- Vanilla Picker: Color picker for folders
- Micromodal.js: Modal management
- Font Awesome: Icon system

### Test Architecture
- **Unit Tests**: Jest with jsdom environment for DOM testing
- **E2E Tests**: Playwright with file:// protocol for local HTML testing
- **Test Setup**: Global mocks and utilities in `tests/setup/jest-setup.js`

## Key Implementation Details

### Icon System
- Automatic favicon fetching from Google Favicon API and DuckDuckGo
- Base64 conversion for persistence across browser refreshes
- localStorage caching with domain-based lookup
- Fallback to Font Awesome icons for common sites

### Event Management
- Event delegation pattern for dynamic DOM elements
- Proper cleanup of event listeners during re-renders
- Context menu system with dynamic content generation

### Data Persistence
- Immediate localStorage saving on all data changes
- Automatic restoration of application state on page load
- Export/import functionality for data backup and migration