import React, { useState, useEffect, useRef } from "react";
import ActionButton from "./ActionButton";
import "./InputParseControls.css";

const InputParseControls = ({
  startRule,
  onStartRuleChange,
  disabled,
  performParse,
  autoParse,
  parseStatus,
  onAutoParseChange,
}) => {
  return (
    <div className={`input-controls ${disabled ? "is-disabled" : ""}`}>
      <input
        type="text"
        className="start-rule-input"
        value={startRule}
        onChange={(e) => onStartRuleChange(e.target.value)}
        placeholder="Start rule..."
        disabled={disabled}
      />
      <ActionButton
        onClick={() => performParse(false)}
        onLongPress={() => performParse(true)}
        status={parseStatus}
        disabled={startRule === "" || parseStatus === "loading"}
        variant="primary"
      >
        Parse
      </ActionButton>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={autoParse}
          onChange={(e) => onAutoParseChange(e.target.checked)}
          disabled={disabled}
        />
        <span>Auto-parse</span>
      </label>
    </div>
  );
};

export default InputParseControls;
