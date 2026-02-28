import React, { useState, useRef, useEffect } from 'react';
import './Footer.css';

const Footer = ({ errors = [], lispTree = '', svgTree = '', onErrorSelect }) => {
  const [activeTab, setActiveTab] = useState('errors');
  const [svgScale, setSvgScale] = useState(1);
  const [svgPosition, setSvgPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgContainerRef = useRef(null);

  useEffect(() => {
    // Reset SVG position when new tree loads
    setSvgScale(1);
    setSvgPosition({ x: 0, y: 0 });
  }, [svgTree]);

  const handleWheel = (e) => {
    if (activeTab !== 'svg') return;
    e.preventDefault();
    
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.1, svgScale + delta), 5);
    setSvgScale(newScale);
  };

  const handleMouseDown = (e) => {
    if (activeTab !== 'svg') return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - svgPosition.x,
      y: e.clientY - svgPosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setSvgPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <footer className="app-footer">
      <div className="footer-tabs">
        <button
          className={`tab ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          Errors {errors.length > 0 && <span className="badge">{errors.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'lisp' ? 'active' : ''}`}
          onClick={() => setActiveTab('lisp')}
        >
          Lisp Tree
        </button>
        <button
          className={`tab ${activeTab === 'svg' ? 'active' : ''}`}
          onClick={() => setActiveTab('svg')}
        >
          SVG Tree
        </button>
      </div>

      <div className="footer-content">
        {activeTab === 'errors' && (
          <div className="errors-panel">
            {errors.length === 0 ? (
              <div className="empty-state">No errors</div>
            ) : (
              <div className="errors-list">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="error-item"
                    onClick={() => onErrorSelect(error)}
                  >
                    <span className="error-location">Line {error.line}:{error.col}</span>
                    <span className="error-message">{error.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'lisp' && (
          <div className="lisp-panel">
            {lispTree ? (
              <pre className="lisp-tree">{lispTree}</pre>
            ) : (
              <div className="empty-state">No parse tree available</div>
            )}
          </div>
        )}

        {activeTab === 'svg' && (
          <div
            className="svg-panel"
            ref={svgContainerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
          >
            {svgTree ? (
              <div
                className="svg-container"
                style={{
                  transform: `translate(${svgPosition.x}px, ${svgPosition.y}px) scale(${svgScale})`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                dangerouslySetInnerHTML={{ __html: svgTree }}
              />
            ) : (
              <div className="empty-state">No parse tree available</div>
            )}
            {svgTree && (
              <div className="svg-controls">
                <button onClick={() => setSvgScale(s => Math.min(s + 0.2, 5))}>+</button>
                <span>{Math.round(svgScale * 100)}%</span>
                <button onClick={() => setSvgScale(s => Math.max(s - 0.2, 0.1))}>−</button>
                <button onClick={() => { setSvgScale(1); setSvgPosition({ x: 0, y: 0 }); }}>
                  Reset
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;