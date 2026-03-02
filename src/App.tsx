import "./App.css";
import { useState } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { MainWorkspaceView } from './views/MainWorkspaceView';
import { TopicInputView } from './views/TopicInputView';
import { ConfigurationView } from './views/ConfigurationView';
import { useSystemStore } from './stores/systemStore';

type ViewType = 'topic-input' | 'workspace' | 'config';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('topic-input');
  const currentPhase = useSystemStore((state) => state.currentPhase);
  const startProcess = useSystemStore((state) => state.startProcess);

  // Handle starting writing process
  const handleStartWriting = (topic: string) => {
    startProcess(topic);
    setCurrentView('workspace');
  };

  // Handle opening configuration
  const handleOpenConfig = () => {
    setCurrentView('config');
  };

  // Handle closing configuration
  const handleCloseConfig = () => {
    setCurrentView(currentPhase === 'idle' ? 'topic-input' : 'workspace');
  };

  return (
    <div className="app">
      {/* Top Navigation Bar */}
      <TopNavBar onConfigClick={handleOpenConfig} />

      {/* Main Content Area */}
      <main className="app-content">
        {currentView === 'topic-input' && (
          <TopicInputView onStartWriting={handleStartWriting} />
        )}
        
        {currentView === 'workspace' && (
          <MainWorkspaceView />
        )}
        
        {currentView === 'config' && (
          <ConfigurationView onClose={handleCloseConfig} />
        )}
      </main>
    </div>
  );
}

export default App;
