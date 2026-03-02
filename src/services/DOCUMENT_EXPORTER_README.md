# Document Exporter Service

## Overview

The Document Exporter service provides functionality to export documents to multiple formats (DOCX, Markdown, PDF) while preserving formatting, styles, and including review comments and revision history.

## Features

- **Multiple Format Support**: Export to DOCX, Markdown, and PDF formats
- **Format Preservation**: Maintains document structure, headings, and formatting
- **Review Comments**: Includes all review comments with reviewer information, severity, and timestamps
- **Revision History**: Tracks document versions and changes over time
- **Nested Sections**: Supports hierarchical document structure with unlimited nesting
- **Comprehensive Metadata**: Includes title, authors, abstract, and other metadata

## Requirements

This service implements the following requirements:

- **需求 13.1**: DOCX格式导出
- **需求 13.2**: Markdown格式导出
- **需求 13.3**: PDF格式导出
- **需求 13.4**: 保留文档格式和样式
- **需求 13.5**: 包含审稿意见和修订历史记录

## Installation

The service uses the following dependencies:

```bash
npm install docx jspdf unified remark-parse remark-stringify
```

## Usage

### Basic Export

```typescript
import { documentExporter } from './services/documentExporter';
import type { DocumentContent } from './types/document.types';

// Prepare document content
const document: DocumentContent = {
  title: 'My Research Paper',
  authors: ['Dr. Jane Smith', 'Prof. John Doe'],
  abstract: 'This paper presents...',
  sections: [
    {
      heading: 'Introduction',
      level: 1,
      content: 'The introduction text...',
    },
    {
      heading: 'Methods',
      level: 1,
      content: 'The methods text...',
      subsections: [
        {
          heading: 'Data Collection',
          level: 2,
          content: 'Details about data collection...',
        },
      ],
    },
  ],
  reviewComments: [
    {
      reviewer: 'Peer Reviewer 1',
      section: 'Introduction',
      comment: 'Needs more detail',
      severity: 'minor',
      timestamp: new Date(),
    },
  ],
  revisionHistory: [
    {
      version: 1,
      date: new Date(),
      changes: ['Initial draft'],
      author: 'Writing Team',
    },
  ],
};

// Export to DOCX
const docxBlob = await documentExporter.exportToDocx(document);
// Save or download the blob

// Export to Markdown
const markdown = await documentExporter.exportToMarkdown(document);
// Use the markdown string

// Export to PDF
const pdfBlob = await documentExporter.exportToPdf(document);
// Save or download the blob
```

### Saving Exported Files

```typescript
// Using Tauri's file system API
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

async function saveDocument(blob: Blob, defaultName: string) {
  const filePath = await save({
    defaultPath: defaultName,
  });

  if (filePath) {
    const arrayBuffer = await blob.arrayBuffer();
    await writeFile(filePath, new Uint8Array(arrayBuffer));
  }
}

// Save DOCX
const docxBlob = await documentExporter.exportToDocx(document);
await saveDocument(docxBlob, 'document.docx');

// Save PDF
const pdfBlob = await documentExporter.exportToPdf(document);
await saveDocument(pdfBlob, 'document.pdf');

// Save Markdown
const markdown = await documentExporter.exportToMarkdown(document);
const markdownBlob = new Blob([markdown], { type: 'text/markdown' });
await saveDocument(markdownBlob, 'document.md');
```

### Downloading in Browser

```typescript
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Download DOCX
const docxBlob = await documentExporter.exportToDocx(document);
downloadBlob(docxBlob, 'document.docx');

// Download PDF
const pdfBlob = await documentExporter.exportToPdf(document);
downloadBlob(pdfBlob, 'document.pdf');

// Download Markdown
const markdown = await documentExporter.exportToMarkdown(document);
const markdownBlob = new Blob([markdown], { type: 'text/markdown' });
downloadBlob(markdownBlob, 'document.md');
```

## Document Structure

### DocumentContent

The main document structure:

```typescript
interface DocumentContent {
  title: string;                      // Document title
  authors: string[];                  // List of authors
  abstract: string;                   // Abstract text
  sections: DocumentSection[];        // Main sections
  reviewComments: ReviewComment[];    // Review feedback
  revisionHistory: RevisionRecord[];  // Version history
}
```

### DocumentSection

Hierarchical section structure:

```typescript
interface DocumentSection {
  heading: string;                    // Section heading
  level: number;                      // Heading level (1-6)
  content: string;                    // Section content
  subsections?: DocumentSection[];    // Nested subsections
}
```

### ReviewComment

Review feedback structure:

```typescript
interface ReviewComment {
  reviewer: string;                   // Reviewer name
  section: string;                    // Section being reviewed
  comment: string;                    // Review comment text
  severity: 'minor' | 'major' | 'critical';  // Comment severity
  timestamp: Date;                    // When comment was made
}
```

### RevisionRecord

