import React, { useState, useEffect, useRef } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import Header from "./components/Header";
import CodeEditor from "./components/CodeEditor";
import InputParseControls from "./components/InputParseControls";
import ActionButton from "./components/ActionButton";
import Footer from "./components/Footer";
import api from "./utils/api";
import { useDebounce } from "./hooks/useDebounce";
import { useLatestValue } from "./hooks/useLatestValue";
import "./App.css";

function App() {
  // State
  const [backendUrl, setBackendUrl] = useState(window.location.origin);
  const [grammars, setGrammars] = useState([]);
  const [selectedGrammar, setSelectedGrammar] = useState(null);
  const selectedGrammarRef=useLatestValue(selectedGrammar);
  const [grammarText, setGrammarText] = useState("");
  const grammarTextRef=useLatestValue(grammarText);
  const [inputText, setInputText] = useState("");
  const [startRule, setStartRule] = useState("");
  const [autoSave, setAutoSave] = useState(false);
  const [autoParse, setAutoParse] = useState(false);
  const [uploadBlocked, setUploadBlocked] = useState(true);
  const uploadBlockedRef=useLatestValue(uploadBlocked);
  const [lastGrammarChangeMs, setLastGrammarChangeMs] = useState(Date.now);
  const lastGrammarChangeMsRef=useLatestValue(lastGrammarChangeMs);

  // Flags
  const [uploadFlag, setUploadFlag] = useState(false);
  const uploadFlagRef=useLatestValue(uploadFlag);
  const [renameFlag, setRenameFlag] = useState(false);
  const renameFlagRef=useLatestValue(renameFlag);
  const [generateFlag, setGenerateFlag] = useState(false);
  const [compileFlag, setCompileFlag] = useState(false);
  const [parseFlag, setParseFlag] = useState(false);

  //timer intervals
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(5000);
  const [uploadCheckIntervalMs, setUploadCheckIntervalMs] = useState(5000);

  // Status
  const [refreshStatus, setRefreshStatus] = useState("idle");
  const refreshStatusRef=useLatestValue(refreshStatus);

  const [uploadStatus, setUploadStatus] = useState("idle");
  const [compileStatus, setCompileStatus] = useState("idle");
  const [parseStatus, setParseStatus] = useState("idle");

  // Parse results
  const [errors, setErrors] = useState([]);
  const [lispTree, setLispTree] = useState("");
  const [svgTree, setSvgTree] = useState("");
  const [selectedError, setSelectedError] = useState(null);

  // Update API base URL when changed and reset refresh interval
  useEffect(() => {
    api.setBaseURL(backendUrl);
    setRefreshIntervalMs(5000);
    setUploadCheckIntervalMs(5000);
  }, [backendUrl]);

  useEffect(() => {
    const refreshTimer = setInterval(
      () => refreshGrammars(),
      refreshIntervalMs,
    );
    return () => clearInterval(refreshTimer);
  }, [refreshIntervalMs]);

  // Refresh grammars list
  const refreshGrammars = async () => {
    console.log("Refresh status: " + refreshStatusRef.current);
    if (refreshStatusRef.current !== "loading") {
      console.log("Refreshing");
      setRefreshStatus("loading");
      try {
        const grammarNamesList = await api.listGrammars();
        console.log(grammarNamesList);
        const grammarsWithStatus = await Promise.all(
          grammarNamesList.map(async (name) => {
            try {
              const compiled = await api.grammarCompiled(name);
              return { name, compiled };
            } catch {
              return { name, compiled: false };
            }
          }),
        );
        setGrammars(grammarsWithStatus);
        setRefreshStatus("success");
        setRefreshIntervalMs(5000);
      } catch (error) {
        console.error("Refresh failed:", error);
        setRefreshStatus("error");
        setRefreshIntervalMs(30000);
      }
    }
  };

  // Load grammar and associated data
  const loadGrammar = async (name) => {
    if (name === "__new__") {
      setGrammarText("");
      setInputText("");
      setStartRule("");
      setErrors([]);
      setLispTree("");
      setSvgTree("");
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
      console.error("Failed to load grammar:", error);
    }
  };

  useEffect(() => {
    const uploadTimer = setInterval(() => checkUpload(), uploadCheckIntervalMs);
    return () => clearInterval(uploadTimer);
  }, [uploadCheckIntervalMs]);

  useEffect(() => {
   console.log(lastGrammarChangeMs)
  }, [lastGrammarChangeMs]);

  useEffect(() => {
   console.log(uploadFlag)
  }, [uploadFlag]);

  const checkUpload = async (force = false) => {
    const newGrammarName=getANTLRGrammarName(grammarTextRef.current);
    if(newGrammarName&&selectedGrammarRef.current!==newGrammarName&&selectedGrammarRef.grammar!=="__new__"){
      console.log(selectedGrammarRef.current,"->",newGrammarName);
    }
    const currentTimeMs = Date.now();
    const lapsed = currentTimeMs - lastGrammarChangeMsRef.current;
    if ((lapsed >= 2000 && !uploadBlockedRef.current && uploadFlagRef.current) || force) {
      setUploadBlocked(true);
      try {
        console.log("Attempting upload to ",selectedGrammarRef.current);
        if (selectedGrammarRef.current === "__new__") {
          const name = await api.uploadGrammar(grammarTextRef.current);
          setSelectedGrammar(name);
          await refreshGrammars();
        } else if (selectedGrammarRef.current) {
          await api.overwriteGrammar(selectedGrammar, grammarTextRef.current);
          await refreshGrammars();
        }
        setUploadFlag(false);
        setUploadCheckIntervalMs(5000);
      } catch (error) {
        setUploadCheckIntervalMs(30000);
      }
      setUploadBlocked(false);
    }
  };

  // Perform upload
  const performUpload = async (force = false) => {
    if (!force && !uploadFlag) return;

    setUploadStatus("loading");
    try {
      setUploadStatus("success");
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("error");
    }
  };

  // Perform compile
  const performCompile = async (force = false) => {
    if (!force && !compileFlag) return;
    if (!selectedGrammar || selectedGrammar === "__new__") return;

    if (uploadFlag) {
      await performUpload(false);
    }

    setCompileStatus("loading");
    try {
      await api.compileGrammar(selectedGrammar);
      setCompileFlag(false);
      setCompileStatus("success");
      await refreshGrammars();
    } catch (error) {
      console.error("Compile failed:", error);
      setCompileStatus("error");
    }
  };

  // Perform parse
  const performParse = async (force = false) => {
    if (!force && !parseFlag) return;
    if (!selectedGrammar || selectedGrammar === "__new__") return;
    if (!startRule.trim()) return;

    // Ensure grammar is uploaded and compiled
    if (uploadFlag) {
      await performUpload(false);
    }
    if (compileFlag) {
      await performCompile(false);
    }

    setParseStatus("loading");
    try {
      await api.parse(selectedGrammar, startRule, inputText);

      // Fetch results
      const [errorList, lisp, svg] = await Promise.all([
        api.getErrors(selectedGrammar).catch(() => []),
        api.getTreeLisp(selectedGrammar).catch(() => ""),
        api.getTreeSvg(selectedGrammar).catch(() => ""),
      ]);

      setErrors(errorList);
      setLispTree(lisp);
      setSvgTree(svg);
      setParseFlag(false);
      setParseStatus("success");
    } catch (error) {
      console.error("Parse failed:", error);
      setErrors([]);
      setLispTree("");
      setSvgTree("");
      setParseStatus("error");
    }
  };

  function getANTLRGrammarName(text){
    const match=text.match(/grammar\s*(.+?)(;|\s|$)/)
    if(match&&match.length>1){
      return match[1];
    }
    return null;
  }

  // Handle grammar text change
  const handleGrammarChange = (text) => {
    const newgrammarName=getANTLRGrammarName(text)
    console.log(newgrammarName)
    setGrammarText(text);
    setUploadBlocked(true);
    setUploadFlag(true);
    setGenerateFlag(true);
    setCompileFlag(true);
    setParseFlag(true);
    setLastGrammarChangeMs(Date.now());
    setTimeout(() => {
      setUploadBlocked(false);
      checkUpload();
    }, 2500);
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
        setGrammarText("");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // Initial refresh
  useEffect(() => {
    refreshGrammars();
  }, []);

  const handleGrammarEditorKeyPress = (e) => {
    if (e.shiftKey&& e.key === "Enter") {
      e.preventDefault();
      checkUpload(true);
    }
  };

  // Get error lines for highlighting
  const errorLines = errors.map((e) => e.line);

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
      <Group className="min-h-30" orientation="vertical">
        <Panel defaultSize="80%">
          <Group orientation="horizontal" className="main-content">
            <Panel defaultSize="50%" className="editor-panel">
              <div className="panel-header">Grammar</div>
              <CodeEditor
                value={grammarText}
                onChange={handleGrammarChange}
                onKeyDown={handleGrammarEditorKeyPress}
                placeholder="Enter your ANTLR grammar here..."
                allowDrop
              />
            </Panel>
            <Separator />
            <Panel defaultSize="50%" className="editor-panel">
              <div className="panel-header">Input</div>
              <CodeEditor
                value={inputText}
                onChange={handleInputChange}
                placeholder="Enter input to parse..."
                errorLines={errorLines}
                selectedError={selectedError}
                allowDrop
                disabled={!grammarText || grammarText === ""}
              />
              <InputParseControls
                startRule={startRule}
                onStartRuleChange={setStartRule}
                performParse={performParse}
                autoParse={autoParse}
                onAutoParseChange={setAutoParse}
                disabled={!grammarText || grammarText === ""}
              />
            </Panel>
          </Group>
        </Panel>
        <Separator />
        <Panel defaultSize="20%">
          <Footer
            errors={errors}
            lispTree={lispTree}
            svgTree={svgTree}
            onErrorSelect={setSelectedError}
          />
        </Panel>
      </Group>
    </div>
  );
}

export default App;
