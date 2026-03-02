# Revision History Service

## Overview

The Revision History Service tracks document revisions in the Agent Swarm Writing System. It records version numbers, dates, authors, and changes made in each revision, with support for version comparison and statistics.

## Features

- **Version Tracking**: Record each document revision with version numbers
- **Change Logging**: Track all changes made in each revision
- **Author Attribution**: Record who made each revision
- **Version Comparison**: Compare changes between any two versions
- **Statistics**: Get insights about revision patterns and contributors
- **Date Queries**: Find revisions within specific date ranges
- **Export**: Export revision history to JSON format

## Requirements

- 需求 13.5: 记录每次文档修订
- 记录修订原因和作者
- 支持版本对比

## API Reference

### RevisionHistoryService Interface

```typescript
interface RevisionHistoryService {
  // Create a new revision record
  createRevision(version: number, author: string, changes: string[]): RevisionRecord;
  
  // Add a revision to the history
  addRevision(revision: RevisionRecord): void;
  
  // Get all revisions
  getAllRevisions(): RevisionRecord[];
  
  // Get revision by version number
  getRevision(version: number): RevisionRecord | undefined;
  
  // Get latest revision
  getLatestRevision(): RevisionRecord | undefined;
  
  // Get revisions by author
  getRevisionsByAuthor(author: string): RevisionRecord[];
  
  // Get revisions in date range
  getRevisionsByDateRange(startDate: Date, endDate: Date): RevisionRecord[];
  
  // Compare two versions
  compareVersions(version1: number, version2: number): VersionComparison;
  
  // Get revision statistics
  getStatistics(): RevisionStatistics;
  
  // Export revision history to JSON
  exportRevisionHistory(): string;
  
  // Clear all revisions
  clearHistory(): void;
  
  // Get next version number
  getNextVersion(): number;
}
```

### Data Structures

```typescript
interface RevisionRecord {
  version: number;      // Version number
  date: Date;          // Revision date
  changes: string[];   // List of changes
  author: string;      // Author name
}

interface VersionComparison {
  version1: number;
  version2: number;
  changesInVersion2: string[];
  changeCount: number;
  timeDifference: number; // milliseconds
}

interface RevisionStatistics {
  totalRevisions: number;
  totalChanges: number;
  uniqueAuthors: number;
  averageChangesPerRevision: number;
  firstRevisionDate?: Date;
  lastRevisionDate?: Date;
  mostActiveAuthor?: string;
}
```

## Usage Examples

### Basic Revision Tracking

```typescript
import { revisionHistoryService } from './revisionHistoryService';

// Create and add a revision
const revision = revisionHistoryService.createRevision(1, 'Alice', [
  'Created initial document structure',
  'Added introduction section',
]);

revisionHistoryService.addRevision(revision);
```

### Using Next Version Helper

```typescript
// Automatically get next version number
const nextVersion = revisionHistoryService.getNextVersion();

const revision = revisionHistoryService.createRevision(nextVersion, 'Bob', [
  'Added methods section',
  'Updated references',
]);

revisionHistoryService.addRevision(revision);
```

### Version Comparison

```typescript
// Compare two versions
const comparison = revisionHistoryService.compareVersions(1, 3);

console.log(`Changes from v1 to v3: ${comparison.changeCount}`);
console.log(`Time difference: ${comparison.timeDifference}ms`);
console.log('Changes:', comparison.changesInVersion2);
```

### Querying Revisions

```typescript
// Get all revisions
const allRevisions = revisionHistoryService.getAllRevisions();

// Get latest revision
const latest = revisionHistoryService.getLatestRevision();

// Get revisions by author
const aliceRevisions = revisionHistoryService.getRevisionsByAuthor('Alice');

// Get revisions in date range
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const today = new Date();
const recentRevisions = revisionHistoryService.getRevisionsByDateRange(
  yesterday,
  today
);
```

### Revision Statistics

```typescript
const stats = revisionHistoryService.getStatistics();

console.log(`Total revisions: ${stats.totalRevisions}`);
console.log(`Total changes: ${stats.totalChanges}`);
console.log(`Unique authors: ${stats.uniqueAuthors}`);
console.log(`Average changes per revision: ${stats.averageChangesPerRevision}`);
console.log(`Most active author: ${stats.mostActiveAuthor}`);
```

### Exporting Revision History

