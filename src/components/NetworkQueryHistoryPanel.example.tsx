/**
 * Network Query History Panel Usage Examples
 */

import { NetworkQueryHistoryPanel } from './NetworkQueryHistoryPanel';
import type { SearchQueryRecord } from '../types/ai-client';

// ============================================================================
// Example 1: Basic Usage
// ============================================================================

const basicQueries: SearchQueryRecord[] = [
  {
    id: 'query-1',
    query: 'machine learning algorithms',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    results: [
      {
        title: 'Introduction to Machine Learning Algorithms',
        url: 'https://example.com/ml-intro',
        snippet: 'A comprehensive guide to understanding various machine learning algorithms...',
        source: 'example.com',
      },
      {
        title: 'Top 10 ML Algorithms Every Data Scientist Should Know',
        url: 'https://datasci.com/top-10-ml',
        snippet: 'Explore the most important machine learning algorithms used in industry...',
        source: 'datasci.com',
        publishedDate: new Date('2024-01-15'),
      },
    ],
    agentId: 'writer_1',
  },
  {
    id: 'query-2',
    query: 'neural network architectures',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    results: [
      {
        title: 'Understanding Neural Network Architectures',
        url: 'https://deeplearning.ai/architectures',
        snippet: 'Deep dive into various neural network architectures including CNNs, RNNs...',
        source: 'deeplearning.ai',
      },
    ],
    agentId: 'writer_2',
  },
];

export function BasicExample() {
  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <NetworkQueryHistoryPanel
        queries={basicQueries}
        onQuerySelect={(query) => console.log('Selected query:', query)}
      />
    </div>
  );
}

// ============================================================================
// Example 2: Empty State
// ============================================================================

export function EmptyStateExample() {
  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <NetworkQueryHistoryPanel
        queries={[]}
        onQuerySelect={(query) => console.log('Selected query:', query)}
      />
    </div>
  );
}

// ============================================================================
// Example 3: Multiple Agents with Rich Data
// ============================================================================

const richQueries: SearchQueryRecord[] = [
  {
    id: 'query-1',
    query: 'artificial intelligence research papers 2024',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    results: [
      {
        title: 'Latest AI Research Papers - January 2024',
        url: 'https://arxiv.org/list/cs.AI/2024-01',
        snippet: 'Browse the latest artificial intelligence research papers published in January 2024...',
        source: 'arxiv.org',
        publishedDate: new Date('2024-01-20'),
      },
      {
        title: 'Top AI Papers of 2024 - A Comprehensive Review',
        url: 'https://paperswithcode.com/2024-review',
        snippet: 'Comprehensive review of the most impactful AI research papers published this year...',
        source: 'paperswithcode.com',
        publishedDate: new Date('2024-01-18'),
      },
      {
        title: 'AI Research Trends in 2024',
        url: 'https://scholar.google.com/trends/ai-2024',
        snippet: 'Analysis of emerging trends in artificial intelligence research for 2024...',
        source: 'scholar.google.com',
      },
    ],
    agentId: 'decision_ai',
  },
  {
    id: 'query-2',
    query: 'deep learning frameworks comparison',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    results: [
      {
        title: 'PyTorch vs TensorFlow: A Comprehensive Comparison',
        url: 'https://towardsdatascience.com/pytorch-vs-tensorflow',
        snippet: 'Detailed comparison of the two most popular deep learning frameworks...',
        source: 'towardsdatascience.com',
        publishedDate: new Date('2024-01-10'),
      },
      {
        title: 'Choosing the Right Deep Learning Framework',
        url: 'https://machinelearningmastery.com/framework-guide',
        snippet: 'Guide to selecting the best deep learning framework for your project...',
        source: 'machinelearningmastery.com',
      },
    ],
    agentId: 'writer_1',
  },
  {
    id: 'query-3',
    query: 'transformer models explained',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    results: [
      {
        title: 'The Illustrated Transformer',
        url: 'https://jalammar.github.io/illustrated-transformer',
        snippet: 'Visual guide to understanding transformer models and attention mechanisms...',
        source: 'jalammar.github.io',
      },
      {
        title: 'Attention Is All You Need - Original Paper',
        url: 'https://arxiv.org/abs/1706.03762',
        snippet: 'The groundbreaking paper that introduced the transformer architecture...',
        source: 'arxiv.org',
        publishedDate: new Date('2017-06-12'),
      },
    ],
    agentId: 'writer_2',
  },
  {
    id: 'query-4',
    query: 'natural language processing techniques',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    results: [
      {
        title: 'Modern NLP Techniques and Applications',
        url: 'https://nlp.stanford.edu/techniques',
        snippet: 'Overview of state-of-the-art natural language processing techniques...',
        source: 'nlp.stanford.edu',
      },
    ],
    agentId: 'supervisor_ai',
  },
  {
    id: 'query-5',
    query: 'computer vision algorithms',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    results: [
      {
        title: 'Introduction to Computer Vision Algorithms',
        url: 'https://opencv.org/algorithms-intro',
        snippet: 'Comprehensive introduction to fundamental computer vision algorithms...',
        source: 'opencv.org',
      },
      {
        title: 'Advanced Computer Vision Techniques',
        url: 'https://paperswithcode.com/cv-techniques',
        snippet: 'Explore advanced techniques in computer vision including object detection...',
        source: 'paperswithcode.com',
        publishedDate: new Date('2024-01-05'),
      },
    ],
    agentId: 'writer_1',
  },
];