Version history structure:

```typescript
interface RevisionRecord {
  version: number;                    // Version number
  date: Date;                         // Revision date
  changes: string[];                  // List of changes
  author: string;                     // Who made the changes
}
```

## Export Formats

### DOCX Export

The DOCX export uses the `docx.js` library and includes:

- **Title**: Centered, large heading
- **Authors**: Centered below title
- **Abstract**: Separate section with heading
- **Sections**: Hierarchical headings (H1-H6)
- **Review Comments**: Formatted table with columns for reviewer, section, severity, and comment
- **Revision History**: Formatted list with version numbers, dates, authors, and changes

Features:
- Proper heading levels (up to 6 levels)
- Paragraph spacing and formatting
- Table formatting for review comments
- Page breaks before major sections
- Bold text for emphasis

### Markdown Export

The Markdown export generates standard Markdown format:

- **Title**: H1 heading (`#`)
- **Authors**: Bold text with label
- **Abstract**: H2 heading (`##`)
- **Sections**: Hierarchical headings (H2-H6)
- **Review Comments**: Markdown table with proper escaping
- **Revision History**: Nested headings and bullet lists

Features:
- Proper heading hierarchy
- Table formatting for review comments
- Special character escaping in tables
- Horizontal rule separator before review section
- Bullet lists for changes

### PDF Export

The PDF export uses the `jsPDF` library and includes:

- **Title**: Centered, large font
- **Authors**: Centered below title
- **Abstract**: Separate section
- **Sections**: Hierarchical with varying font sizes
- **Review Comments**: Formatted text blocks
- **Revision History**: Formatted list

Features:
- Automatic page breaks
- Text wrapping for long content
- Font size variation for heading levels
- Proper spacing and margins
- Multi-page support

## Format Preservation

All export formats preserve:

1. **Document Structure**: Hierarchical sections and subsections
2. **Metadata**: Title, authors, abstract
3. **Review Comments**: All feedback with complete information
4. **Revision History**: Complete version tracking
5. **Content Formatting**: Paragraphs and text structure

## Error Handling

The service handles various edge cases:

- Empty or missing fields (title, abstract, authors)
- Empty sections or content
- Missing review comments or revision history
- Special characters in content
- Very long content requiring pagination
- Deep nesting of subsections
- Unicode characters

## Testing

Comprehensive tests are provided in `documentExporter.test.ts`:

- Format-specific tests for DOCX, Markdown, and PDF
- Edge case handling
- Format preservation verification
- Special character handling
- Nested structure support
- Empty field handling

Run tests:

```bash
npm test documentExporter.test.ts
```

## Examples

See `documentExporter.example.ts` for complete usage examples:

- `exportCompleteDocument()`: Full document with all features
- `exportSimpleDocument()`: Minimal document
- `exportNestedDocument()`: Document with nested sections

Run examples:

```bash
npm run dev
# Then import and call the example functions
```

## Integration with Agent System

The Document Exporter integrates with the Agent Swarm Writing System:

1. **Document Assembly**: Collect content from writing agents
2. **Review Integration**: Include feedback from review team
3. **Version Tracking**: Track revisions through the writing process
4. **Export Options**: Provide multiple format options to users

Example integration:

```typescript
import { documentExporter } from './services/documentExporter';
import { agentStore } from './stores/agentStore';
import { messageStore } from './stores/messageStore';

async function exportFinalDocument() {
  // Collect document content from agents
  const content = assembleDocumentFromAgents();
  
  // Add review comments from review team
  const reviewComments = collectReviewComments();
  
  // Add revision history
  const revisionHistory = getRevisionHistory();
  
  const document: DocumentContent = {
    ...content,
    reviewComments,
    revisionHistory,
  };
  
  // Export to all formats
  const docx = await documentExporter.exportToDocx(document);
  const markdown = await documentExporter.exportToMarkdown(document);
  const pdf = await documentExporter.exportToPdf(document);
  
  return { docx, markdown, pdf };
}
```

## Performance Considerations

- **DOCX Export**: Fast for documents up to 100 pages
- **Markdown Export**: Very fast, suitable for any document size
- **PDF Export**: May be slower for very long documents due to text measurement and pagination

For large documents (>100 pages), consider:
- Showing progress indicator during export
- Exporting in background thread
- Caching intermediate results

## Future Enhancements

Potential improvements:

1. **Custom Styling**: Allow users to customize fonts, colors, and spacing
2. **Template Support**: Pre-defined templates for different journal formats
3. **Image Support**: Include images and figures in exports
4. **Citation Formatting**: Automatic citation and reference formatting
5. **Table Support**: Rich table formatting in document sections
6. **Export Options**: Configurable export settings (page size, margins, etc.)
7. **Batch Export**: Export multiple documents at once
8. **Cloud Storage**: Direct export to cloud storage services

## License

Part of the Agent Swarm Writing System project.
