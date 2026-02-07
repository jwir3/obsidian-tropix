#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync, writeFileSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Package manager preference
const packageManager = 'yarn';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

async function main() {
    const args = process.argv.slice(2);
    const isDev = args.includes('--dev');
    const isClean = args.includes('--clean');
    const isPackage = args.includes('--package');

    log('🌴 TropiX Build Script', 'bright');
    log('=======================', 'bright');

    try {
        // Clean step
        if (isClean) {
            logStep('CLEAN', 'Removing dist directory...');
            if (existsSync(join(rootDir, 'dist'))) {
                execSync('rimraf dist', { cwd: rootDir });
                logSuccess('Cleaned dist directory');
            } else {
                log('No dist directory to clean', 'yellow');
            }
        }

        // Ensure dist directory exists
        const distDir = join(rootDir, 'dist');
        if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true });
            logSuccess('Created dist directory');
        }

        // Generate templates.ts from template files
        logStep('GENERATE', 'Generating templates.ts from template files...');
        generateTemplatesFile();
        logSuccess('Generated templates.ts from template files');

        // TypeScript check
        logStep('CHECK', 'Running TypeScript type checking...');
        try {
            execSync(`${packageManager} run build:check`, {
                cwd: rootDir,
                stdio: 'pipe'
            });
            logSuccess('TypeScript check passed');
        } catch (error) {
            logError('TypeScript check failed');
            console.error(error.stdout?.toString());
            process.exit(1);
        }

        // Build step
        const buildMode = isDev ? 'development' : 'production';
        logStep('BUILD', `Building in ${buildMode} mode...`);

        const buildCommand = isDev ?
            'node esbuild.config.mjs' :
            'node esbuild.config.mjs production';

        execSync(buildCommand, { cwd: rootDir, stdio: 'inherit' });
        logSuccess(`Build completed in ${buildMode} mode`);

        // Copy additional files
        logStep('COPY', 'Copying additional files to dist...');
        const filesToCopy = [
            { src: 'manifest.json', required: true },
            { src: 'src/styles.css', dest: 'styles.css', required: true },
            { src: 'versions.json', required: true },
            { src: 'templates', required: false },
            { src: 'README.md', required: false },
            { src: 'LICENSE', required: false }
        ];

        let copiedCount = 0;
        filesToCopy.forEach(({ src, dest, required }) => {
            const srcPath = join(rootDir, src);
            const fileName = dest || (src.includes('/') ? src.split('/').pop() : src);
            const destPath = join(distDir, fileName);

            if (existsSync(srcPath)) {
                // Handle directory copying
                if (src === 'templates') {
                    const templatesDestDir = join(distDir, 'templates');
                    if (!existsSync(templatesDestDir)) {
                        mkdirSync(templatesDestDir, { recursive: true });
                    }
                    const templateFiles = ['source-template.md', 'topic-template.md', 'argument-template.md'];
                    templateFiles.forEach(templateFile => {
                        const templateSrc = join(rootDir, 'templates', templateFile);
                        const templateDest = join(templatesDestDir, templateFile);
                        if (existsSync(templateSrc)) {
                            copyFileSync(templateSrc, templateDest);
                        }
                    });
                    copiedCount++;
                    log(`  ✓ ${src} → templates/`, 'green');
                } else {
                    copyFileSync(srcPath, destPath);
                    copiedCount++;
                    log(`  ✓ ${src} → ${fileName}`, 'green');
                }
            } else if (required) {
                logError(`Required file missing: ${src}`);
                process.exit(1);
            } else {
                logWarning(`Optional file not found: ${src}`);
            }
        });

        logSuccess(`Copied ${copiedCount} files to dist/`);

        // Package step
        if (isPackage) {
            logStep('PACKAGE', 'Creating distribution package...');

            // Create package info file
            const packageInfo = {
                name: 'tropix',
                version: '1.0.0',
                built: new Date().toISOString(),
                files: [
                    'main.js',
                    'manifest.json',
                    'styles.css',
                    'versions.json'
                ]
            };

            writeFileSync(
                join(distDir, 'package-info.json'),
                JSON.stringify(packageInfo, null, 2)
            );

            // Create zip file
            try {
                execSync('zip -r ../tropix-plugin.zip .', {
                    cwd: distDir,
                    stdio: 'pipe'
                });
                logSuccess('Created tropix-plugin.zip');
            } catch (error) {
                logWarning('Could not create zip file (zip command not found)');
                log('You can manually zip the contents of the dist/ folder', 'yellow');
            }
        }

        // Summary
        log('\n📦 Build Summary', 'bright');
        log('================', 'bright');
        log(`Mode: ${buildMode}`);
        log(`Output: ${distDir}`);

        if (existsSync(join(distDir, 'main.js'))) {
            const stats = statSync(join(distDir, 'main.js'));
            log(`Bundle size: ${(stats.size / 1024).toFixed(2)} KB`);
        }

        log('\n🎉 Build completed successfully!', 'green');

        if (!isPackage) {
            log('\nTo install in Obsidian:', 'cyan');
            log('1. Copy files from dist/ to your vault/.obsidian/plugins/obsidian-tropix/', 'cyan');
            log('2. Enable the plugin in Obsidian settings', 'cyan');
            log('\nOr run: yarn package', 'cyan');
        }

    } catch (error) {
        logError('Build failed!');
        console.error(error);
        process.exit(1);
    }
}

// Handle CLI arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    log('TropiX Build Script', 'bright');
    log('Usage:', 'cyan');
    log('  yarn dev      # Development build with watching', 'cyan');
    log('  yarn build    # Production build', 'cyan');
    log('  yarn clean    # Clean dist directory', 'cyan');
    log('  yarn package  # Create distribution package', 'cyan');
    log('\nDirect script usage:', 'cyan');
    log('  node scripts/build.mjs [options]', 'cyan');
    log('\nOptions:', 'cyan');
    log('  --dev      Development build with watching', 'cyan');
    log('  --clean    Clean dist directory before build', 'cyan');
    log('  --package  Create distribution package', 'cyan');
    log('  --help     Show this help message', 'cyan');
    process.exit(0);
}

function generateTemplatesFile() {
    const templatesDir = join(rootDir, 'templates');
    const templateFiles = {
        'source-template.md': 'SOURCE',
        'topic-template.md': 'TOPIC',
        'argument-template.md': 'ARGUMENT'
    };

    let templatesContent = `// Default templates for TropiX note types
// These are generated at build time from template files

`;

    // Read each template file and generate the constants
    for (const [fileName, constantSuffix] of Object.entries(templateFiles)) {
        const filePath = join(templatesDir, fileName);
        if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8');
            // Escape backticks and backslashes for template literal
            const escapedContent = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
            templatesContent += `export const DEFAULT_${constantSuffix}_TEMPLATE = \`${escapedContent}\`;\n\n`;
        } else {
            log(`Warning: Template file not found: ${fileName}`, 'yellow');
        }
    }

    // Generate the DEFAULT_TEMPLATES object
    templatesContent += `export const DEFAULT_TEMPLATES = {
	source: DEFAULT_SOURCE_TEMPLATE,
	topic: DEFAULT_TOPIC_TEMPLATE,
	argument: DEFAULT_ARGUMENT_TEMPLATE
} as const;
`;

    // Write the generated file
    const outputPath = join(rootDir, 'src', 'templates.ts');
    writeFileSync(outputPath, templatesContent);
}

main();
