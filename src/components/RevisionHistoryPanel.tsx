/**
 * Revision History Panel Component
 * 
 * Displays document revision history with version comparison
 * 
 * Requirements:
 * - 需求 13.5: 实现历史记录UI展示
 * - 支持版本对比
 * - 支持按时间线浏览
 */

import React, { useState, useMemo } from 'react';
import type { RevisionRecord } from '../types/document.types';
import type { VersionComparison } from '../services/revisionHistoryService';
import styles from './RevisionHistoryPanel.module.css';

export interface RevisionHistoryPanelProps {
  /** Revision history records */
  revisions: RevisionRecord[];
  /** Callback when comparing versions */
  onCompareVersions?: (version1: number, version2: number) => VersionComparison;
  /** Callback when a revision is selected */
  onRevisionSelect?: (revision: RevisionRecord) => void;
  /** Show comparison UI */
  showComparison?: boolean;
}

/**
 * RevisionHistoryPanel component
 * Displays document revision history in a timeline format
 */
export const RevisionHistoryPanel: React.FC<RevisionHistoryPanelProps> = ({
  revisions,
  onCompareVersions,
  onRevisionSelect,
  showComparison = true,
}) => {
  const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
  const [compareVersion1, setCompareVersion1] = useState<number | null>(null);
  const [compareVersion2, setCompareVersion2] = useState<number | null>(null);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<string>('all');

  // Get unique authors
  const authors = useMemo(() => {
    const uniqueAuthors = new Set(revisions.map((r) => r.author));
    return Array.from(uniqueAuthors).sort();
  }, [revisions]);

  // Filter revisions by author
  const filteredRevisions = useMemo(() => {
    if (filterAuthor === 'all') return revisions;
    return revisions.filter((r) => r.author === filterAuthor);
  }, [revisions, filterAuthor]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevisions = filteredRevisions.length;
    const totalChanges = filteredRevisions.reduce((sum, r) => sum + r.changes.length, 0);
    const uniqueAuthors = new Set(filteredRevisions.map((r) => r.author)).size;

    return { totalRevisions, totalChanges, uniqueAuthors };
  }, [filteredRevisions]);

  const handleRevisionClick = (revision: RevisionRecord) => {
    setSelectedRevision(revision.version);
    onRevisionSelect?.(revision);
  };

  const handleCompare = () => {
    if (compareVersion1 !== null && compareVersion2 !== null && onCompareVersions) {
      const result = onCompareVersions(compareVersion1, compareVersion2);
      setComparison(result);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeDifference = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Revision History</h2>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            Revisions: <strong>{stats.totalRevisions}</strong>
          </span>
          <span className={styles.statItem}>
            Changes: <strong>{stats.totalChanges}</strong>
          </span>
          <span className={styles.statItem}>
            Authors: <strong>{stats.uniqueAuthors}</strong>
          </span>
        </div>
      </div>

      {/* Filters and Comparison */}
      <div className={styles.controls}>
        <select
          className={styles.authorFilter}
          value={filterAuthor}
          onChange={(e) => setFilterAuthor(e.target.value)}
        >
          <option value="all">All Authors</option>
          {authors.map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>

        {showComparison && (
          <div className={styles.comparison}>
            <select
              className={styles.versionSelect}
              value={compareVersion1 ?? ''}
              onChange={(e) => setCompareVersion1(Number(e.target.value) || null)}
            >
              <option value="">Version 1</option>
              {revisions.map((r) => (
                <option key={r.version} value={r.version}>
                  v{r.version}
                </option>
              ))}
            </select>
            <span className={styles.compareArrow}>→</span>
            <select
              className={styles.versionSelect}
              value={compareVersion2 ?? ''}
              onChange={(e) => setCompareVersion2(Number(e.target.value) || null)}
            >
              <option value="">Version 2</option>
              {revisions.map((r) => (
                <option key={r.version} value={r.version}>
                  v{r.version}
                </option>
              ))}
            </select>
            <button
              className={styles.compareButton}
              onClick={handleCompare}
              disabled={compareVersion1 === null || compareVersion2 === null}
            >
              Compare
            </button>
          </div>
        )}
      </div>

      {/* Comparison Result */}
      {comparison && (
        <div className={styles.comparisonResult}>
          <div className={styles.comparisonHeader}>
            <h3>
              Comparison: v{comparison.version1} → v{comparison.version2}
            </h3>
            <button
              className={styles.closeButton}
              onClick={() => setComparison(null)}
            >
              ✕
            </button>
          </div>
          <div className={styles.comparisonStats}>
            <span>Changes: {comparison.changeCount}</span>
            <span>Time: {formatTimeDifference(comparison.timeDifference)}</span>
          </div>
          <div className={styles.comparisonChanges}>
            <h4>Changes in v{comparison.version2}:</h4>
            <ul>
              {comparison.changesInVersion2.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className={styles.timeline}>
        {filteredRevisions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No revisions found</p>
          </div>
        ) : (
          filteredRevisions.map((revision, index) => (
            <div
              key={revision.version}
              className={`${styles.timelineItem} ${
                selectedRevision === revision.version ? styles.selected : ''
              }`}
              onClick={() => handleRevisionClick(revision)}
            >
              {/* Version indicator */}
              <div className={styles.versionIndicator}>
                <div className={styles.versionNumber}>v{revision.version}</div>
                {index < filteredRevisions.length - 1 && (
                  <div className={styles.versionLine} />
                )}
              </div>

              {/* Content */}
              <div className={styles.content}>
                <div className={styles.contentHeader}>
                  <span className={styles.author}>{revision.author}</span>
                  <span className={styles.date}>{formatDate(revision.date)}</span>
                </div>

                <div className={styles.changes}>
                  <h4>Changes ({revision.changes.length}):</h4>
                  <ul>
                    {revision.changes.map((change, changeIndex) => (
                      <li key={changeIndex}>{change}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RevisionHistoryPanel;
