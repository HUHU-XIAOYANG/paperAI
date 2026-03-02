/**
 * Revision History Service Examples
 * 
 * Demonstrates how to use the RevisionHistoryService to track document revisions
 */

import { createRevisionHistoryService } from './revisionHistoryService';
import type { RevisionHistoryService } from './revisionHistoryService';

// ============================================================================
// Example 1: Basic Revision Tracking
// ============================================================================

export function example1_BasicRevisionTracking() {
  console.log('=== Example 1: Basic Revision Tracking ===\n');

  const revisionHistory: RevisionHistoryService = createRevisionHistoryService();

  // Create and add first revision
  const rev1 = revisionHistory.createRevision(1, 'Alice', [
    'Created initial document structure',
    'Added introduction section',
  ]);
  revisionHistory.addRevision(rev1);

  console.log('Revision 1 added:', {
    version: rev1.version,
    author: rev1.author,
    changes: rev1.changes.length,
  });

  // Create and add second revision
  const rev2 = revisionHistory.createRevision(2, 'Bob', [
    'Added methods section',
    'Updated references',
  ]);
  revisionHistory.addRevision(rev2);

  console.log('Revision 2 added:', {
    version: rev2.version,
    author: rev2.author,
    changes: rev2.changes.length,
  });

  console.log();
}

// ============================================================================
// Example 2: Version Comparison
// ============================================================================

export function example2_VersionComparison() {
  console.log('=== Example 2: Version Comparison ===\n');

  const revisionHistory: RevisionHistoryService = createRevisionHistoryService();

  // Add multiple revisions
  revisionHistory.addRevision(
    revisionHistory.createRevision(1, 'Alice', ['Initial draft'])
  );
  revisionHistory.addRevision(
    revisionHistory.createRevision(2, 'Bob', ['Added section A', 'Fixed typos'])
  );
  revisionHistory.addRevision(
    revisionHistory.createRevision(3, 'Charlie', ['Added section B', 'Updated figures'])
  );

  // Compare versions
  const comparison = revisionHistory.compareVersions(1, 3);

  console.log('Comparison between v1 and v3:');
  console.log(`- Total changes: ${comparison.changeCount}`);
  console.log(`- Time difference: ${comparison.timeDifference}ms`);
  console.log('- Changes:');
  comparison.changesInVersion2.forEach((change, i) => {
    console.log(`  ${i + 1}. ${change}`);
  });

  console.log();
}

// ============================================================================
// Example 3: Querying Revisions
// ============================================================================

export function example3_QueryingRevisions() {
  console.log('=== Example 3: Querying Revisions ===\n');

  const revisionHistory: RevisionHistoryService = createRevisionHistoryService();

  // Add revisions by different authors
  revisionHistory.addRevision(
    revisionHistory.createRevision(1, 'Alice', ['Change 1'])
  );
  revisionHistory.addRevision(
    revisionHistory.createRevision(2, 'Bob', ['Change 2'])
  );
  revisionHistory.addRevision(
    revisionHistory.createRevision(3, 'Alice', ['Change 3'])
  );
  revisionHistory.addRevision(
    revisionHistory.createRevision(4, 'Charlie', ['Change 4'])
  );

  // Get all revisions
  console.log(`Total revisions: ${revisionHistory.getAllRevisions().length}`);

  // Get latest revision
  const latest = revisionHistory.getLatestRevision();
  console.log(`Latest revision: v${latest?.version} by ${latest?.author}`);

  // Get revisions by author
  const aliceRevisions = revisionHistory.getRevisionsByAuthor('Alice');
  console.log(`Alice's revisions: ${aliceRevisions.length}`);

  // Get specific revision
  const rev2 = revisionHistory.getRevision(2);
  console.log(`Revision 2: ${rev2?.changes.join(', ')}`);

  console.log();
}

// ============================================================================
// Example 4: Revision Statistics
// ============================================================================

export function example4_RevisionStatistics() {
  console.log('=== Example 4: Revision Statistics ===\n');

  const revisionHistory: RevisionHistoryService = createRevisionHistoryService();

  // Add multiple revisions
  revisionHistory.addRevision(
    revisionHistory.createRevision(1, 'Alice', ['Change 1', 'Change 2'])
  );
  revisionHistory.addRevision(
    revisionHistory.createRevision(2, 'Bob', ['Change 3'])
  );
  revisionHistory.addRevision(
    revisionHistory.createRevision(3, 'Alice', ['Change 4', 'Change 5', 'Change 6'])
  );
  revisionHistory.addRevision(
    revisionHistory.createRevision(4, 'Charlie', ['Change 7', 'Change 8'])
  );

  // Get statistics
  const stats = revisionHistory.getStatistics();

  console.log('Revision Statistics:');
  console.log(`- Total revisions: ${stats.totalRevisions}`);
  console.log(`- Total changes: ${stats.totalChanges}`);
  console.log(`- Unique authors: ${stats.uniqueAuthors}`);
  console.log(`- Average changes per revision: ${stats.averageChangesPerRevision.toFixed(2)}`);
  console.log(`- Most active author: ${stats.mostActiveAuthor}`);
  console.log(`- First revision: ${stats.firstRevisionDate?.toLocaleDateString()}`);
  console.log(`- Last revision: ${stats.lastRevisionDate?.toLocaleDateString()}`);

  console.log();
}