export function RichDataExample() {
  return (
    <div style={{ height: '800px', padding: '20px' }}>
      <NetworkQueryHistoryPanel
        queries={richQueries}
        onQuerySelect={(query) => {
          console.log('Selected query:', query);
          alert(`Selected: ${query.query}\nAgent: ${query.agentId}\nResults: ${query.results.length}`);
        }}
      />
    </div>
  );
}

// ============================================================================
// Example 4: Real-time Updates
// ============================================================================

import { useState, useEffect } from 'react';

export function RealTimeExample() {
  const [queries, setQueries] = useState<SearchQueryRecord[]>([]);

  useEffect(() => {
    // Simulate adding queries over time
    const interval = setInterval(() => {
      const newQuery: SearchQueryRecord = {
        id: `query-${Date.now()}`,
        query: `Sample query ${queries.length + 1}`,
        timestamp: new Date(),
        results: [
          {
            title: `Result for query ${queries.length + 1}`,
            url: `https://example.com/result-${queries.length + 1}`,
            snippet: 'This is a sample search result snippet...',
            source: 'example.com',
          },
        ],
        agentId: `agent_${Math.floor(Math.random() * 3) + 1}`,
      };

      setQueries(prev => [newQuery, ...prev]);
    }, 5000); // Add new query every 5 seconds

    return () => clearInterval(interval);
  }, [queries.length]);

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <NetworkQueryHistoryPanel
        queries={queries}
        onQuerySelect={(query) => console.log('Selected query:', query)}
      />
      <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
        New queries are added every 5 seconds
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Integration with Search Service
// ============================================================================

import { SearchServiceFactory } from '../services/searchService';
import type { SearchConfig } from '../services/searchService';

export function IntegratedExample() {
  const [queries, setQueries] = useState<SearchQueryRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Create search service
      const config: SearchConfig = {
        provider: 'tavily',
        apiKey: 'your-api-key',
        maxResults: 5,
      };

      const searchService = SearchServiceFactory.createSearchService(config);

      // Perform search
      const results = await searchService.search(searchQuery);

      // Add to history
      const newQuery: SearchQueryRecord = {
        id: `query-${Date.now()}`,
        query: searchQuery,
        timestamp: new Date(),
        results,
        agentId: 'user',
      };

      setQueries(prev => [newQuery, ...prev]);
      setSearchQuery('');
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed: ' + (error as Error).message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ height: '800px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          placeholder="Enter search query..."
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            background: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <NetworkQueryHistoryPanel
          queries={queries}
          onQuerySelect={(query) => console.log('Selected query:', query)}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Export All Examples
// ============================================================================

export default {
  BasicExample,
  EmptyStateExample,
  RichDataExample,
  RealTimeExample,
  IntegratedExample,
};
