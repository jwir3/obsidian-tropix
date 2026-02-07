# Changelog

All notable changes to TropiX will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial plugin structure and framework
- Core STA note creation functionality
- Template system for Sources, Topics, and Arguments
- Settings panel for customization
- Search and reference insertion functionality

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

## [1.0.0] - TBD

### Added

- **Core Features**
  - Create Source notes (🌊) with customizable tropical templates
  - Create Topic notes (🌿) with customizable tropical templates
  - Create Argument notes (🌺) with customizable tropical templates
  - Tropical palm tree ribbon icon for quick access to TropiX tools
  - Beautiful modal interface for note creation with tropical theme

- **Templates & Organization**
  - Tropical-themed default templates for each note type with structured sections
  - Template variables support (`{{title}}`, `{{date}}`)
  - Configurable default folders for each note type (optional)
  - Automatic folder creation when needed
  - Context menu creation - right-click any folder to create STA notes

- **Linking & References**
  - Insert STA reference command with tropical-themed search functionality
  - Link current note to STA structure command
  - Smart auto-detection of note types from content or tags
  - Visual tropical emoji indicators in search results (🌊🌿🌺)

- **Settings & Customization**
  - Comprehensive TropiX settings panel
  - Customizable tropical templates for each note type
  - Flexible folder organization preferences (including no defaults)
  - Tag-based note identification system
  - File explorer label visibility controls
  - Auto-linking toggle option

- **Commands**
  - `Create Source Note` - Quick tropical source note creation (🌊)
  - `Create Topic Note` - Quick tropical topic note creation (🌿)
  - `Create Argument Note` - Quick tropical argument note creation (🌺)
  - `Link current note to STA structure` - Create links from selected text
  - `Insert STA reference` - Search and insert existing STA note links
  - `Test tag identification on current note` - Debug note identification
  - `Refresh file explorer labels` - Update tropical file labels

- **User Interface**
  - Beautiful tropical-themed modal interfaces
  - Obsidian theme-aware styling with tropical colors
  - File explorer labels with tropical emojis (🌊🌿🌺)
  - Context menu integration for folder-based creation
  - Keyboard shortcuts support
  - Accessibility features

- **Developer Features**
  - TypeScript codebase with full type safety
  - Yarn package management for reliable builds
  - ESBuild configuration for optimal bundling
  - ESLint configuration for code quality
  - Comprehensive build and development scripts
  - Professional project structure with src/ organization

### Technical Implementation

- Built with Obsidian Plugin API with tropical theming
- TypeScript for type safety and better development experience
- Modular architecture with separate classes for different functionalities
- Tag-based and template-based note identification systems
- File system integration with flexible folder management
- DOM mutation observers for real-time file explorer labeling
- Comprehensive error handling and user feedback
- Plugin settings persistence
- Context menu integration for enhanced UX

---

## Release Notes Format

### Version Number Guidelines

- **Major** (X.0.0): Breaking changes, major new features
- **Minor** (1.X.0): New features, backward compatible
- **Patch** (1.0.X): Bug fixes, small improvements

### Change Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

_For the complete source code and technical details, visit the [TropiX GitHub repository](https://github.com/jwir3/obsidian-tropix)._
