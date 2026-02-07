import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import { STAPluginSettings, STANoteType, STANote, STASearchResult, DEFAULT_FOLDERS, STA_NOTE_TYPES } from './types';
import { DEFAULT_TEMPLATES } from './templates';
// Use emoji icons for tropical theme

const DEFAULT_SETTINGS: STAPluginSettings = {
	sourceTemplate: DEFAULT_TEMPLATES.source,
	topicTemplate: DEFAULT_TEMPLATES.topic,
	argumentTemplate: DEFAULT_TEMPLATES.argument,
	defaultSourcesFolder: 'Sources',
	defaultTopicsFolder: 'Topics',
	defaultArgumentsFolder: 'Arguments',
	useDefaultFolders: true,
	autoLinkReferences: true,
	useTemplates: true,
	// Tag-based identification settings
	useTagBasedIdentification: true,
	sourceTags: ['source', 'research', 'reference'],
	topicTags: ['topic', 'theme', 'subject'],
	argumentTags: ['argument', 'claim', 'position'],
	// File explorer labels
	showFileExplorerLabels: true
};

export default class STAPlugin extends Plugin {
	settings: STAPluginSettings;
	private fileLabels: Map<string, STANoteType> = new Map();
	private fileExplorerMutationObserver?: MutationObserver;

