/**
 * Top Navigation Bar Component
 * Implements Requirement 10.3: Theme switching and navigation
 * 
 * Features:
 * - System title and status display
 * - Theme toggle button
 * - Configuration entry button
 * - Glass morphism styling
 */

import { GlassContainer } from './GlassContainer';
import { ThemeToggle } from './ThemeToggle';
import { useSystemStore } from '../stores/systemStore';
import styles from './TopNavBar.module.css';

export interface TopNavBarProps {
  /** Callback when configuration button is clicked */
  onConfigClick?: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Top Navigation Bar Component
 * 
 * Displays system title, current status, theme toggle, and configuration button.
 * 
 * @example
 * ```tsx
 * <TopNavBar onConfigClick={() => setShowConfig(true)} />
 * ```
 */
export function TopNavBar({ onConfigClick, className = '' }: TopNavBarProps) {
  const { currentPhase, currentTopic } = useSystemStore();

  // Get phase display name
  const getPhaseDisplay = (phase: string): string => {
    const phaseNames: Record<string, string> = {
      idle: '空闲',
      initialization: '初始化',
      task_allocation: '任务分配',
      writing: '写作中',
      internal_review: '内部审查',
      peer_review: '同行评审',
      revision: '修订中',
      final_review: '最终审查',
      completed: '已完成',
      rejected: '已退稿',
    };
    return phaseNames[phase] || phase;
  };

  // Get phase color
  const getPhaseColor = (phase: string): string => {
    const colors: Record<string, string> = {
      idle: 'var(--color-text-secondary)',
      initialization: 'var(--color-info)',
      task_allocation: 'var(--color-info)',
      writing: 'var(--color-accent)',
      internal_review: 'var(--color-warning)',
      peer_review: 'var(--color-warning)',
      revision: 'var(--color-warning)',
      final_review: 'var(--color-warning)',
      completed: 'var(--color-success)',
      rejected: 'var(--color-error)',
    };
    return colors[phase] || 'var(--color-text-secondary)';
  };

  return (
    <GlassContainer
      className={`${styles.topNavBar} ${className}`}
      variant="strong"
      padding="md"
      radius="lg"
    >
      <div className={styles.content}>
        {/* Left section: Title and status */}
        <div className={styles.leftSection}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Agent Swarm</h1>
            <span className={styles.subtitle}>多智能体写作系统</span>
          </div>
          
          <div className={styles.statusSection}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>状态:</span>
              <span
                className={styles.statusValue}
                style={{ color: getPhaseColor(currentPhase) }}
              >
                {getPhaseDisplay(currentPhase)}
              </span>
            </div>
            
            {currentTopic && (
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>题目:</span>
                <span className={styles.statusValue} title={currentTopic}>
                  {currentTopic.length > 30
                    ? `${currentTopic.substring(0, 30)}...`
                    : currentTopic}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right section: Actions */}
        <div className={styles.rightSection}>
          <ThemeToggle showLabel />
          
          <button
            className={styles.configButton}
            onClick={onConfigClick}
            title="系统配置"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.25 12.5a1.25 1.25 0 00.25.75l.05.05a1.517 1.517 0 010 2.15 1.517 1.517 0 01-2.15 0l-.05-.05a1.25 1.25 0 00-.75-.25 1.25 1.25 0 00-1.25 1.25v.15a1.5 1.5 0 01-3 0v-.08a1.25 1.25 0 00-.82-1.17 1.25 1.25 0 00-.75.25l-.05.05a1.517 1.517 0 01-2.15 0 1.517 1.517 0 010-2.15l.05-.05a1.25 1.25 0 00.25-.75 1.25 1.25 0 00-1.25-1.25h-.15a1.5 1.5 0 010-3h.08a1.25 1.25 0 001.17-.82 1.25 1.25 0 00-.25-.75l-.05-.05a1.517 1.517 0 010-2.15 1.517 1.517 0 012.15 0l.05.05a1.25 1.25 0 00.75.25h.06a1.25 1.25 0 001.25-1.25v-.15a1.5 1.5 0 013 0v.08a1.25 1.25 0 001.25 1.17h.06a1.25 1.25 0 00.75-.25l.05-.05a1.517 1.517 0 012.15 0 1.517 1.517 0 010 2.15l-.05.05a1.25 1.25 0 00-.25.75v.06a1.25 1.25 0 001.25 1.25h.15a1.5 1.5 0 010 3h-.08a1.25 1.25 0 00-1.17 1.25z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.buttonLabel}>配置</span>
          </button>
        </div>
      </div>
    </GlassContainer>
  );
}
