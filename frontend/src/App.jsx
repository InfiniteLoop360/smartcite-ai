import React, { useState } from 'react';

function App() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("apa");
  const [citation, setCitation] = useState("");
  const [bibtex, setBibtex] = useState("");
  const [showBibtex, setShowBibtex] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Search States
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- 1. RECENT HISTORY STATE ---
  const [history, setHistory] = useState(() => {
  // This runs only ONCE when the component first mounts
  const savedHistory = localStorage.getItem("citeHistory");
  try {
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
});

  // Reset the app
  const handleClear = () => {
    setInput("");
    setCitation("");
    setBibtex("");
    setShowBibtex(false);
    setSearchResults([]);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- 3. HELPER TO ADD TO HISTORY ---
  const addToHistory = (formattedText, currentStyle) => {
    const newEntry = {
      id: Date.now(),
      text: formattedText,
      style: currentStyle,
      timestamp: new Date().toLocaleTimeString()
    };
    // Keep only the last 5 citations
    const updatedHistory = [newEntry, ...history].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem("citeHistory", JSON.stringify(updatedHistory));
  };

  const downloadCitation = () => {
    const element = document.createElement("a");
    const file = new Blob([`Citation (${style}):\n${citation}\n\nBibTeX:\n${bibtex}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "citation.txt";
    document.body.appendChild(element);
    element.click();
  };

  // Handle Topic Search
  const handleSearch = async () => {
    if (!input) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const response = await fetch(`http://127.0.0.1:8000/search?query=${encodeURIComponent(input)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.results);
      } else {
        alert("No papers found for this topic.");
      }
    } catch (error) {
      console.error("Search Error:", error);
      alert("Search failed.");
    }
    setIsSearching(false);
  };

  const handleGenerate = async () => {
    if (!input) return;
    setLoading(true);
    setCitation("");
    setSearchResults([]); 
    try {
      const response = await fetch(`http://127.0.0.1:8000/cite?source=${encodeURIComponent(input)}&style=${style}`);
      const data = await response.json();
      if (response.ok) {
        setCitation(data.formatted);
        setBibtex(data.bibtex || "");
        // Add to history
        addToHistory(data.formatted, styleLabels[style]);
      } else {
        alert(data.detail || "Error");
      }
    } catch (error) {
      console.error("Manual Cite Error:", error);
      alert("Backend offline!");
    }
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files; 
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`http://127.0.0.1:8000/upload?style=${style}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setCitation(data.formatted);
        setBibtex(data.bibtex || "");
        setInput(data.doi || "");
        // Add to history
        addToHistory(data.formatted, styleLabels[style]);
      } else {
        alert(data.detail || "No DOI found.");
      }
    } catch (error) {
      console.error("PDF Upload Error:", error);
      alert("Upload failed.");
    }
    setLoading(false);
  };

  const styleLabels = {
    "apa": "APA (7th Ed.)",
    "modern-language-association": "MLA (9th Ed.)",
    "chicago-author-date": "Chicago",
    "harvard-cite-them-right": "Harvard",
    "vancouver": "Vancouver"
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("citeHistory");
  };

  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      maxWidth: '550px',
      margin: '80px auto',
      padding: '40px',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      backgroundColor: '#ffffff',
      color: '#1e293b'
    }}>

      {/* Header */}
<div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
  {/* Logo Addition */}
  <img 
    src="/favicon.ico" 
    alt="SmartCite AI Logo" 
    style={{ 
      width: '64px', 
      height: '64px', 
      marginBottom: '16px',
      borderRadius: '14px', /* Optional: gives your logo smooth, rounded corners */
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' /* Optional: subtle glow effect */
    }} 
  />
  
  <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', margin: 0, color: '#0f172a' }}>
    SmartCite <span style={{ color: '#3b82f6' }}>AI</span>
  </h1>
  <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>Intelligent Citation Generator - Instant Academic Referencing</p>
</div>

      {/* Input Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Source Input</label>
          <button
            onClick={handleClear}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textDecoration: 'underline' }}
          >
            Clear Fields
          </button>
        </div>

        {/* Input with Search Icon */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Paste DOI/URL or type a Topic..."
            style={{
              width: '100%',
              padding: '16px 50px 16px 16px',
              boxSizing: 'border-box',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontSize: '15px',
              outline: 'none',
              backgroundColor: '#f8fafc',
              color: '#1e293b'
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#3b82f6',
              padding: '5px'
            }}
          >
            {isSearching ? "..." : "🔍"}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            marginTop: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 100,
            maxHeight: '280px',
            overflowY: 'auto'
          }}>
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => {
                  setInput(result.doi);
                  setSearchResults([]);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: index !== searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{result.title}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{result.publisher} • {result.year}</div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            style={{
              flex: '1.5',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {Object.keys(styleLabels).map(s => <option key={s} value={s}>{styleLabels[s]}</option>)}
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{ flex: '1', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            {loading ? "..." : "Cite Now"}
          </button>

          <input type="file" id="pdf-upload" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
          <label
            htmlFor="pdf-upload"
            style={{ flex: '0.8', padding: '12px', backgroundColor: '#10b981', color: 'white', textAlign: 'center', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            PDF
          </label>
        </div>
      </div>

      {/* Result Card */}
      {citation && (
        <div style={{
          marginTop: '32px',
          backgroundColor: '#f1f5f9',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {styleLabels[style]} Result
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={downloadCitation} style={{ fontSize: '12px', cursor: 'pointer', padding: '6px 10px', color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600' }}>Save</button>
              <button onClick={() => handleCopy(citation)} style={{ fontSize: '12px', cursor: 'pointer', padding: '6px 10px', color: '#fff', background: '#3b82f6', border: 'none', borderRadius: '6px', fontWeight: '600' }}>Copy</button>
            </div>
          </div>

          <p style={{ lineHeight: '1.6', color: '#1e293b', fontSize: '15px', margin: 0, fontWeight: '400' }}>
            {citation}
          </p>

          {copied && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>✓ Copied to clipboard</div>
          )}

          <div style={{ marginTop: '20px', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
            <button
              onClick={() => setShowBibtex(!showBibtex)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}
            >
              {showBibtex ? "− Hide BibTeX" : "+ Show BibTeX code"}
            </button>

            {showBibtex && (
              <pre
                onClick={() => handleCopy(bibtex)}
                style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '12px', fontSize: '12px', marginTop: '12px', overflowX: 'auto', cursor: 'pointer', lineHeight: '1.5' }}
              >
                {bibtex || "% Metadata not found"}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Recent History Section */}
      {history.length > 0 && (
        <div style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', margin: 0, textTransform: 'uppercase' }}>Recent History</h3>
            <button onClick={clearHistory} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>Clear History</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleCopy(item.text)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  border: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  transition: '0.2s',
                  position: 'relative'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
              >
                <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: '700', marginBottom: '4px' }}>{item.style} • {item.timestamp}</div>
                <div style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;