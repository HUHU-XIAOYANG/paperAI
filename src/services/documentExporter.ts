/**
 * Document Exporter Service
 * 
 * Exports documents to multiple formats (DOCX, Markdown, PDF)
 * Preserves formatting and includes review comments and revision history
 * 
 * Requirements:
 * - 需求 13.1: DOCX格式导出
 * - 需求 13.2: Markdown格式导出
 * - 需求 13.3: PDF格式导出
 * - 需求 13.4: 保留文档格式和样式
 * - 需求 13.5: 包含审稿意见和修订历史记录
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { jsPDF } from 'jspdf';
import type {
  DocumentContent,
  DocumentSection,
} from '../types/document.types';

/**
 * DocumentExporter class
 * Handles exporting documents to various formats with performance optimizations
 */
export class DocumentExporter {
  /** 文档缓存 - 增量构建优化 */
  private documentCache: Map<string, {
    content: DocumentContent;
    docxBlob?: Blob;
    markdown?: string;
    pdfBlob?: Blob;
    lastModified: Date;
  }> = new Map();

  /** 性能配置 */
  private performanceConfig = {
    enableCache: true, // 启用缓存
    cacheTimeout: 300000, // 缓存超时时间（5分钟）
    incrementalBuild: true, // 增量构建
  };

  /**
   * 生成文档缓存键
   * 
   * @private
   * @param content - 文档内容
   * @returns 缓存键
   */
  private getCacheKey(content: DocumentContent): string {
    // 使用标题和修订版本作为缓存键
    const lastRevision = content.revisionHistory[content.revisionHistory.length - 1];
    const version = lastRevision ? lastRevision.version : 0;
    return `${content.title}_v${version}`;
  }

  /**
   * 检查缓存是否有效
   * 
   * @private
   * @param cacheKey - 缓存键
   * @returns 是否有效
   */
  private isCacheValid(cacheKey: string): boolean {
    if (!this.performanceConfig.enableCache) {
      return false;
    }

    const cached = this.documentCache.get(cacheKey);
    if (!cached) {
      return false;
    }

    const now = new Date();
    const age = now.getTime() - cached.lastModified.getTime();
    return age < this.performanceConfig.cacheTimeout;
  }
  /**
   * Export document to DOCX format
   * Uses docx.js library to create Word documents
   * Implements caching for performance optimization (目标：导出时间<5秒)
   */
  async exportToDocx(content: DocumentContent): Promise<Blob> {
    const cacheKey = this.getCacheKey(content);

    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      const cached = this.documentCache.get(cacheKey);
      if (cached?.docxBlob) {
        console.log('Using cached DOCX document');
        return cached.docxBlob;
      }
    }

    // 生成文档
    const startTime = Date.now();
    const sections: any[] = [];

    // Title
    sections.push(
      new Paragraph({
        text: content.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Authors
    if (content.authors.length > 0) {
      sections.push(
        new Paragraph({
          text: content.authors.join(', '),
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    // Abstract
    if (content.abstract) {
      sections.push(
        new Paragraph({
          text: 'Abstract',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
      sections.push(
        new Paragraph({
          text: content.abstract,
          spacing: { after: 400 },
        })
      );
    }

    // Document sections
    for (const section of content.sections) {
      this.addSectionToDocx(sections, section);
    }

    // Review comments section
    if (content.reviewComments.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Review Comments',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 200 },
          pageBreakBefore: true,
        })
      );

      // Create table for review comments
      const commentRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('Reviewer')],
              width: { size: 20, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph('Section')],
              width: { size: 20, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph('Severity')],
              width: { size: 15, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph('Comment')],
              width: { size: 45, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      ];

      for (const comment of content.reviewComments) {
        commentRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph(comment.reviewer)],
              }),
              new TableCell({
                children: [new Paragraph(comment.section)],
              }),
              new TableCell({
                children: [new Paragraph(comment.severity)],
              }),
              new TableCell({
                children: [new Paragraph(comment.comment)],
              }),
            ],
          })
        );
      }

      sections.push(
        new Table({
          rows: commentRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }

    // Revision history section
    if (content.revisionHistory.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Revision History',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 200 },
        })
      );

