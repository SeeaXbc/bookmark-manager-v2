# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Conversation Guidelines

- 常に日本語で会話する

## Project Overview

This is a client-side bookmark manager (v2) that allows users to manage bookmarks and folders hierarchically across multiple columns. The application uses vanilla JavaScript with external libraries and stores data in localStorage.

## Architecture

### Core Structure
- Multi-column layout with drag-and-drop reordering
- Hierarchical tree view within each column for bookmarks/folders
- Favorites bar displaying selected bookmarks across all columns
- Modal-based editing system using Micromodal.js

### Data Model
localStorage structure:
- `columns[]`: Column objects containing hierarchical item trees
- `columnOrder[]`: Column display sequence
- `favoritesOrder[]`: Favorites bar item sequence
- Items: bookmarks (URL, title, icon, favorite status) or folders (title, color, children)

### External Dependencies
- SortableJS: Drag & drop functionality
- Vanilla Picker: Color picker for folders
- Micromodal.js: Modal management
- Font Awesome: Icon system

## Development

This is a vanilla JavaScript project with no build process. Open `index.html` directly in browser to run.

Expected file structure:
- `index.html`: Main application
- `style.css`: Styling
- `script.js`: Application logic