```typescript
// Export to JSON
const json = revisionHistoryService.exportRevisionHistory();

// Save to file or send to API
await saveToFile('revision-history.json', json);
```

## Revision Workflow

### Typical Document Revision Flow

```
v1: Initial Draft
  ↓
v2: First Review (add content)
  ↓
v3: Peer Review (address feedback)
  ↓
v4: Final Polish (fix typos, improve formatting)
```

### Example Workflow

```typescript
// v1: Initial draft
revisionHistoryService.addRevision(
  revisionHistoryService.createRevision(1, 'Alice', [
    'Created document structure',
    'Added introduction',
  ])
);

// v2: First review
revisionHistoryService.addRevision(
  revisionHistoryService.createRevision(2, 'Bob', [
    'Added methods section',
    'Updated references',
  ])
);

// v3: Peer review
revisionHistoryService.addRevision(
  revisionHistoryService.createRevision(3, 'Charlie', [
    'Addressed reviewer comments',
    'Expanded discussion',
  ])
);

// v4: Final polish
revisionHistoryService.addRevision(
  revisionHistoryService.createRevision(4, 'Alice', [
    'Fixed typos',
    'Improved figures',
  ])
);
```

## Best Practices

### 1. Use Descriptive Change Messages

```typescript
// ✓ Good - specific and clear
revisionHistoryService.createRevision(1, 'Alice', [
  'Added introduction section with background context',
  'Created methods section with data collection details',
  'Updated references to include recent studies',
]);

// ✗ Poor - vague and unhelpful
revisionHistoryService.createRevision(1, 'Alice', [
  'Made changes',
  'Updated stuff',
]);
```

### 2. Use getNextVersion() for Sequential Versions

```typescript
// ✓ Good - automatic version numbering
const version = revisionHistoryService.getNextVersion();
revisionHistoryService.addRevision(
  revisionHistoryService.createRevision(version, 'Author', changes)
);

// ✗ Poor - manual version tracking (error-prone)
revisionHistoryService.addRevision(
  revisionHistoryService.createRevision(5, 'Author', changes) // What if v5 exists?
);
```

### 3. Group Related Changes

```typescript
// ✓ Good - related changes grouped together
revisionHistoryService.createRevision(1, 'Alice', [
  'Added Figure 1: System architecture',
  'Added Figure 2: Performance comparison',
  'Updated figure captions for clarity',
]);

// ✗ Poor - unrelated changes mixed
revisionHistoryService.createRevision(1, 'Alice', [
  'Added Figure 1',
  'Fixed typo in introduction',
  'Updated references',
  'Added Figure 2',
]);
```

### 4. Include Author Context

```typescript
// Use consistent author names
const AUTHOR_ALICE = 'Alice Johnson';
const AUTHOR_BOB = 'Bob Smith';

revisionHistoryService.createRevision(1, AUTHOR_ALICE, changes);
revisionHistoryService.createRevision(2, AUTHOR_BOB, changes);
```

## Integration with Document Export

The Revision History Service integrates with the Document Exporter to include revision history in exported documents:

```typescript
import { documentExporter } from './documentExporter';
import { revisionHistoryService } from './revisionHistoryService';

const documentContent = {
  title: 'My Paper',
  authors: ['Alice', 'Bob'],
  abstract: '...',
  sections: [...],
  reviewComments: [...],
  revisionHistory: revisionHistoryService.getAllRevisions(), // ← Include history
};

// Export with revision history
const docx = await documentExporter.exportToDocx(documentContent);
const pdf = await documentExporter.exportToPdf(documentContent);
```

## Performance Considerations

- Revisions are stored in memory
- Sorted by version number for efficient queries
- For large documents with many revisions, consider:
  - Periodic archival of old revisions
  - Pagination for UI display
  - Lazy loading of revision details

## Testing

The service includes comprehensive unit tests covering:

- Revision creation and addition
- Version comparison
- Author queries
- Date range queries
- Statistics calculation
- Export functionality
- Edge cases

Run tests:
```bash
npm test revisionHistoryService.test.ts
```

## Related Services

- **WorkHistoryService**: Tracks agent work activities
- **DocumentExporter**: Exports documents with revision history
- **AgentManager**: Manages agents who create revisions

## Future Enhancements

- [ ] Add revision diff visualization
- [ ] Support branching and merging revisions
- [ ] Add revision approval workflow
- [ ] Support revision rollback
- [ ] Add revision comments/annotations
- [ ] Support collaborative revision tracking
