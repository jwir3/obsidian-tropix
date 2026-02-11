// Type definitions for the STA Plugin

export interface STAPluginSettings {
	sourceTemplate: string;
	topicTemplate: string;
	argumentTemplate: string;
	defaultSourcesFolder: string;
	defaultTopicsFolder: string;
	defaultArgumentsFolder: string;
	useDefaultFolders: boolean;
	autoLinkReferences: boolean;
	useTemplates: boolean;
	// Tag-based identification
	useTagBasedIdentification: boolean;
	sourceTags: string[];
	topicTags: string[];
	argumentTags: string[];
	// File explorer labels
	showFileExplorerLabels: boolean;
	// PDF handling
	hidePDFsInExplorer: boolean;
	// Recent sources tracking
	recentSources: RecentSource[];
	maxRecentSources: number;
	// Recent topics tracking
	recentTopics: RecentTopic[];
	maxRecentTopics: number;
}

export type STANoteType = 'source' | 'topic' | 'argument';

export interface STANote {
	file: import('obsidian').TFile;
	type: STANoteType;
	title: string;
	content: string;
	metadata?: STANoteMetadata;
}

export interface STANoteMetadata {
	author?: string;
	date?: string;
	url?: string;
	position?: string;
	tags?: string[];
	relatedSources?: string[];
	relatedTopics?: string[];
	relatedArguments?: string[];
}

export interface SourceMetadata {
	author?: string;
	doi?: string;
	summary?: string;
	year?: string;
	journal?: string;
	pdfLink?: string;
	pdfFile?: string;
	rating?: number;
}

export interface RecentSource {
	path: string;
	title: string;
	lastAccessed: number;
}

export interface RecentTopic {
	path: string;
	title: string;
	lastAccessed: number;
}

export interface DOIMetadata {
	title?: string[];
	author?: Array<{
		given?: string;
		family?: string;
	}>;
	'published-print'?: {
		'date-parts'?: number[][];
	};
	'published-online'?: {
		'date-parts'?: number[][];
	};
	'container-title'?: string[];
	abstract?: string;
	link?: Array<{
		'content-type'?: string;
		URL?: string;
	}>;
}

export interface TemplateVariables {
	title: string;
	date: string;
	metadata?: SourceMetadata;
	[key: string]: string | SourceMetadata | undefined;
}

export interface STASearchResult {
	file: import('obsidian').TFile;
	type: STANoteType;
	title: string;
	excerpt?: string;
	score?: number;
}

export interface STAModalConfig {
	title: string;
	placeholder?: string;
	defaultFolder?: string;
	template?: string;
}

export interface PDFUploadResult {
	fileName: string;
	filePath: string;
	relativePath: string;
}

// Plugin event types
export interface STAPluginEvents {
	'sta:note-created': (note: STANote) => void;
	'sta:note-linked': (fromNote: string, toNote: string) => void;
	'sta:template-applied': (noteType: STANoteType, template: string) => void;
}

// Tag configuration interface
export interface TagConfiguration {
	tags: string[];
	enabled: boolean;
}

// Settings validation
export interface SettingsValidation {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

// Export utility type for template processing
export type TemplateProcessor = (template: string, variables: TemplateVariables) => string;

// Constants
export const STA_NOTE_TYPES: Record<STANoteType, string> = {
	source: 'Source',
	topic: 'Topic',
	argument: 'Argument'
} as const;

export const DEFAULT_FOLDERS: Record<STANoteType, string> = {
	source: 'Sources',
	topic: 'Topics',
	argument: 'Arguments'
} as const;

// Template variable patterns
export const TEMPLATE_VARIABLES = {
	TITLE: '{{title}}',
	DATE: '{{date}}',
	AUTHOR: '{{author}}',
	URL: '{{url}}',
	POSITION: '{{position}}',
	INLINE_PDF: '{{inlinePdf}}'
} as const;

// Default tag configurations
export const DEFAULT_TAG_CONFIGS: Record<STANoteType, string[]> = {
	source: ['source', 'research', 'reference'],
	topic: ['topic', 'theme', 'subject'],
	argument: ['argument', 'claim', 'position']
};