      for (const revision of content.revisionHistory) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Version ${revision.version} - `,
                bold: true,
              }),
              new TextRun({
                text: `${revision.date.toLocaleDateString()} by ${revision.author}`,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        for (const change of revision.changes) {
          sections.push(
            new Paragraph({
              text: `• ${change}`,
              spacing: { after: 100 },
              indent: { left: 400 },
            })
          );
        }
      }
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    });

    // Generate blob
    const buffer = await Packer.toBlob(doc);

    // 缓存结果
    const cached = this.documentCache.get(cacheKey) || {
      content,
      lastModified: new Date(),
    };
    cached.docxBlob = buffer;
    cached.lastModified = new Date();
    this.documentCache.set(cacheKey, cached);

    const endTime = Date.now();
    console.log(`DOCX export completed in ${endTime - startTime}ms`);

    return buffer;
  }

  /**
   * Helper method to add a section and its subsections to DOCX
   */
  private addSectionToDocx(
    sections: any[],
    section: DocumentSection,
    parentLevel: number = 0
  ): void {
    // Determine heading level (1-6)
    const headingLevel = Math.min(section.level + parentLevel, 6) as 1 | 2 | 3 | 4 | 5 | 6;
    const headingLevelMap: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6,
    };

    // Add heading
    sections.push(
      new Paragraph({
        text: section.heading,
        heading: headingLevelMap[headingLevel],
        spacing: { before: 400, after: 200 },
      })
    );

    // Add content
    const contentParagraphs = section.content.split('\n\n');
    for (const para of contentParagraphs) {
      if (para.trim()) {
        sections.push(
          new Paragraph({
            text: para.trim(),
            spacing: { after: 200 },
          })
        );
      }
    }

    // Add subsections recursively
    if (section.subsections) {
      for (const subsection of section.subsections) {
        this.addSectionToDocx(sections, subsection, headingLevel);
      }
    }
  }

  /**
   * Export document to Markdown format
   * Uses unified and remark for Markdown generation
   * Implements caching for performance optimization
   */
  async exportToMarkdown(content: DocumentContent): Promise<string> {
    const cacheKey = this.getCacheKey(content);

    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      const cached = this.documentCache.get(cacheKey);
      if (cached?.markdown) {
        console.log('Using cached Markdown document');
        return cached.markdown;
      }
    }

    // 生成文档
    const startTime = Date.now();
    let markdown = '';

    // Title
    markdown += `# ${content.title}\n\n`;

    // Authors
    if (content.authors.length > 0) {
      markdown += `**Authors:** ${content.authors.join(', ')}\n\n`;
    }

    // Abstract
    if (content.abstract) {
      markdown += `## Abstract\n\n${content.abstract}\n\n`;
    }

    // Document sections
    for (const section of content.sections) {
      markdown += this.sectionToMarkdown(section);
    }

    // Review comments section
    if (content.reviewComments.length > 0) {
      markdown += `---\n\n## Review Comments\n\n`;
      markdown += `| Reviewer | Section | Severity | Comment |\n`;
      markdown += `|----------|---------|----------|----------|\n`;

      for (const comment of content.reviewComments) {
        const reviewer = this.escapeMarkdown(comment.reviewer);
        const section = this.escapeMarkdown(comment.section);
        const severity = comment.severity;
        const commentText = this.escapeMarkdown(comment.comment);
        markdown += `| ${reviewer} | ${section} | ${severity} | ${commentText} |\n`;
      }
      markdown += '\n';
    }

    // Revision history section
    if (content.revisionHistory.length > 0) {
      markdown += `## Revision History\n\n`;

      for (const revision of content.revisionHistory) {
        markdown += `### Version ${revision.version}\n\n`;
        markdown += `**Date:** ${revision.date.toLocaleDateString()}\n\n`;
        markdown += `**Author:** ${revision.author}\n\n`;
        markdown += `**Changes:**\n\n`;

        for (const change of revision.changes) {
          markdown += `- ${change}\n`;
        }
        markdown += '\n';
      }
    }

    // 缓存结果
    const cached = this.documentCache.get(cacheKey) || {
      content,
      lastModified: new Date(),
    };
    cached.markdown = markdown;
    cached.lastModified = new Date();
    this.documentCache.set(cacheKey, cached);

    const endTime = Date.now();
    console.log(`Markdown export completed in ${endTime - startTime}ms`);