// ============================================================================
// Example 5: Date Range Queries
// ============================================================================

export function example5_DateRangeQueries() {
  console.log('=== Example 5: Date Range Queries ===\n');

  const revisionHistory: RevisionHistoryService = createRevisionHistoryService();

  // Add revisions
  revisionHistory.addRevision(
    revisionHistory.createRevision(1, 'Alice', ['Change 1'])
  );

  // Simulate time passing
  setTimeout(() => {
    revisionHistory.addRevision(
      revisionHistory.createRevision(2, 'Bob', ['Change 2'])
    );
  }, 100);

  // Query by date range
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const recentRevisions = revisionHistory.getRevisionsByDateRange(yesterday, tomorrow);
  console.log(`Revisions in last 24 hours: ${recentRevisions.length}`);

  console.log();
}

// ============================================================================
// Example 6: Exporting Revision History
// ============================================================================

export function example6_ExportingHistory() {
  console.log('=== Example 6: Exporting Revision History ===\n');

  const revisionHistory: RevisionHistoryService = createRevisionHistoryService();

  // Add revisions
  revisionHistory.addRevision(
    revisionHistory.createRevision(1, 'Alice', ['Initial draft'])
  );
  revisionHistory.addRevision(
    revisionHistory.createRevision(2, 'Bob', ['Added content', 'Fixed errors'])
  );

  // Export to JSON
  const json = revisionHistory.exportRevisionHistory();
  console.log('Exported revision history:');
  console.log(json);

  console.log();
}

// ============================================================================
// Example 7: Real-world Document Workflow
// ============================================================================

export function example7_RealWorldWorkflow() {
  console.log('=== Example 7: Real-world Document Workflow ===\n');

  const revisionHistory: RevisionHistoryService = createRevisionHistoryService();

  // Initial draft
  console.log('1. Alice creates initial draft');
  revisionHistory.addRevision(
    revisionHistory.createRevision(1, 'Alice', [
      'Created document structure',
      'Added introduction',
      'Added abstract',
    ])
  );

  // First review
  console.log('2. Bob reviews and adds content');
  revisionHistory.addRevision(
    revisionHistory.createRevision(2, 'Bob', [
      'Added methods section',
      'Added results section',
      'Updated references',
    ])
  );

  // Peer review feedback
  console.log('3. Charlie provides peer review feedback');
  revisionHistory.addRevision(
    revisionHistory.createRevision(3, 'Charlie', [
      'Addressed reviewer comments',
      'Expanded discussion section',
      'Added limitations section',
    ])
  );

  // Final polish
  console.log('4. Alice does final polish');
  revisionHistory.addRevision(
    revisionHistory.createRevision(4, 'Alice', [
      'Fixed typos and grammar',
      'Improved figure captions',
      'Updated acknowledgments',
    ])
  );

  // Show final statistics
  const stats = revisionHistory.getStatistics();
  console.log('\nFinal Document Statistics:');
  console.log(`- Total revisions: ${stats.totalRevisions}`);
  console.log(`- Total changes: ${stats.totalChanges}`);
  console.log(`- Contributors: ${stats.uniqueAuthors}`);
  console.log(`- Most active: ${stats.mostActiveAuthor}`);

  // Compare first and last version
  const comparison = revisionHistory.compareVersions(1, 4);
  console.log(`\nChanges from v1 to v4: ${comparison.changeCount} changes`);

  console.log();
}

// ============================================================================
// Example 8: Using Next Version Helper
// ============================================================================

export function example8_NextVersionHelper() {
  console.log('=== Example 8: Using Next Version Helper ===\n');

  const revisionHistory: RevisionHistoryService = createRevisionHistoryService();

  // Add revisions using getNextVersion()
  let nextVersion = revisionHistory.getNextVersion();
  console.log(`Creating revision v${nextVersion}`);
  revisionHistory.addRevision(
    revisionHistory.createRevision(nextVersion, 'Alice', ['Change 1'])
  );

  nextVersion = revisionHistory.getNextVersion();
  console.log(`Creating revision v${nextVersion}`);
  revisionHistory.addRevision(
    revisionHistory.createRevision(nextVersion, 'Bob', ['Change 2'])
  );

  nextVersion = revisionHistory.getNextVersion();
  console.log(`Creating revision v${nextVersion}`);
  revisionHistory.addRevision(
    revisionHistory.createRevision(nextVersion, 'Charlie', ['Change 3'])
  );

  console.log(`\nTotal revisions: ${revisionHistory.getAllRevisions().length}`);
  console.log();
}

// ============================================================================
// Run all examples
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  example1_BasicRevisionTracking();
  example2_VersionComparison();
  example3_QueryingRevisions();
  example4_RevisionStatistics();
  example5_DateRangeQueries();
  example6_ExportingHistory();
  example7_RealWorldWorkflow();
  example8_NextVersionHelper();
}
