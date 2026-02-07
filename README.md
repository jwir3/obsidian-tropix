# TropiX

A tropical-themed Obsidian plugin that adds powerful tools and templates for **Source-Topic-Argument (STA)** cross-referencing and notetaking methodology. TropiX helps you organize your research and arguments in a structured, interconnected way with a beautiful island paradise aesthetic.

## Features

### 🗂️ Structured Note Templates

- **Source Notes**: Template for capturing information from books, articles, interviews, etc.
- **Topic Notes**: Template for exploring specific subjects or themes
- **Argument Notes**: Template for developing and tracking arguments with evidence

### 🚀 Quick Note Creation

- Ribbon icon for easy access to STA tools
- Commands for rapid creation of each note type
- Customizable folder organization
- Template variables for automatic data insertion

### 🔗 Smart Linking

- Insert references to existing STA notes
- Search and link functionality
- Auto-detection of note types
- Visual type indicators

### 📁 File Explorer Labels

- Visual labels in the file explorer showing note types
- Color-coded badges (Source, Topic, Argument)
- Automatically updated when notes change
- Toggle on/off in settings

### ⚙️ Customizable Settings

- Configurable templates for each note type
- Default folder settings
- Auto-linking preferences
- Tag-based note identification system
- File explorer label customization

## Installation

### Manual Installation

1. Download the latest release from GitHub
2. Extract the files to your vault's `.obsidian/plugins/obsidian-tropix/` folder
3. Enable the plugin in Obsidian settings

## Usage

### Creating Notes

- Right-click on the folder in the Files display to select a folder to create a new note in.
  - Select "Create Source/Argument/Topic Note"
  - Fill in the appropriate details and let TropiX do its magic for you!

#### Quick Access

- Click the palm tree icon in the ribbon
- Use the command palette:
  - "Create Source Note"
  - "Create Topic Note"
  - "Create Argument Note"

#### Note Templates

TropiX comes with default note templates for Sources, Topics, and Arguments. You can change and customize these in the settings as you see fit.

The following are the default note templates:

**Source Note Template:**

```
---
DOI:
Title: {{title}}
Summary:
Year:
Journal:
Added: {{date}}
Rating: 0/5
tags:
  - "#research"
  - "#source"
---

### [Link To PDF]()

> [!author]

> [!summary]

> [!quote] Quotes

> [!note] BibTeX Citation
```

**Topic Note Template:**

```
---
tags:
  - "#research"
  - "#topic"
---

> [!example] Sources

> ![tip] Related Arguments

## Overview

## Questions

-
```

**Argument Note Template:**

```
---
tags:
  - "#research"
  - "#argument"
---

## Basics

> [!tip] Claim

## Evidence

> [!info] Sources

## Reasoning and Dispute

> [!warning] Counter-Arguments

```

### Linking Notes

#### Insert STA Reference

1. Use command "Insert STA reference" or
2. Type text and use "Link current note to STA structure" to create links

The plugin will show you a searchable list of all your STA notes with type indicators.

### File Explorer Labels

When enabled, the plugin adds visual labels next to file names in the file explorer:

- **Source** notes get a blue "🌊 Source" label
- **Topic** notes get a green "🌿 Topic" label
- **Argument** notes get a pink "🌺 Argument" label

These labels automatically update when you modify notes and can be toggled on/off in settings.

### Organization

By default, notes are organized into the following folders:

- `Sources/` - Source notes (🌊)
- `Topics/` - Topic notes (🌿)
- `Arguments/` - Argument notes (🌺)

You can customize these folders in settings or disable default folders entirely.

## STA Methodology 🌴

The Source-Topic-Argument approach with TropiX's tropical metaphor helps you:

1. **🌊 Sources**: Like the vast ocean, capture and summarize information from various materials
2. **🌿 Topics**: Like growing leaves, explore themes and organize related concepts that branch from your sources
3. **🌺 Arguments**: Like blossoming flowers, develop beautiful, reasoned positions with supporting evidence

This creates an interconnected tropical knowledge ecosystem where:

