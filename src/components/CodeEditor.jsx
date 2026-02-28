import React, { useRef, useEffect, useState } from "react";
import "./CodeEditor.css";

const CodeEditor = ({
  value,
  onChange,
  placeholder,
  errorLines = [],
  selectedError = null,
  allowDrop,
  readOnly
}) => {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    const lines = value.split("\n").length;
    setLineCount(value);
  }, [value]);

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent browser from opening file directly
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(event.target.result);
    };
    reader.readAsText(file);
  };

  const getLineClassName = (lineNumber) => {
    const hasError = errorLines.includes(lineNumber);
    const isSelected = selectedError && selectedError.line === lineNumber;

    if (isSelected) return "line-number error-selected";
    if (hasError) return "line-number error-line";
    return "line-number";
  };

  const dropRelatedAttr = allowDrop?{onDragOver:(e) => handleDragOver(e),
        onDrop:(e) => handleDrop(e)}:{};

  return (
    <div className="code-editor">
      <div className="line-numbers" ref={lineNumbersRef}>
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} className={getLineClassName(i + 1)}>
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="code-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...dropRelatedAttr}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        readOnly={readOnly}
      />
    </div>
  );
};

export default CodeEditor;
