/**
 * Revision History Service
 * 
 * Tracks document revisions including:
 * - Version numbers
 * - Revision dates and authors
 * - Changes made in each revision
 * - Version comparison support
 * 
 * Requirements:
 * - 需求 13.5: 记录每次文档修订
 * - 记录修订原因和作者
 * - 支持版本对比
 */

import type { RevisionRecord, DocumentContent } from '../types/document.types';

/**
 * RevisionHistoryService interface
 * Manages document revision tracking
 */
export interface RevisionHistoryService {
  /**
   * Create a new revision record
   * @param version Version number
   * @param author Author name
   * @param changes List of changes made
   * @returns Created revision record
   */
  createRevision(version: number, author: string, changes: string[]): RevisionRecord;

  /**
   * Add a revision to the history
   * @param revision Revision record to add
   */
  addRevision(revision: RevisionRecord): void;

  /**
   * Get all revisions
   * @returns Array of revision records
   */
  getAllRevisions(): RevisionRecord[];

  /**
   * Get revision by version number
   * @param version Version number
   * @returns Revision record or undefined
   */
  getRevision(version: number): RevisionRecord | undefined;

  /**
   * Get latest revision
   * @returns Latest revision record or undefined
   */
  getLatestRevision(): RevisionRecord | undefined;

  /**
   * Get revisions by author
   * @param author Author name
   * @returns Array of revision records
   */
  getRevisionsByAuthor(author: string): RevisionRecord[];

  /**
   * Get revisions in date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of revision records
   */
  getRevisionsByDateRange(startDate: Date, endDate: Date): RevisionRecord[];

  /**
   * Compare two versions
   * @param version1 First version number
   * @param version2 Second version number
   * @returns Comparison result with changes
   */
  compareVersions(version1: number, version2: number): VersionComparison;

  /**
   * Get revision statistics
   * @returns Statistics about revisions
   */
  getStatistics(): RevisionStatistics;

  /**
   * Export revision history to JSON
   * @returns JSON string of revision history
   */
  exportRevisionHistory(): string;

  /**
   * Clear all revisions
   */
  clearHistory(): void;

  /**
   * Get next version number
   * @returns Next available version number
   */
  getNextVersion(): number;
}

/**
 * Version comparison result
 */
export interface VersionComparison {
  version1: number;
  version2: number;
  changesInVersion2: string[];
  changeCount: number;
  timeDifference: number; // milliseconds
}

/**
 * Revision statistics
 */
export interface RevisionStatistics {
  totalRevisions: number;
  totalChanges: number;
  uniqueAuthors: number;
  averageChangesPerRevision: number;
  firstRevisionDate?: Date;
  lastRevisionDate?: Date;
  mostActiveAuthor?: string;
}

/**
 * RevisionHistoryService implementation
 */
export class RevisionHistoryServiceImpl implements RevisionHistoryService {
  private revisions: RevisionRecord[] = [];

  /**
   * Create a new revision record
   */
  createRevision(version: number, author: string, changes: string[]): RevisionRecord {
    const revision: RevisionRecord = {
      version,
      date: new Date(),
      changes: [...changes], // Create a copy
      author,
    };

    return revision;
  }

  /**
   * Add a revision to the history
   */
  addRevision(revision: RevisionRecord): void {
    // Check if version already exists
    const existing = this.getRevision(revision.version);
    if (existing) {
      throw new Error(`Revision version ${revision.version} already exists`);
    }

    this.revisions.push(revision);
    
    // Sort by version number
    this.revisions.sort((a, b) => a.version - b.version);

    console.log(`Revision added: v${revision.version} by ${revision.author}`);
  }

  /**
   * Get all revisions
   */
  getAllRevisions(): RevisionRecord[] {
    return [...this.revisions]; // Return a copy
  }

  /**
   * Get revision by version number
   */
  getRevision(version: number): RevisionRecord | undefined {
    return this.revisions.find((r) => r.version === version);
  }

  /**
   * Get latest revision
   */
  getLatestRevision(): RevisionRecord | undefined {
    if (this.revisions.length === 0) {
      return undefined;
    }

    return this.revisions[this.revisions.length - 1];
  }

  /**
   * Get revisions by author
   */
  getRevisionsByAuthor(author: string): RevisionRecord[] {
    return this.revisions.filter((r) => r.author === author);
  }

  /**
   * Get revisions in date range
   */
  getRevisionsByDateRange(startDate: Date, endDate: Date): RevisionRecord[] {
    return this.revisions.filter((r) => {
      const revisionDate = r.date.getTime();
      return revisionDate >= startDate.getTime() && revisionDate <= endDate.getTime();
    });
  }

  /**
   * Compare two versions
   */
  compareVersions(version1: number, version2: number): VersionComparison {
    const rev1 = this.getRevision(version1);
    const rev2 = this.getRevision(version2);

    if (!rev1) {
      throw new Error(`Version ${version1} not found`);
    }

    if (!rev2) {
      throw new Error(`Version ${version2} not found`);
    }

    // Get all changes between version1 and version2
    const changesInVersion2: string[] = [];
    
    for (const revision of this.revisions) {
      if (revision.version > version1 && revision.version <= version2) {
        changesInVersion2.push(...revision.changes);
      }
    }

    const timeDifference = rev2.date.getTime() - rev1.date.getTime();

    return {
      version1,
      version2,
      changesInVersion2,
      changeCount: changesInVersion2.length,
      timeDifference,
    };
  }

  /**
   * Get revision statistics
   */
  getStatistics(): RevisionStatistics {
    if (this.revisions.length === 0) {
      return {
        totalRevisions: 0,
        totalChanges: 0,
        uniqueAuthors: 0,
        averageChangesPerRevision: 0,
      };
    }

    const totalChanges = this.revisions.reduce(
      (sum, r) => sum + r.changes.length,
      0
    );

    const authors = new Set(this.revisions.map((r) => r.author));
    
    // Find most active author
    const authorCounts = new Map<string, number>();
    for (const revision of this.revisions) {
      const count = authorCounts.get(revision.author) || 0;
      authorCounts.set(revision.author, count + 1);
    }

    let mostActiveAuthor: string | undefined;
    let maxCount = 0;
    for (const [author, count] of authorCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostActiveAuthor = author;
      }
    }

    return {
      totalRevisions: this.revisions.length,
      totalChanges,
      uniqueAuthors: authors.size,
      averageChangesPerRevision: totalChanges / this.revisions.length,
      firstRevisionDate: this.revisions[0].date,
      lastRevisionDate: this.revisions[this.revisions.length - 1].date,
      mostActiveAuthor,
    };
  }

  /**
   * Export revision history to JSON
   */
  exportRevisionHistory(): string {
    return JSON.stringify(this.revisions, null, 2);
  }

  /**
   * Clear all revisions
   */
  clearHistory(): void {
    this.revisions = [];
    console.log('Revision history cleared');
  }

  /**
   * Get next version number
   */
  getNextVersion(): number {
    const latest = this.getLatestRevision();
    return latest ? latest.version + 1 : 1;
  }
}

/**
 * Create revision history service instance
 */
export function createRevisionHistoryService(): RevisionHistoryService {
  return new RevisionHistoryServiceImpl();
}

/**
 * Singleton instance
 */
export const revisionHistoryService = createRevisionHistoryService();