	async onload() {
		await this.loadSettings();

		// Add context menu items for folders and files
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFolder) {
					// Folder context menu - add note creation options
					menu.addSeparator();
					menu.addItem((item) => {
						item
							.setTitle('🌊 New Source Note')
							.setIcon('book-open')
							.onClick(() => {
								this.createSTANoteInFolder('source', file.path);
							});
					});
					menu.addItem((item) => {
						item
							.setTitle('🌿 New Topic Note')
							.setIcon('tag')
							.onClick(() => {
								this.createSTANoteInFolder('topic', file.path);
							});
					});
					menu.addItem((item) => {
						item
							.setTitle('🌺 New Argument Note')
							.setIcon('message-circle')
							.onClick(() => {
								this.createSTANoteInFolder('argument', file.path);
							});
					});
				} else if (file instanceof TFile && file.extension === 'md' && this.settings.useTemplates) {
					// Markdown file context menu - add template option
					menu.addSeparator();
					menu.addItem((item) => {
						item
							.setTitle('🌴 Use as TropiX Template')
							.setIcon('tree-palm')
							.onClick(() => {
								this.showTemplateSelectionModal(file);
							});
					});
				}
			})
		);

		// Add commands for creating each type of note
		this.addCommand({
			id: 'create-source-note',
			name: 'Create Source Note',
			callback: () => {
				this.createSTANote('source');
			}
		});

		this.addCommand({
			id: 'create-topic-note',
			name: 'Create Topic Note',
			callback: () => {
				this.createSTANote('topic');
			}
		});

		this.addCommand({
			id: 'create-argument-note',
			name: 'Create Argument Note',
			callback: () => {
				this.createSTANote('argument');
			}
		});

		// Add command to link current note to STA structure
		this.addCommand({
			id: 'link-to-sta',
			name: 'Link current note to STA structure',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.linkToSTAStructure(editor, view);
			}
		});

		// Add command to insert STA reference
		this.addCommand({
			id: 'insert-sta-reference',
			name: 'Insert STA reference',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new STAReferenceModal(this.app, this, editor).open();
			}
		});

		// Add command to test tag identification
		this.addCommand({
			id: 'test-tag-identification',
			name: 'Test tag identification on current note',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await this.testTagIdentification(view.file);
			}
		});

		// Add command to refresh file explorer labels
		this.addCommand({
			id: 'refresh-file-labels',
			name: 'Refresh File Explorer Labels',
			callback: async () => {
				if (this.settings.showFileExplorerLabels) {
					console.log('TropiX: Starting manual file label refresh');
					await this.refreshAllFileLabels();
					new Notice('File explorer labels refreshed');
				} else {
					new Notice('File explorer labels are disabled in settings');
				}
			}
		});

		this.addCommand({
			id: 'debug-file-labels',
			name: 'Debug File Labels',
			callback: async () => {
				console.log('TropiX: Current file labels:', this.fileLabels);
				console.log('TropiX: Show labels setting:', this.settings.showFileExplorerLabels);
				console.log('TropiX: Use tag identification:', this.settings.useTagBasedIdentification);

				// Test label detection on active file
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const noteType = await this.identifyNoteType(activeFile);
					console.log(`TropiX: Active file ${activeFile.path} detected as: ${noteType}`);
					new Notice(`Active file detected as: ${noteType || 'unknown'}`);

					// Force update the label for this file
					console.log('TropiX: Forcing label update for active file...');
					await this.updateFileLabel(activeFile);
				}
			}
		});

		this.addCommand({
			id: 'test-metropolis-label',
			name: 'Test Metropolis File Label',
			callback: async () => {
				const metropolisFile = this.app.vault.getAbstractFileByPath('Sources/Metropolis light transport.md');
				if (metropolisFile instanceof TFile) {
					console.log('TropiX: Testing Metropolis file...');
					const content = await this.app.vault.read(metropolisFile);
					console.log('TropiX: Metropolis file content preview:', content.substring(0, 300));

					// Test tag extraction
					const extractedTags = this.extractTagsFromContent(content);
					console.log('TropiX: Extracted tags:', extractedTags);

					// Test tag-based identification
					const tagBasedType = this.identifyTypeByTags(extractedTags);
					console.log('TropiX: Tag-based identification result:', tagBasedType);
					console.log('TropiX: useTagBasedIdentification setting:', this.settings.useTagBasedIdentification);
					console.log('TropiX: Source tags configuration:', this.settings.sourceTags);

					const noteType = await this.identifyNoteType(metropolisFile);
					console.log(`TropiX: Final detected type: ${noteType}`);

					// Debug DOM elements
					console.log('TropiX: Searching for DOM elements...');
					const allFileElements = document.querySelectorAll('[data-path]');
					console.log('TropiX: All file elements:', Array.from(allFileElements).map(el => el.getAttribute('data-path')));

					const specificElement = document.querySelector('[data-path="Sources/Metropolis light transport.md"]');
					console.log('TropiX: Found specific element:', specificElement);

					if (specificElement) {
						const titleContent = specificElement.querySelector('.nav-file-title-content');
						console.log('TropiX: Title content element:', titleContent);
						console.log('TropiX: Element structure:', specificElement.innerHTML);
					}

					await this.updateFileLabel(metropolisFile);
					new Notice(`Metropolis file detected as: ${noteType || 'unknown'}`);
				} else {
					new Notice('Metropolis file not found');
				}
			}
		});

		this.addCommand({
			id: 'test-label-css',
			name: 'Test Label CSS',
			callback: () => {
				// Create a test label in the document to see if CSS is working
				const testLabel = document.createElement('div');
				testLabel.innerHTML = `
					<div style="position: fixed; top: 50px; left: 50px; z-index: 9999; background: red; padding: 10px; border: 2px solid black;">
						<span class="sta-file-label sta-label-source" style="display: inline-block;">
							<span class="sta-label-icon">🌊</span>
							<span class="sta-label-text">Source</span>
						</span>
					</div>
				`;
				document.body.appendChild(testLabel);

				setTimeout(() => {
					testLabel.remove();
				}, 3000);

				new Notice('Test label displayed for 3 seconds');
				console.log('TropiX: Test label created with classes:', testLabel.querySelector('.sta-file-label')?.className);
			}
		});

		this.addCommand({
			id: 'refresh-file-explorer',
			name: 'Refresh File Explorer',
			callback: () => {
				// Force refresh the file explorer
				const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
				if (fileExplorer) {
					const explorerView = fileExplorer.view as any;
					if (explorerView.requestSort) {
						explorerView.requestSort();
					}
					if (explorerView.tree && explorerView.tree.infinityScroll) {
						explorerView.tree.infinityScroll.compute();
					}
				}

				// Also refresh our labels
				if (this.settings.showFileExplorerLabels) {
					setTimeout(() => {
						this.refreshAllFileLabels();
					}, 100);
				}

				new Notice('File explorer refreshed');
				console.log('TropiX: File explorer refresh requested');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new STASettingTab(this.app, this));

		// Initialize file view labeling if enabled
		if (this.settings.showFileExplorerLabels) {
			this.initializeFileLabeling();
		}

		// Validate tag configuration on load
		this.showTagValidationWarnings();

		// Add ribbon icon (at end for proper positioning)
		this.addRibbonIcon('tree-palm', 'TropiX Tools', (evt: MouseEvent) => {
			new STAModal(this.app, this).open();
		});
	}

	onunload() {
		// Clean up file labeling
		this.cleanupFileLabeling();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createSTANote(type: STANoteType) {
		const modal = new STANoteCreationModal(this.app, this, type);
		modal.open();
	}

	async createSTANoteInFolder(type: STANoteType, folderPath: string) {
		const modal = new STANoteCreationModal(this.app, this, type, folderPath);
		modal.open();
	}

	async createNoteFromTemplate(title: string, type: STANoteType, folder?: string, metadata?: any) {
		let template: string;
		let defaultFolder: string;

		switch (type) {
			case 'source':
				template = this.settings.sourceTemplate;
				defaultFolder = this.settings.useDefaultFolders ? this.settings.defaultSourcesFolder : '';
				break;
			case 'topic':
				template = this.settings.topicTemplate;
				defaultFolder = this.settings.useDefaultFolders ? this.settings.defaultTopicsFolder : '';
				break;
			case 'argument':
				template = this.settings.argumentTemplate;
				defaultFolder = this.settings.useDefaultFolders ? this.settings.defaultArgumentsFolder : '';
				break;
		}

		const targetFolder = folder || defaultFolder;
		const fileName = `${title}.md`;
		const filePath = targetFolder ? `${targetFolder}/${fileName}` : fileName;

		// Create folder if it doesn't exist
		if (targetFolder && !this.app.vault.getAbstractFileByPath(targetFolder)) {
			await this.app.vault.createFolder(targetFolder);
		}

		// Replace template variables
		let content = template
			.replace(/{{title}}/g, title)
			.replace(/{{date}}/g, new Date().toISOString().split('T')[0]);

		// Apply source-specific metadata if provided
		if (type === 'source' && metadata) {
			const bibtexContent = metadata.bibtex ?
				`$1\n>\`\`\`bibtex\n>${metadata.bibtex.split('\n').join('\n>')}\n>\`\`\`` :
				`$1\n>\`\`\`bibtex\n><!-- BibTeX citation will be added when available -->\n>\`\`\``;

			content = content
				.replace(/DOI:\s*$/m, `DOI: ${metadata.doi || ''}`)
				.replace(/Summary:\s*$/m, `Summary: ${metadata.summary || ''}`)
				.replace(/Year:\s*$/m, `Year: ${metadata.year || ''}`)
				.replace(/Journal:\s*$/m, `Journal: ${metadata.journal || ''}`)
				.replace(/Rating:\s*0\/5/m, `Rating: ${metadata.rating || 0}/5`)
				.replace(/(> \[!author\])\s*(\n\n)/m, `$1\n>${metadata.author || ''}$2`)
				.replace(/(> \[!summary\])\s*(\n\n)/m, `$1\n>${metadata.summary || ''}$2`)
				.replace(/### \[Link To PDF\]\(\)/, `### [Link To PDF](${metadata.pdfLink || ''})`)
				.replace(/(> \[!note\] BibTeX Citation)\s*$/m, bibtexContent);
		}

		try {
			const file = await this.app.vault.create(filePath, content);
			await this.app.workspace.getLeaf().openFile(file);
			new Notice(`Created ${type} note: ${title}`);

			// Add file labeling for newly created note
			if (this.settings.showFileExplorerLabels) {
				this.fileLabels.set(file.path, type);
				// Try multiple delays to catch when DOM is ready
				const attemptLabelUpdate = async (delay: number, attempt: number) => {
					setTimeout(async () => {
						// Check if DOM element exists
						const element = document.querySelector(`[data-path="${file.path}"]`);

						if (element) {
							const noteType = await this.identifyNoteType(file);
							await this.updateFileLabel(file);
						} else if (attempt < 5) {
							// Try again with longer delay
							attemptLabelUpdate(delay * 2, attempt + 1);
						}
					}, delay);
				};

				attemptLabelUpdate(500, 1);
			}
		} catch (error) {
			new Notice(`Error creating note: ${error.message}`);
		}
	}

	linkToSTAStructure(editor: Editor, view: MarkdownView) {
		const cursor = editor.getCursor();
		const selectedText = editor.getSelection();

		if (selectedText) {
			// If text is selected, create a link from it
			const link = `[[${selectedText}]]`;
			editor.replaceSelection(link);
		} else {
			// Otherwise, insert a placeholder link
			editor.replaceRange('[[]]', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
		}
	}

	async getAllSTANotes(type?: STANoteType): Promise<TFile[]> {
		const files = this.app.vault.getMarkdownFiles();
		const staFiles: TFile[] = [];

		for (const file of files) {
			const detectedType = await this.identifyNoteType(file);
			if (detectedType && (!type || detectedType === type)) {
				staFiles.push(file);
			}
		}

		return staFiles;
	}

	async identifyNoteType(file: TFile): Promise<STANoteType | null> {
		const content = await this.app.vault.read(file);

		// First try tag-based identification if enabled
		if (this.settings.useTagBasedIdentification) {
			const tags = this.extractTagsFromContent(content);
			const typeByTags = this.identifyTypeByTags(tags);
			if (typeByTags) {
				return typeByTags;
			}
		}

		// Fallback to template-based identification
		const typeMatch = content.match(/\*\*Type:\*\*\s*(Source|Topic|Argument)/);
		if (typeMatch) {
			return typeMatch[1].toLowerCase() as STANoteType;
		}

		return null;
	}

	extractTagsFromContent(content: string): string[] {
		const tags: string[] = [];

		// Extract hashtag-style tags (#tag)
		const hashtagMatches = content.match(/#[a-zA-Z0-9_-]+/g);
		if (hashtagMatches) {
			tags.push(...hashtagMatches.map(tag => tag.substring(1).toLowerCase()));
		}

		// Extract YAML frontmatter tags (both array and list formats)
		const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
		if (frontmatterMatch) {
			const frontmatter = frontmatterMatch[1];

			// Match array format: tags: [tag1, tag2]
			const tagsArrayMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
			if (tagsArrayMatch) {
				const yamlTags = tagsArrayMatch[1].split(',').map(tag =>
					tag.trim().replace(/['"#]/g, '').toLowerCase()
				);
				tags.push(...yamlTags);
			} else {
				// Match list format: tags:\n  - tag1\n  - tag2
				const tagsListMatch = frontmatter.match(/tags:\s*\n((?:\s*-\s*[^\n]+\n?)*)/);
				if (tagsListMatch) {
					const listItems = tagsListMatch[1].match(/\s*-\s*([^\n]+)/g);
					if (listItems) {
						const yamlTags = listItems.map(item =>
							item.replace(/\s*-\s*/, '').trim().replace(/['"#]/g, '').toLowerCase()
						);
						tags.push(...yamlTags);
					}
				}
			}
		}

		// Extract tags from "Tags:" section
		const tagsSectionMatch = content.match(/##\s*Tags\s*\n([^\n#]*)/i);
		if (tagsSectionMatch) {
			const sectionTags = tagsSectionMatch[1]
				.split(/[,\s]+/)
				.map(tag => tag.replace(/^#/, '').trim().toLowerCase())
				.filter(tag => tag.length > 0);
			tags.push(...sectionTags);
		}

		return [...new Set(tags)]; // Remove duplicates
	}

	identifyTypeByTags(noteTags: string[]): STANoteType | null {
		// Normalize the note tags (remove # and quotes, lowercase)
		const normalizedNoteTags = noteTags.map(tag =>
			tag.replace(/^#/, '').replace(/['"]/g, '').toLowerCase()
		);

		// Helper function to normalize config tags
		const normalizeConfigTag = (tag: string) =>
			tag.replace(/^#/, '').replace(/['"]/g, '').toLowerCase();

		// Check for argument tags first (most specific)
		if (this.settings.argumentTags.some(tag =>
			normalizedNoteTags.includes(normalizeConfigTag(tag))
		)) {
			return 'argument';
		}

		// Check for source tags
		if (this.settings.sourceTags.some(tag =>
			normalizedNoteTags.includes(normalizeConfigTag(tag))
		)) {
			return 'source';
		}

		// Check for topic tags
		if (this.settings.topicTags.some(tag =>
			normalizedNoteTags.includes(normalizeConfigTag(tag))
		)) {
			return 'topic';
		}

		return null;
	}

	validateTagConfiguration(): { isValid: boolean; warnings: string[] } {
		const warnings: string[] = [];

		// Check for empty tag arrays
		if (this.settings.sourceTags.length === 0) {
			warnings.push('Source tags list is empty');
		}
		if (this.settings.topicTags.length === 0) {
			warnings.push('Topic tags list is empty');
		}
		if (this.settings.argumentTags.length === 0) {
			warnings.push('Argument tags list is empty');
		}

		// Check for overlapping tags
		const allTags = [
			...this.settings.sourceTags,
			...this.settings.topicTags,
			...this.settings.argumentTags
		];
		const uniqueTags = new Set(allTags.map(tag => tag.toLowerCase()));

		if (allTags.length !== uniqueTags.size) {
			warnings.push('Some tags are used for multiple note types - this may cause ambiguous identification');
		}

		return {
			isValid: warnings.length === 0,
			warnings
		};
	}

	async showTagValidationWarnings() {
		if (!this.settings.useTagBasedIdentification) return;

		const validation = this.validateTagConfiguration();
		if (!validation.isValid) {
			const message = 'TropiX Tag Configuration Issues:\n' + validation.warnings.join('\n');
			new Notice(message, 8000);
		}
	}

	async testTagIdentification(file: TFile | null) {
		if (!file) {
			new Notice('No active file to test');
			return;
		}

		const content = await this.app.vault.read(file);
		const extractedTags = this.extractTagsFromContent(content);
		const identifiedType = await this.identifyNoteType(file);

		const method = this.settings.useTagBasedIdentification ? 'tag-based' : 'template-based';

		let message = `TropiX Tag Identification Test for "${file.basename}"\n`;
		message += `Method: ${method}\n`;
		message += `Extracted tags: ${extractedTags.length > 0 ? extractedTags.join(', ') : 'none'}\n`;
		message += `Identified type: ${identifiedType || 'unknown'}\n`;

		if (this.settings.useTagBasedIdentification && extractedTags.length > 0) {
			const matchingTags = {
				source: this.settings.sourceTags.filter(tag => extractedTags.includes(tag.toLowerCase())),
				topic: this.settings.topicTags.filter(tag => extractedTags.includes(tag.toLowerCase())),
				argument: this.settings.argumentTags.filter(tag => extractedTags.includes(tag.toLowerCase()))
			};

			message += '\nTag matches:\n';
			message += `  Sources: ${matchingTags.source.join(', ') || 'none'}\n`;
			message += `  Topics: ${matchingTags.topic.join(', ') || 'none'}\n`;
			message += `  Arguments: ${matchingTags.argument.join(', ') || 'none'}`;
		}

		new Notice(message, 10000);
	}

	async showTemplateSelectionModal(file: TFile) {
		const modal = new TemplateSelectionModal(this.app, this, file);
		modal.open();
	}

	async setTemplateFromFile(file: TFile, type: STANoteType) {
		try {
			const content = await this.app.vault.read(file);

			switch (type) {
				case 'source':
					this.settings.sourceTemplate = content;
					break;
				case 'topic':
					this.settings.topicTemplate = content;
					break;
				case 'argument':
					this.settings.argumentTemplate = content;
					break;
			}

			await this.saveSettings();
			new Notice(`Set "${file.basename}" as ${type} template`);
		} catch (error) {
			new Notice(`Error setting template: ${error.message}`);
		}
	}



	async initializeFileLabeling() {
		// Wait for workspace to be ready
		this.app.workspace.onLayoutReady(() => {
			this.setupFileExplorerObserver();
			this.refreshAllFileLabels();
		});

		// Listen for file changes
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.updateFileLabel(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					setTimeout(() => this.updateFileLabel(file), 100);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile) {
					this.fileLabels.delete(file.path);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				if (file instanceof TFile && this.fileLabels.has(oldPath)) {
					const label = this.fileLabels.get(oldPath);
					this.fileLabels.delete(oldPath);
					if (label) {
						this.fileLabels.set(file.path, label);
					}
				}
			})
		);
	}

	setupFileExplorerObserver() {
		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];

		if (!fileExplorer) {
			setTimeout(() => this.setupFileExplorerObserver(), 1000);
			return;
		}

		const explorerView = fileExplorer.view as any;

		// Try multiple approaches to find the container
		let targetNode = explorerView.containerEl ||
						explorerView.contentEl ||
						(fileExplorer as any).containerEl ||
						document.querySelector('.nav-files-container');

		if (!targetNode) {
			setTimeout(() => this.setupFileExplorerObserver(), 1000);
			return;
		}

		this.fileExplorerMutationObserver = new MutationObserver((mutations) => {
			// Use a longer delay to ensure DOM is fully updated
			setTimeout(() => this.refreshVisibleFileLabels(), 100);
		});

		this.fileExplorerMutationObserver.observe(targetNode, {
			childList: true,
			subtree: true,
			attributes: false
		});
	}

	cleanupFileLabeling() {
		if (this.fileExplorerMutationObserver) {
			this.fileExplorerMutationObserver.disconnect();
		}

		// Remove all existing labels
		document.querySelectorAll('.sta-file-label').forEach(label => label.remove());
		this.fileLabels.clear();
	}

	async refreshAllFileLabels() {
		const markdownFiles = this.app.vault.getMarkdownFiles();

		for (const file of markdownFiles) {
			await this.updateFileLabel(file);
		}

		this.refreshVisibleFileLabels();
	}

	async updateFileLabel(file: TFile) {
		const noteType = await this.identifyNoteType(file);

		if (noteType) {
			this.fileLabels.set(file.path, noteType);
		} else {
			this.fileLabels.delete(file.path);
		}

		// Update the visual label if the file is currently visible
		this.updateVisualLabel(file);
	}

	refreshVisibleFileLabels() {
		// Small delay to ensure DOM is updated
		setTimeout(() => {
			this.fileLabels.forEach((noteType, filePath) => {
				const file = this.app.vault.getAbstractFileByPath(filePath);
				if (file instanceof TFile) {
					this.updateVisualLabel(file);
				}
			});
		}, 50);
	}

	updateVisualLabel(file: TFile) {
		if (!this.settings.showFileExplorerLabels) {
			return;
		}

		// Try multiple approaches to find the file element
		const noteType = this.fileLabels.get(file.path);

		// Method 1: Try using the file explorer API
		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
		if (fileExplorer) {
			const explorerView = fileExplorer.view as any;
			const fileItem = explorerView.fileItems?.[file.path];

			if (fileItem && fileItem.titleEl) {
				this.addLabelToElement(fileItem.titleEl, file, noteType);
				return;
			}
		}

		// Method 2: Try finding the element by DOM query
		const fileName = file.name;
		const fileElements = document.querySelectorAll('.nav-file-title');

		for (const element of Array.from(fileElements)) {
			const titleContent = element.querySelector('.nav-file-title-content');
			if (titleContent && titleContent.textContent === fileName) {
				this.addLabelToElement(titleContent as HTMLElement, file, noteType);
				return;
			}
		}

		// Method 3: Try finding by data attributes
		const fileElement = document.querySelector(`[data-path="${file.path}"]`);
		if (fileElement) {
			const titleEl = fileElement.querySelector('.nav-file-title-content');
			if (titleEl) {
				this.addLabelToElement(titleEl as HTMLElement, file, noteType);
				return;
			}
		}
	}

	private addLabelToElement(titleEl: HTMLElement, file: TFile, noteType: STANoteType | undefined) {
		// Remove existing STA label
		const parentEl = titleEl.parentElement || titleEl;
		const existingLabel = parentEl.querySelector('.sta-file-label');
		if (existingLabel) {
			existingLabel.remove();
		}

		// Add new label if note type is identified
		if (noteType) {
			const labelEl = document.createElement('span');
			labelEl.className = `sta-file-label sta-label-${noteType}`;

			// Add tropical emoji icon based on note type
			const iconEl = document.createElement('span');
			iconEl.className = 'sta-label-icon';

			let emoji = '';
			switch (noteType) {
				case 'source':
					emoji = '🌊'; // Ocean waves for sources
					break;
				case 'topic':
					emoji = '🌿'; // Leaf for topics
					break;
				case 'argument':
					emoji = '🌺'; // Hibiscus flower for blossoming arguments
					break;
			}

			iconEl.textContent = emoji;

			const textEl = document.createElement('span');
			textEl.textContent = noteType.charAt(0).toUpperCase() + noteType.slice(1);
			textEl.className = 'sta-label-text';

			labelEl.appendChild(iconEl);
			labelEl.appendChild(textEl);
			labelEl.title = `TropiX ${noteType.charAt(0).toUpperCase() + noteType.slice(1)} Note`;

			// Try to append to the title content container first
			if (titleEl.classList.contains('nav-file-title-content')) {
				titleEl.appendChild(labelEl);
			} else {
				// Try to find the nav-file-title-content within this element
				const navTitleContent = titleEl.querySelector('.nav-file-title-content');
				if (navTitleContent) {
					navTitleContent.appendChild(labelEl);
				} else {
					// Fallback to parent element
					parentEl.appendChild(labelEl);
				}
			}
		}
	}
}

class STAModal extends Modal {
	plugin: STAPlugin;

	constructor(app: App, plugin: STAPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'TropiX Tools' });

		const buttonContainer = contentEl.createDiv('sta-button-container');

		const sourceBtn = buttonContainer.createEl('button', { text: 'Create Source Note', cls: 'mod-cta' });
		sourceBtn.onclick = () => {
			this.close();
			this.plugin.createSTANote('source');
		};

		const topicBtn = buttonContainer.createEl('button', { text: 'Create Topic Note', cls: 'mod-cta' });
		topicBtn.onclick = () => {
			this.close();
			this.plugin.createSTANote('topic');
		};

		const argumentBtn = buttonContainer.createEl('button', { text: 'Create Argument Note', cls: 'mod-cta' });
		argumentBtn.onclick = () => {
			this.close();
			this.plugin.createSTANote('argument');
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class TemplateSelectionModal extends Modal {
	plugin: STAPlugin;
	file: TFile;

	constructor(app: App, plugin: STAPlugin, file: TFile) {
		super(app);
		this.plugin = plugin;
		this.file = file;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: `Use "${this.file.basename}" as Template` });

		const form = contentEl.createDiv('sta-form');

		form.createEl('p', {
			text: 'Choose which type of template to replace with this note:',
			cls: 'sta-template-description'
		});

		const buttonContainer = form.createDiv('sta-button-container');

		const sourceBtn = buttonContainer.createEl('button', {
			text: '🌊 Source Template',
			cls: 'mod-cta sta-template-btn'
		});
		sourceBtn.onclick = () => {
			this.plugin.setTemplateFromFile(this.file, 'source');
			this.close();
		};

		const topicBtn = buttonContainer.createEl('button', {
			text: '🌿 Topic Template',
			cls: 'mod-cta sta-template-btn'
		});
		topicBtn.onclick = () => {
			this.plugin.setTemplateFromFile(this.file, 'topic');
			this.close();
		};

		const argumentBtn = buttonContainer.createEl('button', {
			text: '🌺 Argument Template',
			cls: 'mod-cta sta-template-btn'
		});
		argumentBtn.onclick = () => {
			this.plugin.setTemplateFromFile(this.file, 'argument');
			this.close();
		};

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.onclick = () => this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class STANoteCreationModal extends Modal {
	plugin: STAPlugin;
	type: STANoteType;
	titleInput: HTMLInputElement;
	folderInput: HTMLInputElement;
	defaultFolder?: string;

	// Source-specific metadata fields
	doiInput?: HTMLInputElement;
	authorInput?: HTMLInputElement;
	summaryInput?: HTMLTextAreaElement;
	yearInput?: HTMLInputElement;
	journalInput?: HTMLInputElement;
	pdfLinkInput?: HTMLInputElement;
	ratingInput?: HTMLInputElement;
	starRating: number = 0;
	starElements: HTMLElement[] = [];

	constructor(app: App, plugin: STAPlugin, type: STANoteType, defaultFolder?: string) {
		super(app);
		this.plugin = plugin;
		this.type = type;
		this.defaultFolder = defaultFolder;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: `Create ${this.type.charAt(0).toUpperCase() + this.type.slice(1)} Note` });

		const form = contentEl.createDiv('sta-form');

		// Title input
		form.createEl('label', { text: 'Title:' });
		this.titleInput = form.createEl('input', { type: 'text', placeholder: 'Enter note title...' });
		this.titleInput.focus();

		// Add source-specific fields
		if (this.type === 'source') {
			// Author input
			form.createEl('label', { text: 'Author (optional):' });
			this.authorInput = form.createEl('input', {
				type: 'text',
				placeholder: 'Author name(s)'
			});

			// DOI input with lookup button
			form.createEl('label', { text: 'DOI (optional):' });
			const doiContainer = form.createDiv('sta-doi-container');
			this.doiInput = doiContainer.createEl('input', {
				type: 'text',
				placeholder: '10.1000/example'
			});

			const lookupBtn = doiContainer.createEl('button', {
				text: '🔍 Lookup',
				cls: 'sta-lookup-btn'
			});
			lookupBtn.type = 'button';
			lookupBtn.onclick = () => this.lookupDOI();

			// Summary input
			form.createEl('label', { text: 'Summary (optional):' });
			this.summaryInput = form.createEl('textarea', {
				placeholder: 'Brief summary of the source...',
			});
			this.summaryInput.rows = 3;

			// Year input
			form.createEl('label', { text: 'Year (optional):' });
			this.yearInput = form.createEl('input', {
				type: 'text',
				placeholder: '2024'
			});

			// Journal input
			form.createEl('label', { text: 'Journal (optional):' });
			this.journalInput = form.createEl('input', {
				type: 'text',
				placeholder: 'Journal name'
			});

			// PDF Link input
			form.createEl('label', { text: 'PDF Link (optional):' });
			this.pdfLinkInput = form.createEl('input', {
				type: 'text',
				placeholder: 'https://example.com/paper.pdf'
			});

			// Rating input with stars
			form.createEl('label', { text: 'Rating (optional):' });
			const ratingContainer = form.createDiv('sta-star-rating');

			// Create 5 stars
			for (let i = 1; i <= 5; i++) {
				const star = ratingContainer.createSpan('sta-star');
				star.textContent = '☆';
				star.dataset.rating = i.toString();
				this.starElements.push(star);

				star.addEventListener('click', () => {
					this.setStarRating(i);
				});

				star.addEventListener('mouseenter', () => {
					this.highlightStars(i);
				});
			}

			ratingContainer.addEventListener('mouseleave', () => {
				this.highlightStars(this.starRating);
			});

			// Add "Unrated" option
			const unratedSpan = ratingContainer.createSpan('sta-unrated');
			unratedSpan.textContent = 'Unrated';
			unratedSpan.addEventListener('click', () => {
				this.setStarRating(0);
			});
		}

		// Folder input
		form.createEl('label', { text: 'Folder (optional):' });
		this.folderInput = form.createEl('input', {
			type: 'text',
			placeholder: `Default: ${this.getDefaultFolder()}`,
			value: this.defaultFolder || ''
		});

		// Buttons
		const buttonContainer = form.createDiv('sta-button-container');

		const createBtn = buttonContainer.createEl('button', { text: 'Create', cls: 'mod-cta' });
		createBtn.onclick = () => this.createNote();

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.onclick = () => this.close();

		// Handle Enter key
		this.titleInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				this.createNote();
			}
		});
	}

	getDefaultFolder(): string {
		if (this.defaultFolder) {
			return this.defaultFolder;
		}
		if (!this.plugin.settings.useDefaultFolders) {
			return 'root folder';
		}
		switch (this.type) {
			case 'source': return this.plugin.settings.defaultSourcesFolder;
			case 'topic': return this.plugin.settings.defaultTopicsFolder;
			case 'argument': return this.plugin.settings.defaultArgumentsFolder;
		}
	}

	async createNote() {
		const title = this.titleInput.value.trim();
		if (!title) {
			new Notice('Please enter a title');
			return;
		}

		const folder = this.folderInput.value.trim() || undefined;

		// Collect source metadata if this is a source note
		let metadata;
		if (this.type === 'source') {
			const doi = this.doiInput?.value.trim() || '';
			let bibtex = '';

			// Try to fetch BibTeX from CrossRef if DOI is provided
			if (doi) {
				// First check if we already fetched BibTeX during DOI lookup
				if ((this as any).fetchedBibTeX) {
					bibtex = (this as any).fetchedBibTeX;
				} else {
					try {
						bibtex = await this.fetchBibTeXFromDOI(doi);
					} catch (error) {
						console.warn('Failed to fetch BibTeX from CrossRef:', error);
						// Fallback to manual generation if API fails
						const metadataForBibTeX = await this.fetchDOIMetadata(doi);
						if (metadataForBibTeX) {
							bibtex = this.generateBibTeX(metadataForBibTeX, doi);
						}
					}
				}
			}

			metadata = {
				author: this.authorInput?.value.trim() || '',
				doi: doi,
				summary: this.summaryInput?.value.trim() || '',
				year: this.yearInput?.value.trim() || '',
				journal: this.journalInput?.value.trim() || '',
				pdfLink: this.pdfLinkInput?.value.trim() || '',
				rating: this.starRating,
				bibtex: bibtex
			};
		}

		await this.plugin.createNoteFromTemplate(title, this.type, folder, metadata);
		this.close();
	}

	async lookupDOI() {
		const doi = this.doiInput?.value.trim();
		if (!doi) {
			new Notice('Please enter a DOI first');
			return;
		}

		const lookupBtn = document.querySelector('.sta-lookup-btn') as HTMLButtonElement;
		if (lookupBtn) {
			lookupBtn.textContent = '⏳ Loading...';
			lookupBtn.disabled = true;
		}

		try {
			const metadata = await this.fetchDOIMetadata(doi);
			if (metadata) {
				this.populateFieldsFromMetadata(metadata);

				// Also try to fetch BibTeX citation
				try {
					const bibtex = await this.fetchBibTeXFromDOI(doi);
					if (bibtex) {
						new Notice('✅ DOI metadata and BibTeX citation loaded successfully!');
						// Store BibTeX for later use when creating the note
						(this as any).fetchedBibTeX = bibtex;
					} else {
						new Notice('✅ DOI metadata loaded (BibTeX generation will be manual)');
					}
				} catch (bibtexError) {
					console.warn('Failed to fetch BibTeX:', bibtexError);
					new Notice('✅ DOI metadata loaded (BibTeX generation will be manual)');
				}
			} else {
				new Notice('Could not find metadata for this DOI');
			}
		} catch (error) {
			console.error('DOI lookup error:', error);
			new Notice('Error looking up DOI. Please check the DOI and try again.');
		} finally {
			if (lookupBtn) {
				lookupBtn.textContent = '🔍 Lookup';
				lookupBtn.disabled = false;
			}
		}
	}

	async fetchDOIMetadata(doi: string): Promise<any> {
		const cleanDOI = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '');
		const url = `https://api.crossref.org/works/${cleanDOI}`;

		const response = await fetch(url, {
			headers: {
				'Accept': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		return data.message;
	}

	async fetchBibTeXFromDOI(doi: string): Promise<string> {
		const cleanDOI = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '');

		// Method 1: Try DOI.org content negotiation
		try {
			const url = `https://doi.org/${cleanDOI}`;
			const response = await fetch(url, {
				headers: {
					'Accept': 'application/x-bibtex'
				}
			});

			if (response.ok) {
				const bibtex = await response.text();
				if (bibtex.trim() && bibtex.includes('@')) {
					return bibtex.trim();
				}
			}
		} catch (error) {
			console.warn('DOI.org BibTeX fetch failed:', error);
		}

		// Method 2: Try citation.js API service
		try {
			const url = `https://citation.crosscite.org/format?doi=${cleanDOI}&style=bibtex&lang=en-US`;
			const response = await fetch(url);

			if (response.ok) {
				const bibtex = await response.text();
				if (bibtex.trim() && bibtex.includes('@')) {
					return bibtex.trim();
				}
			}
		} catch (error) {
			console.warn('Citation.crosscite.org BibTeX fetch failed:', error);
		}

		// Method 3: Fallback - generate from CrossRef metadata
		try {
			const metadata = await this.fetchDOIMetadata(doi);
			if (metadata) {
				return this.generateBibTeX(metadata, cleanDOI);
			}
		} catch (error) {
			console.warn('CrossRef metadata fallback failed:', error);
		}

		throw new Error('Failed to fetch BibTeX from all available sources');
	}

	populateFieldsFromMetadata(metadata: any) {
		// Extract and populate title (if not already filled)
		if (!this.titleInput.value && metadata.title && metadata.title[0]) {
			this.titleInput.value = metadata.title[0];
		}

		// Extract and populate author
		if (metadata.author && this.authorInput) {
			const authors = metadata.author.map((author: any) => {
				return `${author.given || ''} ${author.family || ''}`.trim();
			}).filter((name: string) => name.length > 0);
			this.authorInput.value = authors.join(', ');
		}

		// Extract and populate year
		if (metadata['published-print']?.['date-parts']?.[0]?.[0] && this.yearInput) {
			this.yearInput.value = metadata['published-print']['date-parts'][0][0].toString();
		} else if (metadata['published-online']?.['date-parts']?.[0]?.[0] && this.yearInput) {
			this.yearInput.value = metadata['published-online']['date-parts'][0][0].toString();
		}

		// Extract and populate journal
		if (metadata['container-title'] && metadata['container-title'][0] && this.journalInput) {
			this.journalInput.value = metadata['container-title'][0];
		}

		// Extract and populate summary from abstract if available
		if (metadata.abstract && this.summaryInput) {
			// Remove HTML tags from abstract and truncate if too long
			const cleanAbstract = metadata.abstract
				.replace(/<[^>]*>/g, '')
				.replace(/&[^;]+;/g, ' ')
				.trim();

			const maxLength = 200;
			const summary = cleanAbstract.length > maxLength
				? cleanAbstract.substring(0, maxLength) + '...'
				: cleanAbstract;

			this.summaryInput.value = summary;
		}

		// Extract and populate PDF link if available
		if (metadata.link && this.pdfLinkInput) {
			const pdfLink = metadata.link.find((link: any) =>
				link['content-type'] === 'application/pdf' ||
				link['content-type'] === 'unspecified'
			);
			if (pdfLink) {
				this.pdfLinkInput.value = pdfLink.URL;
			}
		}

		// Generate BibTeX citation as fallback
		const bibtex = this.generateBibTeX(metadata, this.doiInput?.value || '');
		if (bibtex) {
			console.log('Generated BibTeX citation for reference');
		}
	}

	generateBibTeXForTemplate(metadata: any, doi: string): string {
		const year = metadata['published-print']?.['date-parts']?.[0]?.[0] ||
					 metadata['published-online']?.['date-parts']?.[0]?.[0] ||
					 new Date().getFullYear();

		const authors = metadata.author?.map((author: any) =>
			`${author.family || ''}, ${author.given || ''}`.replace(/, $/, '')
		).join(' and ') || 'Unknown';

		const title = metadata.title?.[0] || 'Unknown Title';
		const journal = metadata['container-title']?.[0] || 'Unknown Journal';
		const firstAuthorLastName = metadata.author?.[0]?.family || 'unknown';
		const key = `${firstAuthorLastName.toLowerCase()}${year}`;

		return `@article{${key},\n  title={${title}},\n  author={${authors}},\n  journal={${journal}},\n  year={${year}},\n  doi={${doi}}\n}`;
	}

	generateBibTeX(metadata: any, doi: string): string {
		const year = metadata['published-print']?.['date-parts']?.[0]?.[0] ||
					 metadata['published-online']?.['date-parts']?.[0]?.[0] ||
					 new Date().getFullYear();

		const authors = metadata.author?.map((author: any) =>
			`${author.family || ''}, ${author.given || ''}`.replace(/, $/, '')
		).join(' and ') || 'Unknown';

		const title = metadata.title?.[0] || 'Unknown Title';
		const journal = metadata['container-title']?.[0] || 'Unknown Journal';

		// Create a simple key from first author and year
		const firstAuthorLastName = metadata.author?.[0]?.family || 'unknown';
		const key = `${firstAuthorLastName.toLowerCase()}${year}`;

		return `@article{${key},
  title={${title}},
  author={${authors}},
  journal={${journal}},
  year={${year}},
  doi={${doi}}
}`;
	}

	setStarRating(rating: number) {
		this.starRating = rating;
		this.highlightStars(rating);
	}

	highlightStars(rating: number) {
		this.starElements.forEach((star, index) => {
			if (index < rating) {
				star.textContent = '★';
				star.addClass('sta-star-filled');
			} else {
				star.textContent = '☆';
				star.removeClass('sta-star-filled');
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class STAReferenceModal extends Modal {
	plugin: STAPlugin;
	editor: Editor;
	searchInput: HTMLInputElement;
	resultsContainer: HTMLElement;

	constructor(app: App, plugin: STAPlugin, editor: Editor) {
		super(app);
		this.plugin = plugin;
		this.editor = editor;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Insert STA Reference' });

		// Search input
		this.searchInput = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'Search for sources, topics, or arguments...'
		});
		this.searchInput.focus();

		// Results container
		this.resultsContainer = contentEl.createDiv('sta-results');

		this.searchInput.addEventListener('input', () => {
			this.updateResults();
		});

		// Initial load of all STA notes
		this.updateResults();
	}

	async updateResults() {
		const query = this.searchInput.value.toLowerCase();
		this.resultsContainer.empty();

		const allSTANotes = await this.plugin.getAllSTANotes();

		const filteredNotes = allSTANotes.filter(file =>
			file.name.toLowerCase().includes(query) ||
			file.basename.toLowerCase().includes(query)
		);

		if (filteredNotes.length === 0) {
			this.resultsContainer.createEl('div', { text: 'No matching notes found', cls: 'sta-no-results' });
			return;
		}

		for (const file of filteredNotes.slice(0, 10)) { // Limit to 10 results
			const resultEl = this.resultsContainer.createDiv('sta-result-item');

			const detectedType = await this.plugin.identifyNoteType(file);
			const typeDisplay = detectedType ? detectedType.charAt(0).toUpperCase() + detectedType.slice(1) : 'Unknown';

			// Determine identification method
			const content = await this.app.vault.read(file);
			const identificationMethod = this.plugin.settings.useTagBasedIdentification ? 'tags' : 'template';

			resultEl.createEl('strong', { text: file.basename });

			const typeLabel = resultEl.createEl('span', {
				cls: 'sta-type-label'
			});
			typeLabel.setAttribute('data-type', detectedType || 'unknown');

			// Add tropical emoji icon to type label
			const iconEl = document.createElement('span');
			iconEl.className = 'sta-label-icon';

			let emoji = '';
			switch (detectedType) {
				case 'source':
					emoji = '🌊'; // Ocean waves for sources
					break;
				case 'topic':
					emoji = '🌿'; // Leaf for topics
					break;
				case 'argument':
					emoji = '🌺'; // Hibiscus flower for blossoming arguments
					break;
			}

			iconEl.textContent = emoji;

			const textEl = document.createElement('span');
			textEl.textContent = ` (${typeDisplay})`;
			textEl.className = 'sta-label-text';

			typeLabel.appendChild(iconEl);
			typeLabel.appendChild(textEl);

			if (this.plugin.settings.useTagBasedIdentification) {
				const tags = this.plugin.extractTagsFromContent(content);
				const relevantTags = this.getRelevantTags(tags, detectedType);
				if (relevantTags.length > 0) {
					resultEl.createEl('div', {
						text: `Tags: ${relevantTags.join(', ')}`,
						cls: 'sta-tags-display'
					});
				}
			}

			resultEl.onclick = () => {
				this.insertReference(file.basename);
				this.close();
			};
		}
	}

	getRelevantTags(allTags: string[], noteType: STANoteType | null): string[] {
		if (!noteType) return allTags.slice(0, 3); // Show first 3 tags if type unknown

		const typeTags = this.plugin.settings[`${noteType}Tags`] as string[];
		const relevantTags = allTags.filter(tag =>
			typeTags.some(typeTag => typeTag.toLowerCase() === tag.toLowerCase())
		);

		// If no relevant tags found, show first few general tags
		if (relevantTags.length === 0) {
			return allTags.slice(0, 2);
		}

		return relevantTags.slice(0, 3);
	}

	insertReference(noteName: string) {
		const cursor = this.editor.getCursor();
		const link = `[[${noteName}]]`;
		this.editor.replaceRange(link, cursor);
		this.editor.setCursor({ line: cursor.line, ch: cursor.ch + link.length });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class STASettingTab extends PluginSettingTab {
	plugin: STAPlugin;
	folderSettings: Setting[] = [];
	templateSettings: Setting[] = [];
	tagSettings: Setting[] = [];
	folderHeader: HTMLElement | null = null;
	templateHeader: HTMLElement | null = null;
	tagHeader: HTMLElement | null = null;

	constructor(app: App, plugin: STAPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'TropiX Settings' });

		// Clear settings arrays
		this.folderSettings = [];
		this.templateSettings = [];
		this.tagSettings = [];

		// Folder settings
		this.folderHeader = containerEl.createEl('h3', { text: 'Default Folders' });

		new Setting(containerEl)
			.setName('Use default folders')
			.setDesc('Automatically place new notes in default folders. When disabled, notes are created in the root or specified folder.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useDefaultFolders)
				.onChange(async (value) => {
					this.plugin.settings.useDefaultFolders = value;
					await this.plugin.saveSettings();
					this.toggleFolderSettings(value);
				}));

		const sourceFolderSetting = new Setting(containerEl)
			.setName('Sources folder')
			.setDesc('Default folder for source notes')
			.addText(text => text
				.setPlaceholder('Sources')
				.setValue(this.plugin.settings.defaultSourcesFolder)
				.onChange(async (value) => {
					this.plugin.settings.defaultSourcesFolder = value;
					await this.plugin.saveSettings();
				}));
		this.folderSettings.push(sourceFolderSetting);

		const topicFolderSetting = new Setting(containerEl)
			.setName('Topics folder')
			.setDesc('Default folder for topic notes')
			.addText(text => text
				.setPlaceholder('Topics')
				.setValue(this.plugin.settings.defaultTopicsFolder)
				.onChange(async (value) => {
					this.plugin.settings.defaultTopicsFolder = value;
					await this.plugin.saveSettings();
				}));
		this.folderSettings.push(topicFolderSetting);

		const argumentFolderSetting = new Setting(containerEl)
			.setName('Arguments folder')
			.setDesc('Default folder for argument notes')
			.addText(text => text
				.setPlaceholder('Arguments')
				.setValue(this.plugin.settings.defaultArgumentsFolder)
				.onChange(async (value) => {
					this.plugin.settings.defaultArgumentsFolder = value;
					await this.plugin.saveSettings();
				}));
		this.folderSettings.push(argumentFolderSetting);

		// Template settings
		this.templateHeader = containerEl.createEl('h3', { text: 'Templates' });

		new Setting(containerEl)
			.setName('Use templates')
			.setDesc('Use predefined templates when creating new notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useTemplates)
				.onChange(async (value) => {
					this.plugin.settings.useTemplates = value;
					await this.plugin.saveSettings();
					this.toggleTemplateSettings(value);
				}));

		const sourceTemplateSetting = new Setting(containerEl)
			.setName('Source template')
			.setDesc('Template for new source notes (use {{title}} and {{date}} as placeholders)')
			.addTextArea(text => {
				text.setPlaceholder('Enter source template...')
					.setValue(this.plugin.settings.sourceTemplate)
					.onChange(async (value) => {
						this.plugin.settings.sourceTemplate = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 8;
				text.inputEl.cols = 50;
			})
			.addButton(button => button
				.setButtonText('Reset to Default')
				.setTooltip('Reset to default source template')
				.onClick(async () => {
					this.plugin.settings.sourceTemplate = DEFAULT_TEMPLATES.source;
					await this.plugin.saveSettings();
					this.display();
				}));
		this.templateSettings.push(sourceTemplateSetting);

		const topicTemplateSetting = new Setting(containerEl)
			.setName('Topic template')
			.setDesc('Template for new topic notes')
			.addTextArea(text => {
				text.setPlaceholder('Enter topic template...')
					.setValue(this.plugin.settings.topicTemplate)
					.onChange(async (value) => {
						this.plugin.settings.topicTemplate = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 8;
				text.inputEl.cols = 50;
			})
			.addButton(button => button
				.setButtonText('Reset to Default')
				.setTooltip('Reset to default topic template')
				.onClick(async () => {
					this.plugin.settings.topicTemplate = DEFAULT_TEMPLATES.topic;
					await this.plugin.saveSettings();
					this.display();
				}));
		this.templateSettings.push(topicTemplateSetting);

		const argumentTemplateSetting = new Setting(containerEl)
			.setName('Argument template')
			.setDesc('Template for new argument notes')
			.addTextArea(text => {
				text.setPlaceholder('Enter argument template...')
					.setValue(this.plugin.settings.argumentTemplate)
					.onChange(async (value) => {
						this.plugin.settings.argumentTemplate = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 8;
				text.inputEl.cols = 50;
			})
			.addButton(button => button
				.setButtonText('Reset to Default')
				.setTooltip('Reset to default argument template')
				.onClick(async () => {
					this.plugin.settings.argumentTemplate = DEFAULT_TEMPLATES.argument;
					await this.plugin.saveSettings();
					this.display();
				}));
		this.templateSettings.push(argumentTemplateSetting);

		// Other settings
		containerEl.createEl('h3', { text: 'Other Settings' });

		new Setting(containerEl)
			.setName('Auto-link references')
			.setDesc('Automatically create links when referencing other STA notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoLinkReferences)
				.onChange(async (value) => {
					this.plugin.settings.autoLinkReferences = value;
					await this.plugin.saveSettings();
				}));

		// File explorer settings
		containerEl.createEl('h3', { text: 'File Explorer' });

		new Setting(containerEl)
			.setName('Show file explorer labels')
			.setDesc('Show STA note type labels next to file names in the file explorer')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showFileExplorerLabels)
				.onChange(async (value) => {
					this.plugin.settings.showFileExplorerLabels = value;
					await this.plugin.saveSettings();
					// Refresh file labels when setting changes
					if (value) {
						this.plugin.initializeFileLabeling();
					} else {
						this.plugin.cleanupFileLabeling();
					}
				}));

		// Tag-based identification settings
		this.tagHeader = containerEl.createEl('h3', { text: 'Tag-based Note Identification' });

		new Setting(containerEl)
			.setName('Use tag-based identification')
			.setDesc('Identify note types based on tags instead of template headers')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useTagBasedIdentification)
				.onChange(async (value) => {
					this.plugin.settings.useTagBasedIdentification = value;
					await this.plugin.saveSettings();
					this.toggleTagSettings(value);
				}));

		const sourceTagSetting = new Setting(containerEl)
			.setName('Source tags')
			.setDesc('Tags that identify source notes (comma-separated)')
			.addTextArea(text => {
				text.setPlaceholder('source, research, reference')
					.setValue(this.plugin.settings.sourceTags.join(', '))
					.onChange(async (value) => {
						this.plugin.settings.sourceTags = value
							.split(',')
							.map(tag => tag.trim())
							.filter(tag => tag.length > 0);
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 2;
				text.inputEl.cols = 50;
			});
		this.tagSettings.push(sourceTagSetting);

		const topicTagSetting = new Setting(containerEl)
			.setName('Topic tags')
			.setDesc('Tags that identify topic notes (comma-separated)')
			.addTextArea(text => {
				text.setPlaceholder('topic, theme, subject')
					.setValue(this.plugin.settings.topicTags.join(', '))
					.onChange(async (value) => {
						this.plugin.settings.topicTags = value
							.split(',')
							.map(tag => tag.trim())
							.filter(tag => tag.length > 0);
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 2;
				text.inputEl.cols = 50;
			});
		this.tagSettings.push(topicTagSetting);

		const argumentTagSetting = new Setting(containerEl)
			.setName('Argument tags')
			.setDesc('Tags that identify argument notes (comma-separated)')
			.addTextArea(text => {
				text.setPlaceholder('argument, claim, position')
					.setValue(this.plugin.settings.argumentTags.join(', '))
					.onChange(async (value) => {
						this.plugin.settings.argumentTags = value
							.split(',')
							.map(tag => tag.trim())
							.filter(tag => tag.length > 0);
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 2;
				text.inputEl.cols = 50;
			});
		this.tagSettings.push(argumentTagSetting);

		// Initialize visibility based on current settings
		this.toggleFolderSettings(this.plugin.settings.useDefaultFolders);
		this.toggleTemplateSettings(this.plugin.settings.useTemplates);
		this.toggleTagSettings(this.plugin.settings.useTagBasedIdentification);
	}

	toggleFolderSettings(enabled: boolean) {
		// Toggle header state
		if (this.folderHeader) {
			if (enabled) {
				this.folderHeader.removeClass('disabled');
			} else {
				this.folderHeader.addClass('disabled');
			}
		}

		// Toggle settings
		this.folderSettings.forEach(setting => {
			if (enabled) {
				setting.settingEl.removeClass('disabled');
				setting.settingEl.removeClass('hidden');
			} else {
				setting.settingEl.addClass('disabled');
				// Use setTimeout to allow fade animation before hiding
				setTimeout(() => {
					if (!enabled) setting.settingEl.addClass('hidden');
				}, 300);
			}
		});
	}

	toggleTemplateSettings(enabled: boolean) {
		// Toggle header state
		if (this.templateHeader) {
			if (enabled) {
				this.templateHeader.removeClass('disabled');
			} else {
				this.templateHeader.addClass('disabled');
			}
		}

		// Toggle settings
		this.templateSettings.forEach(setting => {
			if (enabled) {
				setting.settingEl.removeClass('disabled');
				setting.settingEl.removeClass('hidden');
			} else {
				setting.settingEl.addClass('disabled');
				// Use setTimeout to allow fade animation before hiding
				setTimeout(() => {
					if (!enabled) setting.settingEl.addClass('hidden');
				}, 300);
			}
		});
	}

	toggleTagSettings(enabled: boolean) {
		// Toggle header state
		if (this.tagHeader) {
			if (enabled) {
				this.tagHeader.removeClass('disabled');
			} else {
				this.tagHeader.addClass('disabled');
			}
		}

		// Toggle settings
		this.tagSettings.forEach(setting => {
			if (enabled) {
				setting.settingEl.removeClass('disabled');
				setting.settingEl.removeClass('hidden');
			} else {
				setting.settingEl.addClass('disabled');
				// Use setTimeout to allow fade animation before hiding
				setTimeout(() => {
					if (!enabled) setting.settingEl.addClass('hidden');
				}, 300);
			}
		});
	}
}