- 🌊 Sources (ocean) feed 🌿 Topics (leaves)
- 🌿 Topics (leaves) inspire 🌺 Arguments (flowers)
- 🌺 Arguments (flowers) reference 🌊 Sources (ocean)
- Everything grows together in your research paradise 🏖️

## Configuration 🏝️

### Settings

Access plugin settings through:
`Settings → Community Plugins → TropiX`

#### Default Folders

- **Sources folder**: Default location for source notes
- **Topics folder**: Default location for topic notes
- **Arguments folder**: Default location for argument notes

#### Templates

- **Use templates**: Enable/disable template system
- **Source template**: Customize source note template
- **Topic template**: Customize topic note template
- **Argument template**: Customize argument note template

#### Template Variables

- `{{title}}`: Replaced with the note title
- `{{date}}`: Replaced with current date (YYYY-MM-DD format)

#### Tag-based Identification

- **Use tag-based identification**: Choose between template-based or tag-based note detection
- **Source tags**: Configure which tags identify source notes
- **Topic tags**: Configure which tags identify topic notes
- **Argument tags**: Configure which tags identify argument notes

#### File Explorer

- **Show file explorer labels**: Display STA note type labels in the file explorer

#### Other Settings

- **Auto-link references**: Automatically create links when referencing other STA notes

## Commands

| Command                                   | Description                                   |
| ----------------------------------------- | --------------------------------------------- |
| `Create Source Note`                      | Create a new source note                      |
| `Create Topic Note`                       | Create a new topic note                       |
| `Create Argument Note`                    | Create a new argument note                    |
| `Link current note to STA structure`      | Create links from selected text               |
| `Insert STA reference`                    | Search and insert links to existing STA notes |
| `Test tag identification on current note` | Test how the current note is identified       |
| `Refresh file explorer labels`            | Manually refresh all file explorer labels     |

## Development

### Building the Plugin

```bash
# Install dependencies
yarn install

# Development build with watching
yarn dev

# Production build to dist/
yarn build

# Clean build (removes dist/ first)
yarn clean

# Create distribution package
yarn package

# Show build help
yarn help
```

### Build Output

All build outputs are placed in the `dist/` directory:

```
dist/
├── main.js          # Bundled plugin code
├── manifest.json    # Plugin manifest
├── styles.css       # Plugin styles
├── versions.json    # Version compatibility
└── README.md        # Documentation (if included)
```

### Installation from Build

1. Copy all files from `dist/` to your vault's `.obsidian/plugins/obsidian-sta/` directory
2. Enable the plugin in Obsidian settings

Or use the package command to create a zip file:

```bash
yarn package
# Creates obsidian-sta-plugin.zip
```

### Project Structure

```
obsidian-sta/
├── src/
│   ├── main.ts          # Main plugin code
│   └── styles.css       # Plugin styles
├── scripts/
│   └── build.mjs        # Advanced build script
├── dist/                # Build output directory
├── manifest.json        # Plugin manifest
├── package.json         # Node dependencies
├── tsconfig.json        # TypeScript config
├── esbuild.config.mjs   # Build configuration
├── versions.json        # Version compatibility
└── scripts/
    ├── build.mjs        # Advanced build script
    └── version-bump.mjs # Version management
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support 🌺

- 📖 [Documentation](https://github.com/jwir3/obsidian-tropix)
- 🐛 [Report Issues](https://github.com/jwir3/obsidian-tropix/issues)
- 💡 [Feature Requests](https://github.com/jwir3/obsidian-tropix/discussions)

## License

Mozilla Public License v2.0 - see [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- 🌴 Inspired by the Source-Topic-Argument methodology for structured research. See [the effortless academic article on this](https://effortlessacademic.com/academic-note-taking-system/) for more information on how to use it.
- 🏝️ Built with tropical vibes for the amazing [Obsidian](https://obsidian.md) community
- 🌺 Thanks to all contributors and users who provide feedback
- 🥥 All funding from this project supports the [Sinking Moon School of Kung Fu](https://www.sinkingmoon.com), a 501(c)3 non-profit organization dedicated to promoting peace and personal development through martial arts.

---

**Made with 🌺 in Minnesota for better notetaking in paradise** 🏖️
