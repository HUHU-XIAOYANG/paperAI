/**
 * Error Boundary Component
 * Catches and displays errors in a user-friendly way
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { GlassContainer } from './GlassContainer';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <GlassContainer className={styles.errorContainer} variant="default" padding="xl">
            <div className={styles.errorIcon}>⚠️</div>
            <h1 className={styles.errorTitle}>应用程序遇到错误</h1>
            <p className={styles.errorMessage}>
              {this.state.error?.message || '未知错误'}
            </p>
            
            {this.state.error?.message.includes('提示词文件') && (
              <div className={styles.helpSection}>
                <h3 className={styles.helpTitle}>可能的解决方案：</h3>
                <ul className={styles.helpList}>
                  <li>确保 <code>prompts</code> 文件夹与应用程序在同一目录</li>
                  <li>检查 prompts 文件夹中是否包含所有必需的 .yaml 文件</li>
                  <li>确保提示词文件格式正确（YAML格式）</li>
                </ul>
              </div>
            )}
            
            <div className={styles.actions}>
              <button onClick={this.handleReload} className={styles.reloadButton}>
                🔄 重新加载应用
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className={styles.errorDetails}>
                <summary>技术详情（开发模式）</summary>
                <pre className={styles.errorStack}>
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </GlassContainer>
        </div>
      );
    }

    return this.props.children;
  }
}
