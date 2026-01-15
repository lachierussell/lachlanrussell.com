import type { FileSystemNode } from '../types/index.js';

// Helper to create nodes with consistent structure
function createNode(
  id: string,
  name: string,
  type: 'file' | 'folder',
  path: string,
  parentId: string | null,
  options: Partial<FileSystemNode> = {}
): FileSystemNode {
  const now = new Date();
  return {
    id,
    name,
    type,
    path,
    parentId,
    createdAt: now,
    modifiedAt: now,
    ...options,
  };
}

export function getInitialFileSystem(): FileSystemNode[] {
  const nodes: FileSystemNode[] = [];

  // Root folder
  nodes.push(createNode('root', '/', 'folder', '/', null, {
    children: ['home', 'projects', 'images', 'documents', 'music', 'downloads', 'scripts', 'applications', 'about.txt'],
    icon: '📁',
  }));

  // === APPLICATIONS (special launcher folder) ===
  nodes.push(createNode('applications', 'Applications', 'folder', '/applications', 'root', {
    children: ['app-terminal', 'app-browser', 'app-files', 'app-clock', 'app-calc', 'app-eyes'],
    icon: '🚀',
  }));

  nodes.push(createNode('app-terminal', 'Terminal.app', 'file', '/applications/Terminal.app', 'applications', {
    content: 'xterm',
    mimeType: 'application/x-app',
    icon: '💻',
  }));

  nodes.push(createNode('app-browser', 'Browser.app', 'file', '/applications/Browser.app', 'applications', {
    content: 'browser',
    mimeType: 'application/x-app',
    icon: '🌐',
  }));

  nodes.push(createNode('app-files', 'Files.app', 'file', '/applications/Files.app', 'applications', {
    content: 'file-manager',
    mimeType: 'application/x-app',
    icon: '📁',
  }));

  nodes.push(createNode('app-clock', 'Clock.app', 'file', '/applications/Clock.app', 'applications', {
    content: 'clock',
    mimeType: 'application/x-app',
    icon: '🕐',
  }));

  nodes.push(createNode('app-calc', 'Calculator.app', 'file', '/applications/Calculator.app', 'applications', {
    content: 'calculator',
    mimeType: 'application/x-app',
    icon: '🔢',
  }));

  nodes.push(createNode('app-eyes', 'Eyes.app', 'file', '/applications/Eyes.app', 'applications', {
    content: 'xeyes',
    mimeType: 'application/x-app',
    icon: '👀',
  }));

  // === HOME FOLDER ===
  nodes.push(createNode('home', 'Home', 'folder', '/home', 'root', {
    children: ['home-welcome', 'home-resume', 'home-profile', 'home-bookmarks'],
    icon: '🏠',
  }));

  nodes.push(createNode('home-welcome', 'welcome.txt', 'file', '/home/welcome.txt', 'home', {
    content: `Welcome to OpenBSD!
===================

This site emulates the default OpenBSD FVWM desktop.

Getting Started
---------------
• Right-click the desktop to launch applications
• Double-click folders to browse the filesystem  
• Double-click files to open them
• Drag window title bars to move windows
• Drag window edges to resize

Try launching xterm and typing 'help' for commands.

"OpenBSD: Only two remote holes in the default install,
in a heck of a long time!"`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('home-resume', 'resume.txt', 'file', '/home/resume.txt', 'home', {
    content: `RESUME
======

[Your Name]
Software Developer

EXPERIENCE
----------
• Full-stack web development
• TypeScript, JavaScript, HTML, CSS
• React, Lit, Web Components
• Node.js, Python

EDUCATION
---------
• Computer Science Degree

INTERESTS
---------
• Retro computing
• Open source software
• UI/UX design`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('home-profile', '.profile', 'file', '/home/.profile', 'home', {
    content: `# ~/.profile - Bourne shell startup file
    
export PATH=$HOME/bin:/usr/local/bin:$PATH
export EDITOR=vim
export PAGER=less
export LANG=en_US.UTF-8

# OpenBSD specific
export PKG_PATH=https://cdn.openbsd.org/pub/OpenBSD/$(uname -r)/packages/$(uname -m)/

# Aliases
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias grep='grep --color=auto'

# Prompt
PS1='\\u@\\h:\\w\\$ '

echo "Welcome to OpenBSD!"`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('home-bookmarks', 'bookmarks.txt', 'file', '/home/bookmarks.txt', 'home', {
    content: `BOOKMARKS
=========

OpenBSD Resources
-----------------
• https://www.openbsd.org - Official OpenBSD website
• https://man.openbsd.org - Online manual pages
• https://www.openbsd.org/faq - OpenBSD FAQ
• https://undeadly.org - OpenBSD Journal

Development
-----------
• https://github.com - Code hosting
• https://stackoverflow.com - Q&A for developers
• https://developer.mozilla.org - Web documentation

News & Reading
--------------
• https://news.ycombinator.com - Hacker News
• https://lobste.rs - Computing-focused community
• https://lwn.net - Linux Weekly News`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  // === PROJECTS FOLDER ===
  nodes.push(createNode('projects', 'Projects', 'folder', '/projects', 'root', {
    children: ['proj-xwindow', 'proj-webapp', 'proj-cli'],
    icon: '💼',
  }));

  nodes.push(createNode('proj-xwindow', 'X-Window-Site', 'folder', '/projects/X-Window-Site', 'projects', {
    children: ['proj-xwindow-readme'],
    icon: '📁',
  }));

  nodes.push(createNode('proj-xwindow-readme', 'README.md', 'file', '/projects/X-Window-Site/README.md', 'proj-xwindow', {
    content: `# X Window System Personal Website

A personal website built to emulate the classic X Window System experience.

## Features
- Draggable, resizable windows
- Virtual file system
- Desktop icons
- File manager application
- Text and image viewers

## Technologies
- Lit Web Components
- TypeScript
- Vite`,
    mimeType: 'text/markdown',
    icon: '📄',
  }));

  nodes.push(createNode('proj-webapp', 'Web-App', 'folder', '/projects/Web-App', 'projects', {
    children: ['proj-webapp-readme'],
    icon: '📁',
  }));

  nodes.push(createNode('proj-webapp-readme', 'README.md', 'file', '/projects/Web-App/README.md', 'proj-webapp', {
    content: `# Sample Web Application

A modern web application showcasing responsive design and accessibility.

## Stack
- Frontend: TypeScript, CSS Grid
- Backend: Node.js
- Database: PostgreSQL`,
    mimeType: 'text/markdown',
    icon: '📄',
  }));

  nodes.push(createNode('proj-cli', 'CLI-Tool', 'folder', '/projects/CLI-Tool', 'projects', {
    children: ['proj-cli-readme'],
    icon: '📁',
  }));

  nodes.push(createNode('proj-cli-readme', 'README.md', 'file', '/projects/CLI-Tool/README.md', 'proj-cli', {
    content: `# Command Line Tool

A powerful CLI tool for automating development tasks.

## Usage
\`\`\`bash
$ mytool --help
$ mytool init
$ mytool build
\`\`\``,
    mimeType: 'text/markdown',
    icon: '📄',
  }));

  // === IMAGES FOLDER ===
  nodes.push(createNode('images', 'Images', 'folder', '/images', 'root', {
    children: ['img-landscape', 'img-portrait', 'img-icon'],
    icon: '🖼️',
  }));

  nodes.push(createNode('img-landscape', 'landscape.jpg', 'file', '/images/landscape.jpg', 'images', {
    content: 'https://picsum.photos/800/600?random=1',
    mimeType: 'image/jpeg',
    icon: '🖼️',
  }));

  nodes.push(createNode('img-portrait', 'portrait.jpg', 'file', '/images/portrait.jpg', 'images', {
    content: 'https://picsum.photos/600/800?random=2',
    mimeType: 'image/jpeg',
    icon: '🖼️',
  }));

  nodes.push(createNode('img-icon', 'icon.png', 'file', '/images/icon.png', 'images', {
    content: 'https://picsum.photos/200/200?random=3',
    mimeType: 'image/png',
    icon: '🖼️',
  }));

  // === DOCUMENTS FOLDER ===
  nodes.push(createNode('documents', 'Documents', 'folder', '/documents', 'root', {
    children: ['doc-notes', 'doc-ideas', 'doc-todo', 'doc-links', 'doc-cheatsheet'],
    icon: '📂',
  }));

  nodes.push(createNode('doc-notes', 'notes.txt', 'file', '/documents/notes.txt', 'documents', {
    content: `Development Notes
=================

TODO:
- [ ] Add more window animations
- [ ] Implement file search
- [ ] Add keyboard shortcuts
- [ ] Create settings panel

DONE:
- [x] Basic window management
- [x] File system navigation
- [x] Desktop icons`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('doc-ideas', 'ideas.txt', 'file', '/documents/ideas.txt', 'documents', {
    content: `Future Ideas
============

1. Terminal emulator app ✓
2. Simple text editor with save
3. Calculator app ✓
4. Settings/preferences panel
5. Multiple desktop workspaces
6. Window snapping to edges ✓
7. Customizable themes
8. Drag and drop file management
9. System tray / notification area
10. Screen lock / screensaver`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('doc-todo', 'todo.txt', 'file', '/documents/todo.txt', 'documents', {
    content: `TODO LIST
=========

Today
-----
[x] Check email
[x] Review pull requests  
[ ] Update documentation
[ ] Fix bug in login flow

This Week
---------
[ ] Finish API integration
[ ] Write unit tests
[ ] Deploy to staging
[ ] Team meeting Friday

Someday
-------
[ ] Learn Rust
[ ] Contribute to OpenBSD
[ ] Build a mechanical keyboard`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('doc-links', 'links.txt', 'file', '/documents/links.txt', 'documents', {
    content: `USEFUL LINKS
============

Documentation
-------------
• Lit: https://lit.dev/docs/
• TypeScript: https://www.typescriptlang.org/docs/
• MDN Web Docs: https://developer.mozilla.org/

Tools
-----
• VS Code: https://code.visualstudio.com/
• Git: https://git-scm.com/
• Node.js: https://nodejs.org/

Design Inspiration
------------------
• Dribbble: https://dribbble.com/
• Awwwards: https://www.awwwards.com/
• X11 Screenshots: https://xwinman.org/`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('doc-cheatsheet', 'shortcuts.txt', 'file', '/documents/shortcuts.txt', 'documents', {
    content: `KEYBOARD SHORTCUTS
==================

Window Management
-----------------
Alt+Tab       Cycle through windows
Alt+Shift+Tab Cycle backwards
Alt+F4        Close window
Alt+M         Minimize window
Alt+X         Maximize/restore window

Desktop
-------
Ctrl+N        New file manager
F5            Refresh desktop
Enter         Open selected icon
Delete        Close focused window
Escape        Deselect / close menu
Arrow Keys    Navigate icons

Terminal (xterm)
----------------
Ctrl+C        Cancel command
Ctrl+L        Clear screen
Up/Down       Command history
Tab           Auto-complete`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  // === MUSIC FOLDER ===
  nodes.push(createNode('music', 'Music', 'folder', '/music', 'root', {
    children: ['music-playlist', 'music-favorites', 'music-readme'],
    icon: '🎵',
  }));

  nodes.push(createNode('music-readme', 'README.txt', 'file', '/music/README.txt', 'music', {
    content: `MUSIC COLLECTION
================

This folder contains playlists and music notes.

Supported formats: MP3, FLAC, OGG, WAV

Tip: Use 'aucat' for audio playback on OpenBSD!`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('music-playlist', 'playlist.txt', 'file', '/music/playlist.txt', 'music', {
    content: `CODING PLAYLIST
===============

Focus & Concentration
---------------------
1. Boards of Canada - Music Has the Right to Children
2. Brian Eno - Ambient 1: Music for Airports
3. Tycho - Dive
4. Bonobo - Black Sands
5. Nujabes - Metaphorical Music

Energetic Coding
----------------
1. Daft Punk - Discovery
2. Justice - Cross
3. The Prodigy - Fat of the Land
4. Kavinsky - OutRun
5. Carpenter Brut - Trilogy`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('music-favorites', 'favorites.txt', 'file', '/music/favorites.txt', 'music', {
    content: `FAVORITE ALBUMS
===============

All-Time Favorites
------------------
★ Pink Floyd - Dark Side of the Moon
★ Radiohead - OK Computer
★ Aphex Twin - Selected Ambient Works
★ Massive Attack - Mezzanine
★ Portishead - Dummy

Recent Discoveries
------------------
• Floating Points - Crush
• BADBADNOTGOOD - IV
• Khruangbin - Con Todo El Mundo`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  // === DOWNLOADS FOLDER ===
  nodes.push(createNode('downloads', 'Downloads', 'folder', '/downloads', 'root', {
    children: ['dl-readme', 'dl-packages', 'dl-sources'],
    icon: '📥',
  }));

  nodes.push(createNode('dl-readme', 'README.txt', 'file', '/downloads/README.txt', 'downloads', {
    content: `DOWNLOADS FOLDER
================

This folder contains downloaded files.

Remember to verify checksums!

$ sha256 filename
$ signify -Vep /etc/signify/openbsd-74-base.pub -m SHA256.sig`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('dl-packages', 'packages.txt', 'file', '/downloads/packages.txt', 'downloads', {
    content: `RECOMMENDED PACKAGES
====================

Essential Tools
---------------
pkg_add vim
pkg_add git
pkg_add curl
pkg_add wget
pkg_add rsync

Development
-----------
pkg_add node
pkg_add python3
pkg_add go
pkg_add rust

Desktop
-------
pkg_add firefox
pkg_add chromium
pkg_add gimp
pkg_add vlc`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('dl-sources', 'sources.txt', 'file', '/downloads/sources.txt', 'downloads', {
    content: `SOURCE REPOSITORIES
===================

OpenBSD
-------
https://github.com/openbsd/src
https://cvsweb.openbsd.org/

Mirrors
-------
https://cdn.openbsd.org/pub/OpenBSD/
https://ftp.openbsd.org/pub/OpenBSD/

Package Sources
---------------
https://github.com/openbsd/ports`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  // === SCRIPTS FOLDER ===
  nodes.push(createNode('scripts', 'Scripts', 'folder', '/scripts', 'root', {
    children: ['script-backup', 'script-update', 'script-clean', 'script-readme'],
    icon: '📜',
  }));

  nodes.push(createNode('script-readme', 'README.txt', 'file', '/scripts/README.txt', 'scripts', {
    content: `SHELL SCRIPTS
=============

This folder contains useful shell scripts.

To make a script executable:
$ chmod +x script.sh

To run a script:
$ ./script.sh

Always review scripts before running them!`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('script-backup', 'backup.sh', 'file', '/scripts/backup.sh', 'scripts', {
    content: `#!/bin/sh
# backup.sh - Simple backup script

BACKUP_DIR="/var/backup"
DATE=$(date +%Y%m%d)
HOSTNAME=$(hostname -s)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup home directory
tar -czf $BACKUP_DIR/home-$HOSTNAME-$DATE.tar.gz /home

# Backup etc
tar -czf $BACKUP_DIR/etc-$HOSTNAME-$DATE.tar.gz /etc

echo "Backup completed: $DATE"`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('script-update', 'update.sh', 'file', '/scripts/update.sh', 'scripts', {
    content: `#!/bin/sh
# update.sh - System update script

echo "Updating OpenBSD system..."

# Update packages
echo "Updating packages..."
pkg_add -u

# Update firmware (if needed)
echo "Checking firmware..."
fw_update

# Clean package cache
echo "Cleaning cache..."
pkg_delete -a

echo "Update complete!"
echo "Consider rebooting if kernel was updated."`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  nodes.push(createNode('script-clean', 'clean.sh', 'file', '/scripts/clean.sh', 'scripts', {
    content: `#!/bin/sh
# clean.sh - Cleanup script

echo "Cleaning system..."

# Clean /tmp
echo "Cleaning /tmp..."
rm -rf /tmp/*

# Clean package cache
echo "Cleaning package cache..."
rm -rf /var/cache/pkg/*

# Clean old logs
echo "Rotating logs..."
newsyslog

# Show disk usage
echo ""
echo "Disk usage:"
df -h

echo ""
echo "Cleanup complete!"`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  // === ROOT FILES ===
  nodes.push(createNode('about.txt', 'about.txt', 'file', '/about.txt', 'root', {
    content: `About This Site
===============

Welcome! This website emulates the OpenBSD desktop experience,
featuring FVWM - the classic X11 window manager.

OpenBSD: Free, Functional, and Secure
-------------------------------------
OpenBSD is known for its focus on security, code correctness,
and integrated cryptography. The default desktop uses FVWM,
providing a clean, minimal, and efficient interface.

Features
--------
• Draggable and resizable windows (FVWM style)
• Virtual filesystem with file manager
• Classic X11 applications:
  - xterm (terminal emulator)
  - xclock (analog clock)
  - xcalc (calculator)
  - xeyes (follows your cursor!)

Keyboard Shortcuts
------------------
Alt+Tab     - Cycle windows
Alt+F4      - Close window
Alt+M       - Minimize
Alt+X       - Maximize
Ctrl+N      - New file manager
Right-click - Application menu

"Languid: you have no langstrings."

Contact: your.email@example.com`,
    mimeType: 'text/plain',
    icon: '📄',
  }));

  return nodes;
}
