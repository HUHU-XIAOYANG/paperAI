/**
 * Revision History Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RevisionHistoryServiceImpl } from './revisionHistoryService';
import type { RevisionRecord } from '../types/document.types';

describe('RevisionHistoryService', () => {
  let service: RevisionHistoryServiceImpl;

  beforeEach(() => {
    service = new RevisionHistoryServiceImpl();
  });

  describe('createRevision', () => {
    it('should create a revision record with all fields', () => {
      const revision = service.createRevision(1, 'John Doe', ['Added introduction']);

      expect(revision.version).toBe(1);
      expect(revision.author).toBe('John Doe');
      expect(revision.changes).toEqual(['Added introduction']);
      expect(revision.date).toBeInstanceOf(Date);
    });

    it('should create a copy of changes array', () => {
      const changes = ['Change 1', 'Change 2'];
      const revision = service.createRevision(1, 'Author', changes);

      // Modify original array
      changes.push('Change 3');

      // Revision should not be affected
      expect(revision.changes).toHaveLength(2);
    });
  });

  describe('addRevision', () => {
    it('should add a revision to history', () => {
      const revision = service.createRevision(1, 'Author', ['Change 1']);
      service.addRevision(revision);

      const allRevisions = service.getAllRevisions();
      expect(allRevisions).toHaveLength(1);
      expect(allRevisions[0]).toEqual(revision);
    });

    it('should sort revisions by version number', () => {
      service.addRevision(service.createRevision(3, 'Author', ['Change 3']));
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));
      service.addRevision(service.createRevision(2, 'Author', ['Change 2']));

      const allRevisions = service.getAllRevisions();
      expect(allRevisions[0].version).toBe(1);
      expect(allRevisions[1].version).toBe(2);
      expect(allRevisions[2].version).toBe(3);
    });

    it('should throw error if version already exists', () => {
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));

      expect(() => {
        service.addRevision(service.createRevision(1, 'Author', ['Change 2']));
      }).toThrow('Revision version 1 already exists');
    });
  });

  describe('getAllRevisions', () => {
    it('should return empty array when no revisions', () => {
      const revisions = service.getAllRevisions();
      expect(revisions).toEqual([]);
    });

    it('should return all revisions', () => {
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));
      service.addRevision(service.createRevision(2, 'Author', ['Change 2']));

      const revisions = service.getAllRevisions();
      expect(revisions).toHaveLength(2);
    });

    it('should return a copy of revisions array', () => {
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));
      
      const revisions = service.getAllRevisions();
      revisions.push(service.createRevision(2, 'Author', ['Change 2']));

      // Original should not be affected
      expect(service.getAllRevisions()).toHaveLength(1);
    });
  });

  describe('getRevision', () => {
    beforeEach(() => {
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));
      service.addRevision(service.createRevision(2, 'Author', ['Change 2']));
    });

    it('should return revision by version number', () => {
      const revision = service.getRevision(1);
      expect(revision?.version).toBe(1);
    });

    it('should return undefined for non-existent version', () => {
      const revision = service.getRevision(99);
      expect(revision).toBeUndefined();
    });
  });

  describe('getLatestRevision', () => {
    it('should return undefined when no revisions', () => {
      const latest = service.getLatestRevision();
      expect(latest).toBeUndefined();
    });

    it('should return the latest revision', () => {
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));
      service.addRevision(service.createRevision(2, 'Author', ['Change 2']));
      service.addRevision(service.createRevision(3, 'Author', ['Change 3']));

      const latest = service.getLatestRevision();
      expect(latest?.version).toBe(3);
    });
  });

  describe('getRevisionsByAuthor', () => {
    beforeEach(() => {
      service.addRevision(service.createRevision(1, 'Alice', ['Change 1']));
      service.addRevision(service.createRevision(2, 'Bob', ['Change 2']));
      service.addRevision(service.createRevision(3, 'Alice', ['Change 3']));
    });

    it('should return revisions by specific author', () => {
      const aliceRevisions = service.getRevisionsByAuthor('Alice');
      expect(aliceRevisions).toHaveLength(2);
      expect(aliceRevisions.every((r) => r.author === 'Alice')).toBe(true);
    });

    it('should return empty array for non-existent author', () => {
      const revisions = service.getRevisionsByAuthor('Charlie');
      expect(revisions).toEqual([]);
    });
  });

  describe('getRevisionsByDateRange', () => {
    it('should return revisions within date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));

      const revisions = service.getRevisionsByDateRange(yesterday, tomorrow);
      expect(revisions).toHaveLength(1);
    });

    it('should return empty array when no revisions in range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));

      const revisions = service.getRevisionsByDateRange(twoDaysAgo, yesterday);
      expect(revisions).toEqual([]);
    });
  });

  describe('compareVersions', () => {
    beforeEach(() => {
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));
      service.addRevision(service.createRevision(2, 'Author', ['Change 2', 'Change 3']));
      service.addRevision(service.createRevision(3, 'Author', ['Change 4']));
    });

    it('should compare two versions', () => {
      const comparison = service.compareVersions(1, 3);

      expect(comparison.version1).toBe(1);
      expect(comparison.version2).toBe(3);
      expect(comparison.changesInVersion2).toEqual(['Change 2', 'Change 3', 'Change 4']);
      expect(comparison.changeCount).toBe(3);
      expect(comparison.timeDifference).toBeGreaterThanOrEqual(0);
    });

    it('should throw error if version1 not found', () => {
      expect(() => {
        service.compareVersions(99, 2);
      }).toThrow('Version 99 not found');
    });

    it('should throw error if version2 not found', () => {
      expect(() => {
        service.compareVersions(1, 99);
      }).toThrow('Version 99 not found');
    });

    it('should return empty changes when comparing same version', () => {
      const comparison = service.compareVersions(2, 2);
      expect(comparison.changesInVersion2).toEqual([]);
      expect(comparison.changeCount).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should return zero statistics when no revisions', () => {
      const stats = service.getStatistics();

      expect(stats.totalRevisions).toBe(0);
      expect(stats.totalChanges).toBe(0);
      expect(stats.uniqueAuthors).toBe(0);
      expect(stats.averageChangesPerRevision).toBe(0);
    });

    it('should calculate statistics correctly', () => {
      service.addRevision(service.createRevision(1, 'Alice', ['Change 1', 'Change 2']));
      service.addRevision(service.createRevision(2, 'Bob', ['Change 3']));
      service.addRevision(service.createRevision(3, 'Alice', ['Change 4', 'Change 5', 'Change 6']));

      const stats = service.getStatistics();

      expect(stats.totalRevisions).toBe(3);
      expect(stats.totalChanges).toBe(6);
      expect(stats.uniqueAuthors).toBe(2);
      expect(stats.averageChangesPerRevision).toBe(2);
      expect(stats.mostActiveAuthor).toBe('Alice');
      expect(stats.firstRevisionDate).toBeInstanceOf(Date);
      expect(stats.lastRevisionDate).toBeInstanceOf(Date);
    });
  });

  describe('exportRevisionHistory', () => {
    it('should export revision history as JSON', () => {
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));
      service.addRevision(service.createRevision(2, 'Author', ['Change 2']));

      const json = service.exportRevisionHistory();
      expect(json).toBeTruthy();

      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });
  });

  describe('clearHistory', () => {
    it('should clear all revisions', () => {
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));
      service.addRevision(service.createRevision(2, 'Author', ['Change 2']));

      service.clearHistory();

      expect(service.getAllRevisions()).toEqual([]);
    });
  });

  describe('getNextVersion', () => {
    it('should return 1 when no revisions', () => {
      expect(service.getNextVersion()).toBe(1);
    });

    it('should return next version number', () => {
      service.addRevision(service.createRevision(1, 'Author', ['Change 1']));
      expect(service.getNextVersion()).toBe(2);

      service.addRevision(service.createRevision(2, 'Author', ['Change 2']));
      expect(service.getNextVersion()).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple revisions by same author', () => {
      service.addRevision(service.createRevision(1, 'Alice', ['Change 1']));
      service.addRevision(service.createRevision(2, 'Alice', ['Change 2']));
      service.addRevision(service.createRevision(3, 'Alice', ['Change 3']));

      const stats = service.getStatistics();
      expect(stats.uniqueAuthors).toBe(1);
      expect(stats.mostActiveAuthor).toBe('Alice');
    });

    it('should handle revisions with no changes', () => {
      service.addRevision(service.createRevision(1, 'Author', []));

      const stats = service.getStatistics();
      expect(stats.totalChanges).toBe(0);
      expect(stats.averageChangesPerRevision).toBe(0);
    });

    it('should handle revisions with many changes', () => {
      const manyChanges = Array.from({ length: 100 }, (_, i) => `Change ${i + 1}`);
      service.addRevision(service.createRevision(1, 'Author', manyChanges));

      const revision = service.getRevision(1);
      expect(revision?.changes).toHaveLength(100);
    });
  });
});
