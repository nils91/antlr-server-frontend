import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import ActionButton from './components/ActionButton';
import Footer from './components/Footer';
import api from './utils/api';
import { useDebounce } from './hooks/useDebounce';
import './App.css';

function App() {
  // State
  const [backendUrl, setBackendUrl] = useState(window.location.origin);
  const [grammars, setGrammars] = useState([]);
  const [selectedGrammar, setSelectedGrammar] = useState(null);
  const [grammarText, setGrammarText] = useState('');
  const [inputText, setInputText] = useState('');
  const [startRule, setStartRule] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [autoParse, setAutoParse] = useState(false);
  
  // Flags
  const [uploadFlag, setUploadFlag] = useState(false);
  const [compileFlag, setCompileFlag] = useState(false);
  const [parseFlag, setParseFlag] = useState(false);
  
  // Status
  const [refreshStatus, setRefreshStatus] = useState('idle');
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [compileStatus, setCompileStatus] = useState('idle');
  const [parseStatus, setParseStatus] = useState('idle');
  
  // Parse results
  const [errors, setErrors] = useState([]);
  const [lispTree, setLispTree] = useState('');
  const [svgTree, setSvgTree] = useState('');
  const [selectedError, setSelectedError] = useState(null);

  // Update API base URL when changed
  useEffect(() => {
    api.setBaseURL(backendUrl);
  }, [backendUrl]);

  // Auto-upload after 10s of grammar edit
  const [triggerAutoUpload] = useDebounce(async () => {
    if (autoSave && uploadFlag) {
      await performUpload(false);
    }
  }, 10000);

  // Auto-compile after 50s of grammar edit
  const [triggerAutoCompile] = useDebounce(async () => {
    if (autoSave && compileFlag) {
      if (uploadFlag) {
        await performUpload(false);
      }
      if (selectedGrammar && selectedGrammar !== '__new__') {
        await performCompile(false);
      }
    }
  }, 50000);

  // Auto-parse after 10s of input edit
  const [triggerAutoParse] = useDebounce(async () => {
    if (autoParse && parseFlag) {
      await performParse(false);
    }
  }, 10000);

  // Refresh grammars list
  const refreshGrammars = async () => {
    setRefreshStatus('loading');
    try {
      const grammarNames = await api.listGrammars();
      const grammarsWithStatus = await Promise.all(
        grammarNames.map(async (name) => {
          try {
            const compiled = await api.grammarCompiled(name);
            return { name, compiled };
          } catch {
            return { name, compiled: false };
          }
        })
      );
      setGrammars(grammarsWithStatus);
      setRefreshStatus('success');
    } catch (error) {
      console.error('Refresh failed:', error);
      setRefreshStatus('error');
    }
  };

  // Load grammar and associated data
  const loadGrammar = async (name) => {
    if (name === '__new__') {
      setGrammarText('');
      setInputText('');
      setStartRule('');
      setErrors([]);
      setLispTree('');
      setSvgTree('');
      return;
    }

    try {
      const grammar = await api.getGrammar(name);
      setGrammarText(grammar);

      // Try to load parse results
      try {
        const input = await api.getLastInput(name);
        setInputText(input);
      } catch {}

      try {
        const errorList = await api.getErrors(name);
        setErrors(errorList);
      } catch {}

      try {
        const lisp = await api.getTreeLisp(name);
        setLispTree(lisp);
      } catch {}

      try {
        const svg = await api.getTreeSvg(name);
        setSvgTree(svg);
      } catch {}
    } catch (error) {
      console.error('Failed to load grammar:', error);
    }
  };

  // Perform upload
  const performUpload = async (force = false) => {
    if (!force && !uploadFlag) return;
    
    setUploadStatus('loading');
    try {
      if (selectedGrammar === '__new__') {
        const name = await api.uploadGrammar(grammarText);
        setSelectedGrammar(name);
        await refreshGrammars();
      } else if (selectedGrammar) {
        await api.overwriteGrammar(selectedGrammar, grammarText);
        await refreshGrammars();
      }
      setUploadFlag(false);
      setUploadStatus('success');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
    }
  };

  // Perform compile
  const performCompile = async (force = false) => {
    if (!force && !compileFlag) return;
    if (!selectedGrammar || selectedGrammar === '__new__') return;

    if (uploadFlag) {
      await performUpload(false);
    }

    setCompileStatus('loading');
    try {
      await api.compileGrammar(selectedGrammar);
      setCompileFlag(false);
      setCompileStatus('success');
      await refreshGrammars();
    } catch (error) {
      console.error('Compile failed:', error);
      setCompileStatus('error');
    }
  };

  // Perform parse
  const performParse = async (force = false) => {
    if (!force && !parseFlag) return;
    if (!selectedGrammar || selectedGrammar === '__new__') return;
    if (!startRule.trim()) return;

    // Ensure grammar is uploaded and compiled
    if (uploadFlag) {
      await performUpload(false);
    }
    if (compileFlag) {
      await performCompile(false);
    }

    setParseStatus('loading');
    try {
      await api.parse(selectedGrammar, startRule, inputText);
      
      // Fetch results
      const [errorList, lisp, svg] = await Promise.all([
        api.getErrors(selectedGrammar).catch(() => []),
        api.getTreeLisp(selectedGrammar).catch(() => ''),
        api.getTreeSvg(selectedGrammar).catch(() => '')
      ]);

      setErrors(errorList);
      setLispTree(lisp);
      setSvgTree(svg);
      setParseFlag(false);
      setParseStatus('success');
    } catch (error) {
      console.error('Parse failed:', error);
      setErrors([]);
      setLispTree('');
      setSvgTree('');
      setParseStatus('error');
    }
  };

  // Handle grammar text change
  const handleGrammarChange = (text) => {
    setGrammarText(text);
    setUploadFlag(true);
    setCompileFlag(true);
    if (autoSave) {
      triggerAutoUpload();
      triggerAutoCompile();
    }
  };

  // Handle input text change
  const handleInputChange = (text) => {
    setInputText(text);
    setParseFlag(true);
    if (autoParse) {
      triggerAutoParse();
    }
  };

  // Handle grammar selection
  const handleGrammarSelect = async (name) => {
    setSelectedGrammar(name);
    await loadGrammar(name);
    setUploadFlag(false);
    setCompileFlag(false);
    setParseFlag(false);
  };

  // Handle grammar deletion
  const handleDeleteGrammar = async (name) => {
    if (!confirm(`Delete grammar "${name}"?`)) return;
    
    try {
      await api.deleteGrammar(name);
      await refreshGrammars();
      if (selectedGrammar === name) {
        setSelectedGrammar(null);
        setGrammarText('');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Initial refresh
  useEffect(() => {
    refreshGrammars();
  }, []);

  // Get error lines for highlighting
  const errorLines = errors.map(e => e.line);

  return (
    <div className="app">
      <Header
        backendUrl={backendUrl}
        onBackendUrlChange={setBackendUrl}
        grammars={grammars}
        selectedGrammar={selectedGrammar}
        onGrammarSelect={handleGrammarSelect}
        onRefresh={refreshGrammars}
        refreshStatus={refreshStatus}
        autoSave={autoSave}
        onAutoSaveChange={setAutoSave}
        onUpload={performUpload}
        uploadStatus={uploadStatus}
        onCompile={performCompile}
        compileStatus={compileStatus}
        onDelete={handleDeleteGrammar}
      />

      <div className="main-content">
        <div className="editor-panel">
          <div className="panel-header">Grammar</div>
          <CodeEditor
            value={grammarText}
            onChange={handleGrammarChange}
            placeholder="Enter your ANTLR grammar here..."
            allowDrop
          />
        </div>

        <div className="editor-panel">
          <div className="panel-header">Input</div>
          <CodeEditor
            value={inputText}
            onChange={handleInputChange}
            placeholder="Enter input to parse..."
            errorLines={errorLines}
            selectedError={selectedError}
            allowDrop
            disabled={(!grammarText||grammarText==="")}
          />
          <div className="input-controls">
            <input
              type="text"
              className="start-rule-input"
              value={startRule}
              onChange={(e) => setStartRule(e.target.value)}
              placeholder="Start rule..."
              disabled={(!grammarText||grammarText==="")}
            />
            <ActionButton
              onClick={() => performParse(false)}
              onLongPress={() => performParse(true)}
              status={parseStatus}
              disabled={parseStatus === 'loading'}
              variant="primary"
            >
              Parse
            </ActionButton>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoParse}
                onChange={(e) => setAutoParse(e.target.checked)}
              />
              <span>Auto-parse</span>
            </label>
          </div>
        </div>
      </div>

      <Footer
        errors={errors}
        lispTree={lispTree}
        svgTree={svgTree}
        onErrorSelect={setSelectedError}
      />
    </div>
  );
}

export default App;