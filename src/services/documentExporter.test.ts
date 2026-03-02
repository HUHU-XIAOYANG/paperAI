/**
 * Document Exporter Tests
 * 
 * Tests for document export functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentExporter } from './documentExporter';
import type { DocumentContent } from '../types/document.types';

describe('DocumentExporter', () => {
  let exporter: DocumentExporter;
  let sampleDocument: DocumentContent;

  beforeEach(() => {
    exporter = new DocumentExporter();
    
    // Create sample document for testing
    sampleDocument = {
      title: 'Test Document',
      authors: ['Author One', 'Author Two'],
      abstract: 'This is a test abstract.',
      sections: [
        {
          heading: 'Introduction',
          level: 1,
          content: 'This is the introduction section.',
        },
        {
          heading: 'Methods',
          level: 1,
          content: 'This is the methods section.',
          subsections: [
            {
              heading: 'Data Collection',
              level: 2,
              content: 'Details about data collection.',
            },
          ],
        },
      ],
      reviewComments: [
        {
          reviewer: 'Reviewer 1',
          section: 'Introduction',
          comment: 'Needs more detail.',
          severity: 'minor',
          timestamp: new Date('2024-01-15'),
        },
      ],
      revisionHistory: [
        {
          version: 1,
          date: new Date('2024-01-10'),
          changes: ['Initial draft'],
          author: 'Writing Team',
        },
      ],
    };
  });

  describe('exportToDocx', () => {
    it('should export document to DOCX format', async () => {
      const blob = await exporter.exportToDocx(sampleDocument);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toContain('application');
    });

    it('should handle document without abstract', async () => {
      const docWithoutAbstract = { ...sampleDocument, abstract: '' };
      const blob = await exporter.exportToDocx(docWithoutAbstract);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle document without authors', async () => {
      const docWithoutAuthors = { ...sampleDocument, authors: [] };
      const blob = await exporter.exportToDocx(docWithoutAuthors);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle document without review comments', async () => {
      const docWithoutComments = { ...sampleDocument, reviewComments: [] };
      const blob = await exporter.exportToDocx(docWithoutComments);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle document without revision history', async () => {
      const docWithoutHistory = { ...sampleDocument, revisionHistory: [] };
      const blob = await exporter.exportToDocx(docWithoutHistory);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle nested subsections', async () => {
      const docWithNestedSections: DocumentContent = {
        ...sampleDocument,
        sections: [
          {
            heading: 'Chapter 1',
            level: 1,
            content: 'Chapter content',
            subsections: [
              {
                heading: 'Section 1.1',
                level: 2,
                content: 'Section content',
                subsections: [
                  {
                    heading: 'Subsection 1.1.1',
                    level: 3,
                    content: 'Subsection content',
                  },
                ],
              },
            ],
          },
        ],
      };

      const blob = await exporter.exportToDocx(docWithNestedSections);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle multiple review comments', async () => {
      const docWithMultipleComments: DocumentContent = {
        ...sampleDocument,
        reviewComments: [
          {
            reviewer: 'Reviewer 1',
            section: 'Introduction',
            comment: 'First comment',
            severity: 'minor',
            timestamp: new Date('2024-01-15'),
          },
          {
            reviewer: 'Reviewer 2',
            section: 'Methods',
            comment: 'Second comment',
            severity: 'major',
            timestamp: new Date('2024-01-16'),
          },
          {
            reviewer: 'Editor',
            section: 'Results',
            comment: 'Third comment',
            severity: 'critical',
            timestamp: new Date('2024-01-17'),
          },
        ],
      };

      const blob = await exporter.exportToDocx(docWithMultipleComments);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('exportToMarkdown', () => {
    it('should export document to Markdown format', async () => {
      const markdown = await exporter.exportToMarkdown(sampleDocument);
      
      expect(markdown).toContain('# Test Document');
      expect(markdown).toContain('**Authors:** Author One, Author Two');
      expect(markdown).toContain('## Abstract');
      expect(markdown).toContain('This is a test abstract.');
      expect(markdown).toContain('## Introduction');
      expect(markdown).toContain('## Methods');
      expect(markdown).toContain('### Data Collection');
    });

    it('should include review comments in markdown', async () => {
      const markdown = await exporter.exportToMarkdown(sampleDocument);
      
      expect(markdown).toContain('## Review Comments');
      expect(markdown).toContain('| Reviewer | Section | Severity | Comment |');
      expect(markdown).toContain('Reviewer 1');
      expect(markdown).toContain('Needs more detail');
    });

    it('should include revision history in markdown', async () => {
      const markdown = await exporter.exportToMarkdown(sampleDocument);
      
      expect(markdown).toContain('## Revision History');
      expect(markdown).toContain('### Version 1');
      expect(markdown).toContain('Writing Team');
      expect(markdown).toContain('- Initial draft');
    });

    it('should handle document without abstract', async () => {
      const docWithoutAbstract = { ...sampleDocument, abstract: '' };
      const markdown = await exporter.exportToMarkdown(docWithoutAbstract);
      
      expect(markdown).toContain('# Test Document');
      expect(markdown).not.toContain('## Abstract');
    });

    it('should handle document without authors', async () => {
      const docWithoutAuthors = { ...sampleDocument, authors: [] };
      const markdown = await exporter.exportToMarkdown(docWithoutAuthors);
      
      expect(markdown).toContain('# Test Document');
      expect(markdown).not.toContain('**Authors:**');
    });

    it('should escape special markdown characters in table cells', async () => {
      const docWithSpecialChars: DocumentContent = {
        ...sampleDocument,
        reviewComments: [
          {
            reviewer: 'Reviewer | Special',
            section: 'Section | Name',
            comment: 'Comment with | pipe and\nnewline',
            severity: 'minor',
            timestamp: new Date('2024-01-15'),
          },
        ],
      };

      const markdown = await exporter.exportToMarkdown(docWithSpecialChars);
      
      // Pipes should be escaped
      expect(markdown).toContain('\\|');
      // Newlines should be replaced with spaces
      expect(markdown).not.toContain('Comment with | pipe and\nnewline');
    });

    it('should handle nested subsections with correct heading levels', async () => {
      const docWithNestedSections: DocumentContent = {
        ...sampleDocument,
        sections: [
          {
            heading: 'Level 1',
            level: 1,
            content: 'Content 1',
            subsections: [
              {
                heading: 'Level 2',
                level: 2,
                content: 'Content 2',
                subsections: [
                  {
                    heading: 'Level 3',
                    level: 3,
                    content: 'Content 3',
                  },
                ],
              },
            ],
          },
        ],
      };

      const markdown = await exporter.exportToMarkdown(docWithNestedSections);
      
      expect(markdown).toContain('## Level 1');
      expect(markdown).toContain('### Level 2');
      expect(markdown).toContain('#### Level 3');
    });

    it('should handle empty sections array', async () => {
      const docWithoutSections = { ...sampleDocument, sections: [] };
      const markdown = await exporter.exportToMarkdown(docWithoutSections);
      
      expect(markdown).toContain('# Test Document');
      expect(markdown).toContain('**Authors:**');
    });
  });

  describe('exportToPdf', () => {
    it('should export document to PDF format', async () => {
      const blob = await exporter.exportToPdf(sampleDocument);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('application/pdf');
    });

    it('should handle document without abstract', async () => {
      const docWithoutAbstract = { ...sampleDocument, abstract: '' };
      const blob = await exporter.exportToPdf(docWithoutAbstract);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle document without authors', async () => {
      const docWithoutAuthors = { ...sampleDocument, authors: [] };
      const blob = await exporter.exportToPdf(docWithoutAuthors);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle document without review comments', async () => {
      const docWithoutComments = { ...sampleDocument, reviewComments: [] };
      const blob = await exporter.exportToPdf(docWithoutComments);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle document without revision history', async () => {
      const docWithoutHistory = { ...sampleDocument, revisionHistory: [] };
      const blob = await exporter.exportToPdf(docWithoutHistory);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle nested subsections', async () => {
      const docWithNestedSections: DocumentContent = {
        ...sampleDocument,
        sections: [
          {
            heading: 'Chapter 1',
            level: 1,
            content: 'Chapter content',
            subsections: [
              {
                heading: 'Section 1.1',
                level: 2,
                content: 'Section content',
                subsections: [
                  {
                    heading: 'Subsection 1.1.1',
                    level: 3,
                    content: 'Subsection content',
                  },
                ],
              },
            ],
          },
        ],
      };

      const blob = await exporter.exportToPdf(docWithNestedSections);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle long content that requires multiple pages', async () => {
      const longContent = 'This is a long paragraph. '.repeat(100);
      const docWithLongContent: DocumentContent = {
        ...sampleDocument,
        sections: [
          {
            heading: 'Long Section',
            level: 1,
            content: longContent,
          },
        ],
      };

      const blob = await exporter.exportToPdf(docWithLongContent);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle multiple review comments', async () => {
      const docWithMultipleComments: DocumentContent = {
        ...sampleDocument,
        reviewComments: [
          {
            reviewer: 'Reviewer 1',
            section: 'Introduction',
            comment: 'First comment',
            severity: 'minor',
            timestamp: new Date('2024-01-15'),
          },
          {
            reviewer: 'Reviewer 2',
            section: 'Methods',
            comment: 'Second comment',
            severity: 'major',
            timestamp: new Date('2024-01-16'),
          },
        ],
      };

      const blob = await exporter.exportToPdf(docWithMultipleComments);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('Format preservation', () => {
    it('should preserve document structure across all formats', async () => {
      const docx = await exporter.exportToDocx(sampleDocument);
      const markdown = await exporter.exportToMarkdown(sampleDocument);
      const pdf = await exporter.exportToPdf(sampleDocument);

      // All formats should be generated successfully
      expect(docx).toBeInstanceOf(Blob);
      expect(markdown).toBeTruthy();
      expect(pdf).toBeInstanceOf(Blob);

      // Markdown should contain all key elements
      expect(markdown).toContain(sampleDocument.title);
      expect(markdown).toContain(sampleDocument.abstract);
      if (sampleDocument.sections[0]) {
        expect(markdown).toContain(sampleDocument.sections[0].heading);
      }
      if (sampleDocument.reviewComments[0]) {
        expect(markdown).toContain(sampleDocument.reviewComments[0].comment);
      }
      if (sampleDocument.revisionHistory[0]) {
        expect(markdown).toContain(sampleDocument.revisionHistory[0].author);
      }
    });

    it('should include all review comments in all formats', async () => {
      const docWithComments: DocumentContent = {
        ...sampleDocument,
        reviewComments: [
          {
            reviewer: 'Reviewer A',
            section: 'Intro',
            comment: 'Comment A',
            severity: 'minor',
            timestamp: new Date(),
          },
          {
            reviewer: 'Reviewer B',
            section: 'Methods',
            comment: 'Comment B',
            severity: 'major',
            timestamp: new Date(),
          },
        ],
      };

      const markdown = await exporter.exportToMarkdown(docWithComments);
      
      expect(markdown).toContain('Reviewer A');
      expect(markdown).toContain('Reviewer B');
      expect(markdown).toContain('Comment A');
      expect(markdown).toContain('Comment B');
    });

    it('should include all revision history in all formats', async () => {
      const docWithHistory: DocumentContent = {
        ...sampleDocument,
        revisionHistory: [
          {
            version: 1,
            date: new Date('2024-01-10'),
            changes: ['Change 1', 'Change 2'],
            author: 'Author A',
          },
          {
            version: 2,
            date: new Date('2024-01-15'),
            changes: ['Change 3'],
            author: 'Author B',
          },
        ],
      };

      const markdown = await exporter.exportToMarkdown(docWithHistory);
      
      expect(markdown).toContain('Version 1');
      expect(markdown).toContain('Version 2');
      expect(markdown).toContain('Change 1');
      expect(markdown).toContain('Change 2');
      expect(markdown).toContain('Change 3');
      expect(markdown).toContain('Author A');
      expect(markdown).toContain('Author B');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty title', async () => {
      const docWithEmptyTitle = { ...sampleDocument, title: '' };
      const markdown = await exporter.exportToMarkdown(docWithEmptyTitle);
      
      expect(markdown).toContain('#');
    });

    it('should handle very long titles', async () => {
      const longTitle = 'A'.repeat(200);
      const docWithLongTitle = { ...sampleDocument, title: longTitle };
      
      const docx = await exporter.exportToDocx(docWithLongTitle);
      const markdown = await exporter.exportToMarkdown(docWithLongTitle);
      const pdf = await exporter.exportToPdf(docWithLongTitle);

      expect(docx).toBeInstanceOf(Blob);
      expect(markdown).toContain(longTitle);
      expect(pdf).toBeInstanceOf(Blob);
    });

    it('should handle sections with empty content', async () => {
      const docWithEmptyContent: DocumentContent = {
        ...sampleDocument,
        sections: [
          {
            heading: 'Empty Section',
            level: 1,
            content: '',
          },
        ],
      };

      const markdown = await exporter.exportToMarkdown(docWithEmptyContent);
      expect(markdown).toContain('## Empty Section');
    });

    it('should handle special characters in content', async () => {
      const docWithSpecialChars: DocumentContent = {
        ...sampleDocument,
        sections: [
          {
            heading: 'Special Characters: <>&"\'',
            level: 1,
            content: 'Content with special chars: <>&"\' and unicode: 中文 日本語',
          },
        ],
      };

      const docx = await exporter.exportToDocx(docWithSpecialChars);
      const markdown = await exporter.exportToMarkdown(docWithSpecialChars);
      const pdf = await exporter.exportToPdf(docWithSpecialChars);

      expect(docx).toBeInstanceOf(Blob);
      expect(markdown).toBeTruthy();
      expect(pdf).toBeInstanceOf(Blob);
    });

    it('should handle maximum nesting depth', async () => {
      // Create deeply nested structure
      let deepSection: any = {
        heading: 'Level 10',
        level: 10,
        content: 'Deepest level',
      };

      for (let i = 9; i >= 1; i--) {
        deepSection = {
          heading: `Level ${i}`,
          level: i,
          content: `Content ${i}`,
          subsections: [deepSection],
        };
      }

      const docWithDeepNesting: DocumentContent = {
        ...sampleDocument,
        sections: [deepSection],
      };

      const docx = await exporter.exportToDocx(docWithDeepNesting);
      const markdown = await exporter.exportToMarkdown(docWithDeepNesting);
      const pdf = await exporter.exportToPdf(docWithDeepNesting);

      expect(docx).toBeInstanceOf(Blob);
      expect(markdown).toBeTruthy();
      expect(pdf).toBeInstanceOf(Blob);
    });
  });
});