    return markdown;
  }

  /**
   * Helper method to convert a section to Markdown
   */
  private sectionToMarkdown(section: DocumentSection, level: number = 0): string {
    let markdown = '';

    // Calculate heading level (2-6, since title is 1)
    const headingLevel = Math.min(section.level + level + 1, 6);
    const headingPrefix = '#'.repeat(headingLevel);

    // Add heading
    markdown += `${headingPrefix} ${section.heading}\n\n`;

    // Add content
    markdown += `${section.content}\n\n`;

    // Add subsections recursively
    if (section.subsections) {
      for (const subsection of section.subsections) {
        markdown += this.sectionToMarkdown(subsection, headingLevel - 1);
      }
    }

    return markdown;
  }

  /**
   * Escape special Markdown characters in table cells
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }

  /**
   * Export document to PDF format
   * Uses jsPDF library to create PDF documents
   * Implements caching for performance optimization
   */
  async exportToPdf(content: DocumentContent): Promise<Blob> {
    const cacheKey = this.getCacheKey(content);

    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      const cached = this.documentCache.get(cacheKey);
      if (cached?.pdfBlob) {
        console.log('Using cached PDF document');
        return cached.pdfBlob;
      }
    }

    // 生成文档
    const startTime = Date.now();
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number = 10) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      }
      yPosition += 5;
    };

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(content.title, maxWidth);
    for (const line of titleLines) {
      doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;
    }
    yPosition += 10;

    // Authors
    if (content.authors.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(content.authors.join(', '), pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Abstract
    if (content.abstract) {
      checkPageBreak(20);
      addText('Abstract', 16, true);
      addText(content.abstract, 11);
      yPosition += 5;
    }

    // Document sections
    for (const section of content.sections) {
      this.addSectionToPdf(doc, section, margin, maxWidth, () => yPosition, (y) => { yPosition = y; }, checkPageBreak);
    }

    // Review comments section
    if (content.reviewComments.length > 0) {
      doc.addPage();
      yPosition = margin;
      addText('Review Comments', 18, true);
      yPosition += 5;

      for (const comment of content.reviewComments) {
        checkPageBreak(30);
        addText(`Reviewer: ${comment.reviewer}`, 10, true);
        addText(`Section: ${comment.section}`, 10);
        addText(`Severity: ${comment.severity}`, 10);
        addText(`Comment: ${comment.comment}`, 10);
        yPosition += 5;
      }
    }

    // Revision history section
    if (content.revisionHistory.length > 0) {
      checkPageBreak(30);
      addText('Revision History', 18, true);
      yPosition += 5;

      for (const revision of content.revisionHistory) {
        checkPageBreak(25);
        addText(`Version ${revision.version} - ${revision.date.toLocaleDateString()} by ${revision.author}`, 12, true);
        
        for (const change of revision.changes) {
          addText(`• ${change}`, 10);
        }
        yPosition += 5;
      }
    }

    const blob = doc.output('blob');

    // 缓存结果
    const cached = this.documentCache.get(cacheKey) || {
      content,
      lastModified: new Date(),
    };
    cached.pdfBlob = blob;
    cached.lastModified = new Date();
    this.documentCache.set(cacheKey, cached);

    const endTime = Date.now();
    console.log(`PDF export completed in ${endTime - startTime}ms`);

    return blob;
  }

  /**
   * Helper method to add a section to PDF
   */
  private addSectionToPdf(
    doc: jsPDF,
    section: DocumentSection,
    margin: number,
    maxWidth: number,
    getY: () => number,
    setY: (y: number) => void,
    checkPageBreak: (space?: number) => void,
    level: number = 0
  ): void {
    let yPosition = getY();

    // Calculate font size based on level
    const fontSize = Math.max(16 - level * 2, 11);

    checkPageBreak(20);

    // Add heading
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    const headingLines = doc.splitTextToSize(section.heading, maxWidth);
    for (const line of headingLines) {
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    }
    yPosition += 5;

    // Add content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const contentLines = doc.splitTextToSize(section.content, maxWidth);
    for (const line of contentLines) {
      checkPageBreak();
      doc.text(line, margin, yPosition);
      yPosition += 5.5;
    }
    yPosition += 5;

    setY(yPosition);

    // Add subsections recursively
    if (section.subsections) {
      for (const subsection of section.subsections) {
        this.addSectionToPdf(doc, subsection, margin, maxWidth, getY, setY, checkPageBreak, level + 1);
      }
    }
  }

  /**
   * 清理过期缓存
   * 
   * 删除超过缓存超时时间的文档缓存
   * 
   * @returns 清理的缓存数量
   */
  cleanupCache(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, cached] of this.documentCache.entries()) {
      const age = now.getTime() - cached.lastModified.getTime();
      if (age > this.performanceConfig.cacheTimeout) {
        this.documentCache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.documentCache.clear();
  }

  /**
   * 配置性能参数
   * 
   * @param enableCache - 是否启用缓存
   * @param cacheTimeout - 缓存超时时间（毫秒）
   * @param incrementalBuild - 是否启用增量构建
   */
  configurePerformance(
    enableCache?: boolean,
    cacheTimeout?: number,
    incrementalBuild?: boolean
  ): void {
    if (enableCache !== undefined) {
      this.performanceConfig.enableCache = enableCache;
    }
    if (cacheTimeout !== undefined && cacheTimeout > 0) {
      this.performanceConfig.cacheTimeout = cacheTimeout;
    }
    if (incrementalBuild !== undefined) {
      this.performanceConfig.incrementalBuild = incrementalBuild;
    }
  }

  /**
   * 获取缓存状态
   * 
   * @returns 缓存状态信息
   */
  getCacheStatus(): {
    cacheSize: number;
    enableCache: boolean;
    cacheTimeout: number;
  } {
    return {
      cacheSize: this.documentCache.size,
      enableCache: this.performanceConfig.enableCache,
      cacheTimeout: this.performanceConfig.cacheTimeout,
    };
  }
}

// Export singleton instance
export const documentExporter = new DocumentExporter();
