/**
 * Topic Input View Component
 * Implements Requirements 5.1, 5.5: Topic input and workload estimation
 * 
 * Features:
 * - Paper topic input form
 * - Start button to begin writing process
 * - Estimated completion time display
 * - Glass morphism styling
 */

import { useState } from 'react';
import { GlassContainer } from '../components/GlassContainer';
import { useSystemStore } from '../stores/systemStore';
import styles from './TopicInputView.module.css';

export interface TopicInputViewProps {
  /** Callback when writing process starts */
  onStartWriting?: (topic: string) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Topic Input View Component
 * 
 * Provides a form for users to input paper topic and start the writing process.
 * Shows estimated completion time based on topic complexity.
 * 
 * @example
 * ```tsx
 * <TopicInputView onStartWriting={(topic) => startProcess(topic)} />
 * ```
 */
export function TopicInputView({ onStartWriting, className = '' }: TopicInputViewProps) {
  const [topic, setTopic] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const currentPhase = useSystemStore((state) => state.currentPhase);

  // Estimate completion time based on topic length (simplified)
  const estimateCompletionTime = (topicText: string): string => {
    const wordCount = topicText.trim().split(/\s+/).length;
    
    if (wordCount < 5) {
      return '约 30-45 分钟';
    } else if (wordCount < 10) {
      return '约 45-60 分钟';
    } else if (wordCount < 20) {
      return '约 1-2 小时';
    } else {
      return '约 2-3 小时';
    }
  };

  // Handle topic change
  const handleTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTopic = e.target.value;
    setTopic(newTopic);
    
    // Update estimated time
    if (newTopic.trim().length > 0) {
      setEstimatedTime(estimateCompletionTime(newTopic));
    } else {
      setEstimatedTime(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call callback
      onStartWriting?.(topic.trim());
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Check if form is valid
  const isFormValid = topic.trim().length >= 5;
  const isProcessing = currentPhase !== 'idle' && currentPhase !== 'completed';

  return (
    <div className={`${styles.topicInputView} ${className}`}>
      <GlassContainer className={styles.container} variant="default" padding="xl" radius="xl">
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>开始新的写作任务</h1>
          <p className={styles.subtitle}>
            输入您的论文题目，AI团队将自动分析并开始协作写作
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="topic" className={styles.label}>
              论文题目
              <span className={styles.required}>*</span>
            </label>
            <textarea
              id="topic"
              className={styles.textarea}
              placeholder="例如：基于深度学习的图像识别技术研究与应用"
              value={topic}
              onChange={handleTopicChange}
              rows={4}
              disabled={isProcessing}
              required
            />
            <div className={styles.hint}>
              <span className={styles.charCount}>
                {topic.length} 字符
              </span>
              {topic.trim().length > 0 && topic.trim().length < 5 && (
                <span className={styles.warning}>
                  题目至少需要 5 个字符
                </span>
              )}
            </div>
          </div>

          {/* Estimated Time */}
          {estimatedTime && (
            <GlassContainer className={styles.estimationCard} variant="light" padding="md">
              <div className={styles.estimationContent}>
                <div className={styles.estimationIcon}>⏱️</div>
                <div className={styles.estimationText}>
                  <div className={styles.estimationLabel}>预计完成时间</div>
                  <div className={styles.estimationValue}>{estimatedTime}</div>
                </div>
              </div>
              <p className={styles.estimationNote}>
                * 实际时间可能因题目复杂度和AI响应速度而有所不同
              </p>
            </GlassContainer>
          )}

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.startButton}
              disabled={!isFormValid || isAnalyzing || isProcessing}
            >
              {isAnalyzing ? (
                <>
                  <span className={styles.spinner}></span>
                  分析中...
                </>
              ) : isProcessing ? (
                <>
                  <span className={styles.processingIcon}>🚀</span>
                  写作进行中
                </>
              ) : (
                <>
                  <span className={styles.startIcon}>✨</span>
                  开始写作
                </>
              )}
            </button>
          </div>
        </form>

        {/* Features */}
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🤖</span>
            <div className={styles.featureText}>
              <div className={styles.featureTitle}>智能团队组建</div>
              <div className={styles.featureDesc}>根据题目自动分配AI角色</div>
            </div>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>💬</span>
            <div className={styles.featureText}>
              <div className={styles.featureTitle}>协作式写作</div>
              <div className={styles.featureDesc}>AI之间实时讨论和反馈</div>
            </div>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✅</span>
            <div className={styles.featureText}>
              <div className={styles.featureTitle}>质量把控</div>
              <div className={styles.featureDesc}>专业审稿团队全程监督</div>
            </div>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
}
