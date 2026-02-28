import React from 'react';
import ActionButton from './ActionButton';
import './Header.css';

const Header = ({
  backendUrl,
  onBackendUrlChange,
  grammars,
  selectedGrammar,
  onGrammarSelect,
  onRefresh,
  refreshStatus,
  autoSave,
  onAutoSaveChange,
  onUpload,
  uploadStatus,
  onCompile,
  compileStatus,
  onDelete
}) => {
  return (
    <header className="app-header">
      <div className="header-section">
        <label className="header-label">Backend URL</label>
        <input
          type="text"
          className="backend-url-input"
          value={backendUrl}
          onChange={(e) => onBackendUrlChange(e.target.value)}
          placeholder="http://localhost:8080"
        />
      </div>

      <div className="header-section">
        <label className="header-label">Grammar</label>
        <div className="grammar-controls">
          <select
            className="grammar-select"
            value={selectedGrammar || ''}
            onChange={(e) => onGrammarSelect(e.target.value)}
          >
            <option value="" disabled>Select grammar...</option>
            {grammars.map((g) => (
              <option key={g.name} value={g.name}>
                {g.compiled ? '● ' : '○ '}{g.name}
              </option>
            ))}
            <option value="__new__" className="new-option">+ New...</option>
          </select>
          
          <ActionButton
            onClick={onRefresh}
            status={refreshStatus}
            disabled={refreshStatus === 'loading'}
          >
            ↻
          </ActionButton>

          {selectedGrammar && selectedGrammar !== '__new__' && (
            <button 
              className="delete-button"
              onClick={() => onDelete(selectedGrammar)}
              title="Delete grammar"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="header-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => onAutoSaveChange(e.target.checked)}
          />
          <span>Autosave</span>
        </label>
      </div>

      <div className="header-section">
        <ActionButton
          onClick={onUpload}
          onLongPress={() => onUpload(true)}
          status={uploadStatus}
          disabled={uploadStatus === 'loading'}
        >
          Upload
        </ActionButton>
        
        <ActionButton
          onClick={onCompile}
          onLongPress={() => onCompile(true)}
          status={compileStatus}
          disabled={compileStatus === 'loading'}
        >
          Compile
        </ActionButton>
      </div>
    </header>
  );
};

export default Header;