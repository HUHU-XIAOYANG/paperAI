/**
 * Document and export-related type definitions
 */

export interface DocumentSection {
  heading: string;
  level: number;
  content: string;
  subsections?: DocumentSection[];
}

export interface ReviewComment {
  reviewer: string;
  section: string;
  comment: string;
  severity: 'minor' | 'major' | 'critical';
  timestamp: Date;
}

export interface RevisionRecord {
  version: number;
  date: Date;
  changes: string[];
  author: string;
}

export interface DocumentContent {
  title: string;
  authors: string[];
  abstract: string;
  sections: DocumentSection[];
  reviewComments: ReviewComment[];
  revisionHistory: RevisionRecord[];
}

export interface DocumentMetadata {
  title: string;
  authors: string[];
  abstract?: string;
  keywords: string[];
  wordCount: number;
}

export interface DocumentDraft {
  version: number;
  sections: Map<string, string>;
  metadata: DocumentMetadata;
  lastModified: Date;
}
