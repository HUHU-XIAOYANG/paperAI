/**
 * Document Exporter Example
 * 
 * Demonstrates how to use the DocumentExporter service
 */

import { documentExporter } from './documentExporter';
import type { DocumentContent } from '../types/document.types';

/**
 * Example: Export a complete document to all formats
 */
async function exportCompleteDocument() {
  // Sample document content
  const documentContent: DocumentContent = {
    title: 'Agent Swarm Writing System: A Multi-Agent Approach to Academic Paper Creation',
    authors: ['Dr. Jane Smith', 'Prof. John Doe', 'Dr. Alice Johnson'],
    abstract:
      'This paper presents a novel multi-agent system for automated academic paper writing and review. ' +
      'The system employs a hierarchical architecture with decision-making AI, supervisory AI, and ' +
      'specialized writing and review teams. Our approach demonstrates significant improvements in ' +
      'paper quality and review efficiency compared to traditional methods.',
    sections: [
      {
        heading: 'Introduction',
        level: 1,
        content:
          'Academic paper writing is a complex and time-consuming process that requires expertise ' +
          'in multiple domains. Traditional approaches rely heavily on individual researchers, ' +
          'leading to bottlenecks and inconsistent quality.\n\n' +
          'In this paper, we propose an agent swarm writing system that leverages multiple AI agents ' +
          'working collaboratively to produce high-quality academic papers.',
        subsections: [
          {
            heading: 'Background',
            level: 2,
            content:
              'Multi-agent systems have been successfully applied to various domains including ' +
              'robotics, game playing, and distributed problem solving. However, their application ' +
              'to academic writing remains largely unexplored.',
          },
          {
            heading: 'Motivation',
            level: 2,
            content:
              'The motivation for this work stems from the increasing demand for academic publications ' +
              'and the limited availability of expert reviewers. Our system aims to address these ' +
              'challenges through intelligent automation.',
          },
        ],
      },
      {
        heading: 'Methodology',
        level: 1,
        content:
          'Our system architecture consists of four main layers: decision layer, supervision layer, ' +
          'execution layer, and review layer. Each layer contains specialized AI agents with ' +
          'specific roles and responsibilities.',
        subsections: [
          {
            heading: 'System Architecture',
            level: 2,
            content:
              'The decision layer analyzes the paper topic and allocates tasks to writing agents. ' +
              'The supervision layer monitors output quality and enforces format compliance. ' +
              'The execution layer performs the actual writing tasks. The review layer conducts ' +
              'peer review and quality assessment.',
          },
          {
            heading: 'Agent Communication',
            level: 2,
            content:
              'Agents communicate using a structured message format that includes message type, ' +
              'sender, receiver, content, and metadata. This enables non-linear interaction ' +
              'patterns where agents can discuss, negotiate, and provide feedback to each other.',
          },
        ],
      },
      {
        heading: 'Results',
        level: 1,
        content:
          'We evaluated our system on 50 different paper topics across multiple domains. ' +
          'The results show that our system produces papers with quality comparable to ' +
          'human-written papers, while significantly reducing the time required.',
      },
      {
        heading: 'Conclusion',
        level: 1,
        content:
          'This paper demonstrates the feasibility and effectiveness of using multi-agent systems ' +
          'for academic paper writing. Future work will focus on improving the quality of ' +
          'generated content and expanding the system to support more specialized domains.',
      },
    ],
    reviewComments: [
      {
        reviewer: 'Peer Reviewer 1',
        section: 'Introduction',
        comment: 'The introduction provides good context but could benefit from more specific examples of existing multi-agent systems.',
        severity: 'minor',
        timestamp: new Date('2024-01-15T10:30:00Z'),
      },
      {
        reviewer: 'Editor in Chief',
        section: 'Methodology',
        comment: 'The methodology section needs more detail on the evaluation metrics used to assess paper quality.',
        severity: 'major',
        timestamp: new Date('2024-01-15T14:20:00Z'),
      },
      {
        reviewer: 'Deputy Editor',
        section: 'Results',
        comment: 'Please include statistical significance tests for the performance comparisons.',
        severity: 'major',
        timestamp: new Date('2024-01-15T16:45:00Z'),
      },
      {
        reviewer: 'Peer Reviewer 2',
        section: 'Conclusion',
        comment: 'Consider discussing the limitations of the current approach in more detail.',
        severity: 'minor',
        timestamp: new Date('2024-01-16T09:15:00Z'),
      },
    ],
    revisionHistory: [
      {
        version: 1,
        date: new Date('2024-01-10'),
        changes: [
          'Initial draft completed',
          'All sections written by writing team',
          'Basic structure established',
        ],
        author: 'Writing Team',
      },
      {
        version: 2,
        date: new Date('2024-01-15'),
        changes: [
          'Addressed format issues identified by Editorial Office',
          'Expanded methodology section based on Editor feedback',
          'Added more references to related work',
        ],
        author: 'Writing Team',
      },
      {
        version: 3,
        date: new Date('2024-01-18'),
        changes: [
          'Incorporated peer reviewer feedback',
          'Added statistical analysis to results section',
          'Expanded discussion of limitations',
          'Improved clarity of abstract',
        ],
        author: 'Writing Team',
      },
    ],
  };

  try {
    // Export to DOCX
    console.log('Exporting to DOCX...');
    const docxBlob = await documentExporter.exportToDocx(documentContent);
    console.log(`DOCX export successful. Size: ${docxBlob.size} bytes`);

    // Export to Markdown
    console.log('\nExporting to Markdown...');
    const markdown = await documentExporter.exportToMarkdown(documentContent);
    console.log(`Markdown export successful. Length: ${markdown.length} characters`);
    console.log('\nMarkdown preview (first 500 chars):');
    console.log(markdown.substring(0, 500) + '...');

    // Export to PDF
    console.log('\nExporting to PDF...');
    const pdfBlob = await documentExporter.exportToPdf(documentContent);
    console.log(`PDF export successful. Size: ${pdfBlob.size} bytes`);

    return {
      docx: docxBlob,
      markdown,
      pdf: pdfBlob,
    };
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

/**
 * Example: Export a simple document without review comments
 */
async function exportSimpleDocument() {
  const simpleDocument: DocumentContent = {
    title: 'A Brief Introduction to Multi-Agent Systems',
    authors: ['John Smith'],
    abstract: 'This paper provides a brief overview of multi-agent systems and their applications.',
    sections: [
      {
        heading: 'Introduction',
        level: 1,
        content: 'Multi-agent systems consist of multiple autonomous agents that interact to achieve common goals.',
      },
      {
        heading: 'Applications',
        level: 1,
        content: 'Multi-agent systems are used in robotics, distributed computing, and artificial intelligence.',
      },
    ],
    reviewComments: [],
    revisionHistory: [],
  };

  const markdown = await documentExporter.exportToMarkdown(simpleDocument);
  console.log('Simple document markdown:');
  console.log(markdown);

  return markdown;
}

/**
 * Example: Export with nested subsections
 */
async function exportNestedDocument() {
  const nestedDocument: DocumentContent = {
    title: 'Hierarchical Document Structure',
    authors: ['Test Author'],
    abstract: 'Demonstrating nested section support.',
    sections: [
      {
        heading: 'Chapter 1',
        level: 1,
        content: 'This is chapter 1.',
        subsections: [
          {
            heading: 'Section 1.1',
            level: 2,
            content: 'This is section 1.1.',
            subsections: [
              {
                heading: 'Subsection 1.1.1',
                level: 3,
                content: 'This is subsection 1.1.1.',
              },
              {
                heading: 'Subsection 1.1.2',
                level: 3,
                content: 'This is subsection 1.1.2.',
              },
            ],
          },
          {
            heading: 'Section 1.2',
            level: 2,
            content: 'This is section 1.2.',
          },
        ],
      },
    ],
    reviewComments: [],
    revisionHistory: [],
  };

  const docxBlob = await documentExporter.exportToDocx(nestedDocument);
  console.log(`Nested document DOCX size: ${docxBlob.size} bytes`);

  return docxBlob;
}

// Export examples
export {
  exportCompleteDocument,
  exportSimpleDocument,
  exportNestedDocument,
};

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportCompleteDocument()
    .then(() => console.log('\n✓ All exports completed successfully'))
    .catch((error) => console.error('\n✗ Export failed:', error));
}
