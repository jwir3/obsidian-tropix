// Default templates for TropiX note types
// These are generated at build time from template files

export const DEFAULT_SOURCE_TEMPLATE = `---
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
`;

export const DEFAULT_TOPIC_TEMPLATE = `---
tags:
  - "#research"
  - "#topic"
---

> [!example] Sources

> ![tip] Related Arguments

## Overview

## Questions

-
`;

export const DEFAULT_ARGUMENT_TEMPLATE = `---
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
`;

export const DEFAULT_TEMPLATES = {
	source: DEFAULT_SOURCE_TEMPLATE,
	topic: DEFAULT_TOPIC_TEMPLATE,
	argument: DEFAULT_ARGUMENT_TEMPLATE
} as const;
