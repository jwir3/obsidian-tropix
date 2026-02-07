# TropiX Development Guide

This guide covers setting up and developing TropiX using Yarn - a tropical-themed Obsidian plugin for Source-Topic-Argument cross-referencing.

## Prerequisites

- **Node.js** (v16 or higher)
- **Yarn** (v1.22+ or v3+)
- **Obsidian** for testing

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd obsidian-tropix

# Install dependencies
yarn install

# Start development build with watching
yarn dev
```

## Development Scripts

### Core Commands

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `yarn dev`     | Development build with file watching |
| `yarn build`   | Production build to `dist/`          |
| `yarn clean`   | Clean the `dist/` directory          |
| `yarn package` | Create distribution zip file         |

### Additional Scripts

| Command          | Description                     |
| ---------------- | ------------------------------- |
| `yarn typecheck` | Run TypeScript type checking    |
| `yarn lint`      | Run ESLint on source files      |
| `yarn lint:fix`  | Fix ESLint issues automatically |
| `yarn help`      | Show build script help          |

### Utility Scripts

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `yarn install:plugin` | Build and copy to Obsidian plugins directory     |
| `yarn clean:all`      | Full clean (removes node_modules and reinstalls) |

## Project Structure

```
obsidian-tropix/
├── src/                   # Source files
│   ├── main.ts            # Main plugin entry point
│   ├── types.ts           # TypeScript type definitions
│   └── styles.css         # Tropical-themed plugin styles
├── scripts/               # Build and utility scripts
│   ├── build.mjs          # Advanced build script
│   └── version-bump.mjs   # Version management script
├── dist/                  # Build output (git ignored)
├── manifest.json          # Plugin manifest
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config
├── esbuild.config.mjs     # Build configuration
├── .yarnrc.yml           # Yarn configuration
└── yarn.lock             # Dependency lock file
```

## Development Workflow

### 1. Setup Development Environment

```bash
# Install dependencies
yarn install

# Verify TypeScript setup
yarn typecheck

# Run linting
yarn lint
```

### 2. Development Build

```bash
# Start development with watching (recommended)
yarn dev

# Or manual build
yarn build
```

### 3. Testing in Obsidian

#### Option A: Manual Copy

```bash
yarn build
# Copy dist/* to your-vault/.obsidian/plugins/obsidian-tropix/
```

#### Option B: Auto Install (macOS/Linux)

```bash
yarn install:plugin
```

#### Option C: Symlink for Development

```bash
# Create symlink to your vault (one-time setup)
ln -s $(pwd)/dist ~/.obsidian/plugins/obsidian-tropix

# Then just build to update
yarn build
```

### 4. Making Changes

1. **Edit source files** in `src/`
2. **Build automatically updates** (if using `yarn dev`)
3. **Reload plugin** in Obsidian settings
4. **Test your changes**

## Build System

### esbuild Configuration

- **Entry point**: `src/main.ts`
- **Output**: `dist/main.js`
- **Bundling**: All dependencies bundled
- **Source maps**: Inline for development
- **External**: Obsidian API and Electron

### File Copying

The build system automatically copies:

- `manifest.json` → `dist/manifest.json`
- `src/styles.css` → `dist/styles.css`
- `versions.json` → `dist/versions.json`

## TypeScript Setup

- **Target**: ES6
- **Module**: ESNext
- **Includes**: `src/**/*.ts`, `scripts/**/*.ts`
- **Output**: `lib/` (for type checking only)

## Code Quality

### ESLint Configuration

- Extends recommended TypeScript rules
- Custom rules for Obsidian plugin development
- Automatic fixing available with `yarn lint:fix`

### Type Safety

- Strict TypeScript configuration
- Full type definitions in `src/types.ts`
- Type checking integrated into build process

## Debugging

### Common Issues

1. **Plugin not loading**
   - Check browser console for errors
   - Verify `manifest.json` is valid
   - Ensure all files are in plugin directory

2. **Build errors**
   - Run `yarn typecheck` for TypeScript errors
   - Check `yarn lint` for code quality issues
   - Verify all dependencies are installed

3. **Hot reload not working**
   - Use `yarn dev` for file watching
   - Manually reload plugin in Obsidian after changes

### Development Tools

```bash
# Check for type errors
yarn typecheck

# Fix linting issues
yarn lint:fix

# Clean rebuild
yarn clean && yarn build

# Full reset
yarn clean:all
```

## Release Process

### Version Updates

```bash
# Update version (choose one)
yarn version patch   # 1.0.0 → 1.0.1
yarn version minor   # 1.0.0 → 1.1.0
yarn version major   # 1.0.0 → 2.0.0
```

### Creating Release

```bash
# Clean build and package
yarn clean
yarn package

# This creates obsidian-sta-plugin.zip
```

### Distribution Files

The `dist/` directory contains:

- `main.js` - Bundled plugin code
- `manifest.json` - Plugin metadata
- `styles.css` - Plugin styles
- `versions.json` - Compatibility info

## Contributing

### Code Style

- Use TypeScript for all source code
- Follow existing code patterns
- Add types for new functionality
- Update documentation for changes

### Pull Request Process

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run quality checks: `yarn typecheck && yarn lint`
5. Build and test: `yarn build`
6. Submit pull request with clear description

## Tips & Tricks

### Faster Development

```bash
# Use file watching during development
yarn dev

# Quick type check without build
yarn typecheck

# Auto-fix linting issues
yarn lint:fix
```

### Plugin Installation

```bash
# Quick install to Obsidian (macOS/Linux)
yarn install:plugin

# For Windows, manually copy dist/* to:
# %APPDATA%\Obsidian\plugins\obsidian-tropix\
```

### Build Optimization

- Production builds are smaller (no source maps)
- Development builds include debugging info
- Use `yarn clean` before important builds

## Troubleshooting

### Yarn Issues

```bash
# Clear Yarn cache
yarn cache clean

# Reinstall dependencies
yarn clean:all

# Check Yarn version
yarn --version
```

### Build Issues

```bash
# Full clean rebuild
yarn clean && yarn build

# Check for TypeScript errors
yarn typecheck

# Verify esbuild config
node esbuild.config.mjs --help
```

### Obsidian Issues

1. Check developer console (Ctrl/Cmd + Shift + I)
2. Verify plugin is enabled in settings
3. Try disabling/enabling the plugin
4. Check for conflicting plugins

## Resources

- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [esbuild Documentation](https://esbuild.github.io/)
- [Yarn Documentation](https://yarnpkg.com/)

---

For questions or issues, please check the [TropiX GitHub Issues](https://github.com/jwir3/obsidian-tropix/issues) page.
