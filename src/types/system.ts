// 系统状态相关类型定义

import type { Agent } from './agent';

export type ProcessPhase = 
  | 'idle' 
  | 'initialization' 
  | 'task_allocation' 
  | 'writing' 
  | 'internal_review' 
  | 'peer_review' 
  | 'revision' 
  | 'final_review' 
  | 'completed' 
  | 'rejected';

export interface SystemState {
  currentPhase: ProcessPhase;
  activeAgents: string[]; // Agent ID列表
  rejectionCount: number;
  estimatedCompletion?: Date;
  currentTopic?: string;
  startTime?: Date;
}

export interface DocumentMetadata {
  title: string;
  authors: string[];
  abstract?: string;
  keywords: string[];
  wordCount: number;
}

export interface DocumentSection {
  heading: string;
  level: number;
  content: string;
  subsections?: DocumentSection[];
}

export interface DocumentDraft {
  version: number;
  sections: Map<string, string>; // section name -> content
  metadata: DocumentMetadata;
  lastModified: Date;
}

export interface RevisionRecord {
  version: number;
  date: Date;
  changes: string[];
  author: string;
}

export interface WritingProcessState {
  topic: string;
  startTime: Date;
  currentPhase: ProcessPhase;
  writingTeam: Agent[];
  reviewTeam: Agent[];
  document: DocumentDraft;
  rejectionCount: number;
  revisionHistory: RevisionRecord[];
}
