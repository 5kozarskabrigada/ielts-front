import React, { useState, useRef, useEffect } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { 
  ChevronDown, ChevronUp, Plus, Trash2, Mic, Play, Pause, CheckCircle, 
  HelpCircle, ListChecks, ArrowRightLeft, MapPin, FileText, 
  StickyNote, Type, MessageSquare, Settings, Eye, EyeOff
} from "lucide-react";

// ============================================
// QUESTION TYPE DEFINITIONS
// ============================================
const QUESTION_TYPES = [
  { 
    value: "multiple_choice", 
    label: "Multiple Choice", 
    icon: ListChecks, 
    hint: "Choose ONE correct answer (A, B, C or A, B, C, D)"
  },
  { 
    value: "matching", 
    label: "Matching", 
    icon: ArrowRightLeft, 
    hint: "Match numbered items to lettered options (shared options list)"
  },
  { 
    value: "form_completion", 
    label: "Form/Table Completion", 
    icon: FileText, 
    hint: "Fill in blanks in a form or table structure"
  },
  { 
    value: "sentence_completion", 
    label: "Sentence Completion", 
    icon: Type, 
    hint: "Complete sentences with words from the audio"
  },
  { 
    value: "note_completion", 
    label: "Note/Summary Completion", 
    icon: StickyNote, 
    hint: "Complete notes, summary, or flow-chart"
  },
  { 
    value: "map_labeling", 
    label: "Map/Plan/Diagram Labelling", 
    icon: MapPin, 
    hint: "Label locations on a map, plan, or diagram"
  },
  { 
    value: "short_answer", 
    label: "Short-Answer Questions", 
    icon: MessageSquare, 
    hint: "Answer questions with words or numbers from the audio"
  },
];

// ============================================
// STYLED COMPONENTS
// ============================================
const Input = ({ label, hint, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <input
      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition"
      {...props}
    />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const TextArea = ({ label, hint, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <textarea
      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition resize-none"
      {...props}
    />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Select = ({ label, hint, options, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <select
      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition"
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

// ============================================
// WYSIWYG RICH TEXT EDITOR (No HTML tags visible)
// ============================================
const RichTextArea = ({ label, hint, className = "", value = "", onChange, showBlankButton = true, ...props }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Sync HTML content when value changes externally
  useEffect(() => {
    if (editorRef.current && !isFocused) {
      // Only update if content actually differs to avoid cursor jumping
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isFocused]);
  
  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange({ target: { value: editorRef.current.innerHTML } });
    }
  };
  
  const applyFormat = (command, val = null) => {
    // Ensure we have focus and selection
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };
  
  const insertBlank = () => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, '[BLANK]');
    handleInput();
  };

  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>}
      
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 bg-gray-100 rounded-t-lg border border-b-0 border-gray-200">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-gray-700 transition font-bold text-sm border border-transparent hover:border-gray-300"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-gray-700 transition italic text-sm border border-transparent hover:border-gray-300"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-gray-700 transition text-sm border border-transparent hover:border-gray-300"
          title="Underline (Ctrl+U)"
        >
          <span className="underline">U</span>
        </button>
        <div className="h-5 w-px bg-gray-300 mx-0.5" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('foreColor', '#dc2626'); }}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-red-600 transition font-bold text-sm border border-transparent hover:border-gray-300"
          title="Red Text"
        >
          A
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('foreColor', '#000000'); }}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-gray-900 transition font-bold text-sm border border-transparent hover:border-gray-300"
          title="Black Text"
        >
          A
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('removeFormat'); }}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-gray-500 transition text-xs border border-transparent hover:border-gray-300"
          title="Remove Formatting"
        >
          ✕
        </button>
        <div className="h-5 w-px bg-gray-300 mx-0.5" />
        {showBlankButton && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertBlank(); }}
            className="px-2 py-1 rounded hover:bg-amber-100 text-amber-700 transition text-xs font-medium border border-amber-300 bg-amber-50"
            title="Insert Blank Placeholder"
          >
            + Blank
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto hidden sm:block">Select text, then format</span>
      </div>
      
      {/* Editable area - contentEditable renders HTML as formatted text */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => { setIsFocused(false); handleInput(); }}
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-b-lg text-sm text-gray-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition overflow-auto"
        style={{ minHeight: props.rows ? `${props.rows * 24}px` : '60px' }}
        suppressContentEditableWarning
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
};

// Render HTML safely (for preview)
const RenderHtml = ({ html }) => {
  return <span dangerouslySetInnerHTML={{ __html: html || '' }} />;
};

// ============================================
// BLANK INPUT COMPONENT - Circle number + rounded rectangular input
// ============================================
const BlankInput = ({ questionNumber }) => (
  <span className="inline-flex items-center gap-2 mx-1 my-0.5">
    {/* Circle with question number - accent color */}
    <span 
      className="w-7 h-7 flex items-center justify-center rounded-full text-white text-sm font-bold flex-shrink-0"
      style={{ minWidth: '28px', minHeight: '28px', backgroundColor: 'rgb(50, 180, 200)' }}
    >
      {questionNumber}
    </span>
    {/* Input field */}
    <span 
      className="inline-block px-4 py-1.5 border border-gray-300 rounded bg-white text-gray-400 text-sm min-w-[100px] text-center"
      style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
    >
      __________
    </span>
  </span>
);

// Render template with proper blank inputs
const renderTemplateWithBlanks = (template, questionNumber) => {
  if (!template) return null;
  const parts = template.split('[BLANK]');
  return parts.map((part, idx, arr) => (
    <React.Fragment key={idx}>
      <RenderHtml html={part} />
      {idx < arr.length - 1 && <BlankInput questionNumber={questionNumber} />}
    </React.Fragment>
  ));
};

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div className={`w-9 h-5 rounded-full transition ${checked ? 'bg-amber-500' : 'bg-gray-300'} relative`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </div>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

// ============================================
// ANSWER CONSTRAINT FIELDS
// ============================================
const AnswerConstraintFields = ({ group, updateGroup }) => (
  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
    <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Answer Length Rules</h5>
    <div className="grid grid-cols-3 gap-3">
      <Input
        label="Max Words"
        type="number"
        min="1"
        max="5"
        placeholder="e.g., 2"
        value={group.max_words || ""}
        onChange={(e) => updateGroup(group.id, { max_words: parseInt(e.target.value) || null })}
      />
      <Input
        label="Max Numbers"
        type="number"
        min="0"
        max="3"
        placeholder="e.g., 1"
        value={group.max_numbers || ""}
        onChange={(e) => updateGroup(group.id, { max_numbers: parseInt(e.target.value) || null })}
      />
      <Select
        label="Answer Format"
        value={group.answer_format || 'words_and_numbers'}
        onChange={(e) => updateGroup(group.id, { answer_format: e.target.value })}
        options={[
          { value: 'words_only', label: 'Words only' },
          { value: 'numbers_only', label: 'Numbers only' },
          { value: 'words_and_numbers', label: 'Words and/or numbers' }
        ]}
      />
    </div>
    <p className="text-xs text-blue-600">
      This creates instructions like "NO MORE THAN {group.max_words || '___'} WORDS AND/OR A NUMBER"
    </p>
  </div>
);

// ============================================
// TABLE BUILDER COMPONENT (for form_completion)
// ============================================
const TableBuilder = ({ group, updateGroup, baseQuestionNumber }) => {
  const tableData = group.table_data || { rows: 2, cols: 2, headers: [], cells: [], answers: {} };
  
  const updateTableData = (updates) => {
    updateGroup(group.id, { table_data: { ...tableData, ...updates } });
  };

  // Initialize cells if empty or size changed
  const initializeCells = (rows, cols, existingCells = []) => {
    const newCells = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        // Try to preserve existing cell content
        const existingCell = existingCells[r]?.[c];
        row.push(existingCell || '');
      }
      newCells.push(row);
    }
    return newCells;
  };

  // Initialize headers if empty or size changed
  const initializeHeaders = (cols, existingHeaders = []) => {
    const newHeaders = [];
    for (let c = 0; c < cols; c++) {
      newHeaders.push(existingHeaders[c] || '');
    }
    return newHeaders;
  };

  // Ensure cells array matches current dimensions
  const rows = tableData.rows || 2;
  const cols = tableData.cols || 2;
  const cells = tableData.cells?.length === rows && tableData.cells[0]?.length === cols 
    ? tableData.cells 
    : initializeCells(rows, cols, tableData.cells);
  const headers = tableData.headers?.length === cols ? tableData.headers : initializeHeaders(cols, tableData.headers);
  const hasHeaders = tableData.hasHeaders || false;
  const answers = tableData.answers || {};

  // Count blanks in all cells to determine question numbers
  const countBlanksUpTo = (rowIdx, colIdx) => {
    let count = 0;
    for (let r = 0; r <= rowIdx; r++) {
      const maxCol = r === rowIdx ? colIdx : (cells[r]?.length || 0);
      for (let c = 0; c < maxCol; c++) {
        const cell = cells[r]?.[c] || '';
        count += (cell.match(/\[BLANK\]/g) || []).length;
      }
    }
    return count;
  };

  const totalBlanks = () => {
    let count = 0;
    cells.forEach(row => {
      row.forEach(cell => {
        count += (cell.match(/\[BLANK\]/g) || []).length;
      });
    });
    return count;
  };

  const handleRowsChange = (newRows) => {
    const newCells = initializeCells(newRows, cols, cells);
    updateTableData({ rows: newRows, cells: newCells });
  };

  const handleColsChange = (newCols) => {
    const newCells = initializeCells(rows, newCols, cells);
    const newHeaders = initializeHeaders(newCols, headers);
    updateTableData({ cols: newCols, cells: newCells, headers: newHeaders });
  };

  const handleCellChange = (rowIdx, colIdx, value) => {
    const newCells = cells.map((row, r) => 
      row.map((cell, c) => r === rowIdx && c === colIdx ? value : cell)
    );
    updateTableData({ cells: newCells });
  };

  const handleHeaderChange = (colIdx, value) => {
    const newHeaders = headers.map((h, c) => c === colIdx ? value : h);
    updateTableData({ headers: newHeaders });
  };

  const handleAnswerChange = (blankNum, value) => {
    updateTableData({ answers: { ...answers, [blankNum]: value } });
  };

  const insertBlank = (rowIdx, colIdx) => {
    const currentValue = cells[rowIdx][colIdx] || '';
    handleCellChange(rowIdx, colIdx, currentValue + '[BLANK]');
  };

  // Render cell content with question numbers for blanks
  const renderCellPreview = (cellContent, startBlankNum) => {
    if (!cellContent) return <span className="text-gray-400">Empty</span>;
    
    const parts = cellContent.split(/(\[BLANK\])/);
    let blankCount = 0;
    
    return parts.map((part, idx) => {
      if (part === '[BLANK]') {
        const qNum = baseQuestionNumber + startBlankNum + blankCount;
        blankCount++;
        return (
          <span key={idx} className="inline-flex items-center gap-1 mx-0.5">
            <span 
              className="w-5 h-5 flex items-center justify-center rounded-full text-white text-xs font-bold"
              style={{ backgroundColor: 'rgb(50, 180, 200)' }}
            >
              {qNum}
            </span>
            <span className="w-16 h-6 border border-dashed border-amber-400 rounded bg-amber-50"></span>
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="bg-amber-50 rounded-xl p-4 space-y-4">
      <h5 className="text-base font-bold text-amber-800 flex items-center gap-2 pb-2 border-b border-amber-200">
        <FileText size={20} className="text-amber-600" />
        Table Builder - Create Your Table
      </h5>
      <p className="text-sm text-gray-600">
        Set the number of rows and columns, then fill in the cells. Use <code className="bg-gray-200 px-1 rounded">[BLANK]</code> to add input fields for student answers.
      </p>

      {/* Table Dimensions */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-white rounded-lg border border-amber-200">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Rows:</label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => rows > 1 && handleRowsChange(rows - 1)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
            >−</button>
            <input
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => handleRowsChange(parseInt(e.target.value) || 2)}
              className="w-14 px-2 py-2 text-center border-x border-gray-300 text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => rows < 20 && handleRowsChange(rows + 1)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
            >+</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Columns:</label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => cols > 1 && handleColsChange(cols - 1)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
            >−</button>
            <input
              type="number"
              min="1"
              max="10"
              value={cols}
              onChange={(e) => handleColsChange(parseInt(e.target.value) || 2)}
              className="w-14 px-2 py-2 text-center border-x border-gray-300 text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => cols < 10 && handleColsChange(cols + 1)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
            >+</button>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasHeaders}
            onChange={(e) => updateTableData({ hasHeaders: e.target.checked })}
            className="w-5 h-5 rounded text-amber-500 border-gray-300 focus:ring-amber-400"
          />
          <span className="text-sm font-medium text-gray-700">Include header row</span>
        </label>
        <span className="ml-auto text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
          {totalBlanks()} blanks → Q{baseQuestionNumber}–{baseQuestionNumber + Math.max(totalBlanks(), 1) - 1}
        </span>
      </div>

      {/* Table Editor */}
      <div>
        <h6 className="text-sm font-semibold text-gray-700 mb-2">Edit Table Content:</h6>
        <div className="overflow-x-auto rounded-lg border-2 border-gray-300 bg-white">
          <table className="w-full border-collapse">
            {/* Header row (optional) */}
            {hasHeaders && (
              <thead>
                <tr>
                  {headers.map((header, colIdx) => (
                    <th key={colIdx} className="border border-gray-200 p-0 bg-amber-50">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                        placeholder={`Header ${colIdx + 1}`}
                        className="w-full px-3 py-2 text-center font-bold text-sm bg-transparent outline-none placeholder-gray-400"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {cells.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, colIdx) => {
                    const blanksBeforeThis = countBlanksUpTo(rowIdx, colIdx);
                    return (
                      <td key={colIdx} className="border border-gray-200 p-0 align-top bg-white">
                        <div className="flex flex-col">
                          <textarea
                            value={cell}
                            onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                            placeholder="Type cell content here...&#10;Click + Add [BLANK] below to add answer fields"
                            className="w-full px-3 py-2 text-sm outline-none resize-none min-h-[80px] placeholder-gray-400"
                            rows={3}
                          />
                          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => insertBlank(rowIdx, colIdx)}
                              className="px-3 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 font-medium transition"
                            >
                              + Add [BLANK]
                            </button>
                            {cell.includes('[BLANK]') && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                {(cell.match(/\[BLANK\]/g) || []).length} blank(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Answers section - one for each blank */}
      {totalBlanks() > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h6 className="text-xs font-semibold text-gray-600 mb-2">Correct Answers</h6>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: totalBlanks() }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span 
                  className="w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: 'rgb(50, 180, 200)' }}
                >
                  {baseQuestionNumber + i}
                </span>
                <input
                  type="text"
                  value={answers[i] || ''}
                  onChange={(e) => handleAnswerChange(i, e.target.value)}
                  placeholder="Answer..."
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="border-t border-gray-200 pt-4">
        <h6 className="text-xs font-semibold text-gray-600 mb-2">Preview</h6>
        <div style={{ border: '1px solid rgb(221, 221, 221)', borderRadius: '10px', padding: '16px' }}>
          {group.table_title && (
            <div 
              style={{
                color: 'rgb(41, 69, 99)',
                fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '16px'
              }}
              dangerouslySetInnerHTML={{ __html: group.table_title }}
            />
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgb(221, 221, 221)' }}>
            {hasHeaders && headers.some(h => h) && (
              <thead>
                <tr>
                  {headers.map((header, idx) => (
                    <th 
                      key={idx}
                      style={{
                        backgroundColor: 'rgb(221, 221, 221)',
                        border: '1px solid rgb(221, 221, 221)',
                        padding: '8px',
                        textAlign: 'center',
                        fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      {header || `Col ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {cells.map((row, rowIdx) => {
                let blanksSoFar = 0;
                for (let r = 0; r < rowIdx; r++) {
                  cells[r].forEach(c => {
                    blanksSoFar += (c.match(/\[BLANK\]/g) || []).length;
                  });
                }
                return (
                  <tr key={rowIdx}>
                    {row.map((cell, colIdx) => {
                      const startBlank = blanksSoFar;
                      for (let c = 0; c < colIdx; c++) {
                        blanksSoFar += (row[c].match(/\[BLANK\]/g) || []).length;
                      }
                      return (
                        <td 
                          key={colIdx}
                          style={{
                            border: '1px solid rgb(221, 221, 221)',
                            padding: '10px 12px',
                            verticalAlign: 'middle',
                            fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                            fontSize: '14px'
                          }}
                        >
                          {renderCellPreview(cell, startBlank)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE BLOCK COMPONENT
// ============================================
const ExampleBlock = ({ group, updateGroup }) => {
  const exampleData = group.example_data || {};
  
  const updateExample = (field, value) => {
    updateGroup(group.id, { 
      example_data: { ...exampleData, [field]: value }
    });
  };

  if (!group.has_example) {
    return (
      <button
        type="button"
        onClick={() => updateGroup(group.id, { has_example: true })}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 transition"
      >
        + Add Example
      </button>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Example</h5>
        <button
          type="button"
          onClick={() => updateGroup(group.id, { has_example: false, example_data: null })}
          className="p-1 text-amber-600 hover:text-red-500 transition"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <RichTextArea
        label="Example Stem/Question"
        placeholder="e.g., What is the speaker's name?"
        rows={2}
        value={exampleData.stem || ""}
        onChange={(e) => updateExample('stem', e.target.value)}
      />
      {group.question_type === 'multiple_choice' && (
        <div className="grid grid-cols-4 gap-2">
          {['A', 'B', 'C', 'D'].slice(0, group.option_count || 3).map(letter => (
            <Input
              key={letter}
              label={`Option ${letter}`}
              placeholder={`Option ${letter}`}
              value={exampleData[`option_${letter.toLowerCase()}`] || ""}
              onChange={(e) => updateExample(`option_${letter.toLowerCase()}`, e.target.value)}
            />
          ))}
        </div>
      )}
      <Input
        label="Correct Answer (shown pre-filled)"
        placeholder="e.g., A / Johnson / 15"
        value={exampleData.answer || ""}
        onChange={(e) => updateExample('answer', e.target.value)}
      />
    </div>
  );
};

// ============================================
// SHARED OPTIONS EDITOR (FOR MATCHING)
// ============================================
const SharedOptionsEditor = ({ group, updateGroup }) => {
  const options = group.shared_options || [];
  
  const addOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length);
    updateGroup(group.id, { 
      shared_options: [...options, { label: nextLabel, text: '' }]
    });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    updateGroup(group.id, { shared_options: newOptions });
  };

  const removeOption = (index) => {
    updateGroup(group.id, { shared_options: options.filter((_, i) => i !== index) });
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
          Shared Options (A–{String.fromCharCode(64 + Math.max(options.length, 1))})
        </h5>
        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= 8}
          className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50 transition"
        >
          <Plus size={12} /> Add Option
        </button>
      </div>
      <p className="text-xs text-purple-600">
        These options are shared across all questions in this group.
      </p>
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-purple-200 text-purple-700 rounded-lg font-semibold text-sm">
              {opt.label}
            </span>
            <input
              className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm focus:border-purple-400 outline-none"
              placeholder={`Option ${opt.label} text...`}
              value={opt.text}
              onChange={(e) => updateOption(idx, 'text', e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeOption(idx)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-xs text-purple-400 italic py-2 text-center">
            Click "Add Option" to create shared options (A, B, C, etc.)
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================
// IMAGE UPLOAD FOR MAP/DIAGRAM
// ============================================
const ImageUploader = ({ group, updateGroup }) => (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
    <h5 className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Map/Plan/Diagram Image</h5>
    <Input
      placeholder="https://example.com/map-image.png"
      value={group.image_url || ""}
      onChange={(e) => updateGroup(group.id, { image_url: e.target.value })}
    />
    <RichTextArea
      label="Image Description (optional)"
      placeholder="Describe the diagram for accessibility..."
      rows={2}
      value={group.image_description || ""}
      onChange={(e) => updateGroup(group.id, { image_description: e.target.value })}
    />
    {group.image_url && (
      <div className="bg-white rounded-lg border border-orange-200 p-2">
        <img 
          src={group.image_url} 
          alt="Map/Diagram preview" 
          className="max-h-48 mx-auto rounded"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    )}
  </div>
);

// ============================================
// QUESTION EDITOR BY TYPE
// ============================================
const QuestionEditor = ({ question, questionNumber, groupType, updateQuestion, deleteQuestion }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isInfoRow = question.is_info_row === true;

  return (
    <div className={`border rounded-lg overflow-hidden bg-white ${isInfoRow ? 'border-blue-200' : 'border-gray-200'}`}>
      <div 
        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition ${isInfoRow ? 'hover:bg-blue-50' : 'hover:bg-gray-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs ${
            isInfoRow ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isInfoRow ? 'Info' : questionNumber}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
              {isInfoRow 
                ? (question.label_text || question.info_text || 'Info Row')
                : (question.question_text || question.question_template || 'Question ' + questionNumber)
              }
            </p>
            {!isInfoRow && question.correct_answer && (
              <p className="text-xs text-green-600">Answer: {question.correct_answer}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isInfoRow && question.correct_answer && <CheckCircle size={16} className="text-green-500" />}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
          >
            <Trash2 size={14} />
          </button>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 space-y-4">
          {/* Multiple Choice - Question number, question text, then A/B/C below */}
          {groupType === 'multiple_choice' && (
            <>
              <RichTextArea
                label="Question Text"
                placeholder="What is the main purpose of the speaker's announcement?"
                rows={2}
                value={question.question_text || ""}
                onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
              />
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Preview (Q{questionNumber}):</p>
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">
                    <span className="text-amber-700">{questionNumber}.</span>{' '}
                    <RenderHtml html={question.question_text || 'Question text...'} />
                  </p>
                  <div className="ml-4 space-y-1">
                    {['A', 'B', 'C', 'D'].map(letter => {
                      const text = question[`option_${letter.toLowerCase()}`];
                      if (!text) return null;
                      return (
                        <div key={letter} className={`${question.correct_answer === letter ? 'text-green-600 font-medium' : ''}`}>
                          <span className="font-semibold">{letter}</span> <RenderHtml html={text} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Options (click letter to set correct answer)</label>
                {['A', 'B', 'C', 'D'].map(letter => (
                  <div key={letter} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuestion(question.id, { correct_answer: letter })}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm transition ${
                        question.correct_answer === letter 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {letter}
                    </button>
                    <input
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-amber-400 outline-none"
                      placeholder={`Option ${letter} text`}
                      value={question[`option_${letter.toLowerCase()}`] || ""}
                      onChange={(e) => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Matching */}
          {groupType === 'matching' && (
            <>
              <RichTextArea
                label="Question/Item Text (with formatting)"
                placeholder="The speaker mentions that the new policy will..."
                rows={2}
                value={question.question_text || ""}
                onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
              />
              <Input
                label="Correct Answer (Option Letter)"
                placeholder="A, B, C, etc."
                value={question.correct_answer || ""}
                onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value.toUpperCase() })}
                hint="Enter the letter of the correct matching option"
              />
            </>
          )}

          {/* Form/Table Completion - Two column format: label | text with (number) blank */}
          {groupType === 'form_completion' && (
            <>
              {/* Row Type Toggle */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-500">ROW TYPE:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`rowType-${question.id}`}
                    checked={!question.is_info_row}
                    onChange={() => updateQuestion(question.id, { is_info_row: false })}
                    className="w-4 h-4 text-amber-500"
                  />
                  <span className="text-sm text-gray-700">Question Row (with blank)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`rowType-${question.id}`}
                    checked={question.is_info_row === true}
                    onChange={() => updateQuestion(question.id, { is_info_row: true, correct_answer: '', question_template: '' })}
                    className="w-4 h-4 text-amber-500"
                  />
                  <span className="text-sm text-gray-700">Info Row (no blank)</span>
                </label>
              </div>

              {question.is_info_row ? (
                /* Info Row - just two text columns, no blank */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Left Column"
                      placeholder="e.g., Location, Event Type"
                      value={question.label_text || ""}
                      onChange={(e) => updateQuestion(question.id, { label_text: e.target.value })}
                    />
                    <RichTextArea
                      label="Right Column (Information)"
                      placeholder="e.g., Main Conference Hall, Annual Meeting"
                      showBlankButton={false}
                      rows={2}
                      value={question.info_text || ""}
                      onChange={(e) => updateQuestion(question.id, { info_text: e.target.value })}
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2">Info Row Preview:</p>
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border border-gray-300">
                          <td className="border border-gray-300 px-3 py-2 w-1/3">
                            <RenderHtml html={question.label_text || 'Label'} />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <RenderHtml html={question.info_text || 'Information'} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* Question Row - with blank to fill */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Left Column (Label)"
                      placeholder="e.g., Name, Date, Time, Location"
                      value={question.label_text || ""}
                      onChange={(e) => updateQuestion(question.id, { label_text: e.target.value })}
                    />
                    <RichTextArea
                      label="Right Column (with blank)"
                      placeholder="e.g., Mr. [BLANK] or [BLANK] September"
                      hint="Use [BLANK] where the answer goes"
                      rows={2}
                      value={question.question_template || ""}
                      onChange={(e) => updateQuestion(question.id, { question_template: e.target.value })}
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2">Table Preview (Q{questionNumber}):</p>
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border border-gray-300">
                          <td className="border border-gray-300 px-3 py-2 w-1/3">
                            <RenderHtml html={question.label_text || 'Label'} />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {renderTemplateWithBlanks(question.question_template || '[BLANK]', questionNumber)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Input
                    label="Correct Answer"
                    placeholder="e.g., Johnson, 15, September"
                    value={question.correct_answer || ""}
                    onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                  />
                  <Input
                    label="Alternative Answers (comma-separated)"
                    placeholder="e.g., 15, fifteen, Fifteen"
                    value={(question.answer_alternatives || []).join(', ')}
                    onChange={(e) => updateQuestion(question.id, { 
                      answer_alternatives: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                  />
                </>
              )}
            </>
          )}

          {/* Sentence Completion - One sentence per line with inline blank */}
          {groupType === 'sentence_completion' && (
            <>
              <RichTextArea
                label="Sentence with blank"
                placeholder="The museum opens at [BLANK] o'clock every day."
                hint="One sentence per question. Use [BLANK] for the answer position."
                rows={2}
                value={question.question_template || ""}
                onChange={(e) => updateQuestion(question.id, { question_template: e.target.value })}
              />
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Preview (Q{questionNumber}):</p>
                <p className="text-sm text-gray-700 flex items-center flex-wrap">
                  {renderTemplateWithBlanks(question.question_template || 'Write sentence with [BLANK]', questionNumber)}
                </p>
              </div>
              <Input
                label="Correct Answer"
                placeholder="e.g., nine, 15, Tuesday"
                value={question.correct_answer || ""}
                onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
              />
              <Input
                label="Alternative Answers (comma-separated)"
                placeholder="e.g., 9, Nine, nine o'clock"
                value={(question.answer_alternatives || []).join(', ')}
                onChange={(e) => updateQuestion(question.id, { 
                  answer_alternatives: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
              />
            </>
          )}

          {/* Note/Summary Completion */}
          {groupType === 'note_completion' && (
            <>
              <RichTextArea
                label="Note line with blank"
                placeholder="e.g., • Date of meeting: [BLANK]"
                hint="Use [BLANK] for the answer position. Use bullet points (•) for notes."
                rows={2}
                value={question.question_template || ""}
                onChange={(e) => updateQuestion(question.id, { question_template: e.target.value })}
              />
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Preview (Q{questionNumber}):</p>
                <p className="text-sm text-gray-700 flex items-center flex-wrap">
                  {renderTemplateWithBlanks(question.question_template || '• [BLANK]', questionNumber)}
                </p>
              </div>
              <Input
                label="Correct Answer"
                placeholder="e.g., September, 500, students"
                value={question.correct_answer || ""}
                onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
              />
              <Input
                label="Alternative Answers (comma-separated)"
                placeholder="Accept multiple spellings/formats"
                value={(question.answer_alternatives || []).join(', ')}
                onChange={(e) => updateQuestion(question.id, { 
                  answer_alternatives: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
              />
            </>
          )}

          {/* Map/Diagram Labelling */}
          {groupType === 'map_labeling' && (
            <>
              <TextArea
                label="Label Prompt/Location Description"
                placeholder="The building at the corner of Main Street and Park Avenue"
                rows={2}
                value={question.question_text || ""}
                onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
              />
              <Input
                label="Correct Label"
                placeholder="e.g., Library, Reception, Gate A"
                value={question.correct_answer || ""}
                onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
              />
            </>
          )}

          {/* Short Answer */}
          {groupType === 'short_answer' && (
            <>
              <TextArea
                label="Question"
                placeholder="What time does the library close on Sundays?"
                rows={2}
                value={question.question_text || ""}
                onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
              />
              <Input
                label="Correct Answer"
                placeholder="e.g., 5 pm, twenty, the manager"
                value={question.correct_answer || ""}
                onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
              />
              <Input
                label="Alternative Answers (comma-separated)"
                placeholder="e.g., 5pm, 5:00 pm, five o'clock"
                value={(question.answer_alternatives || []).join(', ')}
                onChange={(e) => updateQuestion(question.id, { 
                  answer_alternatives: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
              />
            </>
          )}

          {/* Scoring Options */}
          <div className="pt-2 border-t border-gray-200">
            <Input
              label="Points"
              type="number"
              min="1"
              className="w-24"
              value={question.points || 1}
              onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// QUESTION GROUP CARD
// ============================================
const QuestionGroupCard = ({ group, sectionId, partNumber }) => {
  const { updateQuestionGroup, deleteQuestionGroup, questions, addQuestion, updateQuestion, deleteQuestion } = useExamEditor();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const typeInfo = QUESTION_TYPES.find(t => t.value === group.question_type) || QUESTION_TYPES[0];
  const TypeIcon = typeInfo.icon;

  // DEBUG: Log filtering
  console.log(`[QuestionGroupCard] Part ${partNumber}, sectionId: ${sectionId}, group.section_id: ${group.section_id}`);
  console.log(`[QuestionGroupCard] All questions (${questions.length}):`, questions.map(q => ({
    id: q.id?.substring(0, 8),
    section_id: q.section_id?.substring(0, 8),
    qNum: q.question_number
  })));

  // Get all rows (questions + info rows) for this group
  const groupRows = questions.filter(q => {
    const matches = q.section_id === sectionId;
    const qNum = q.question_number;
    const inRange = qNum >= group.question_range_start && qNum <= group.question_range_end;
    if (!matches) {
      console.log(`[QuestionGroupCard] Q${qNum} section_id ${q.section_id?.substring(0,8)} !== ${sectionId?.substring(0,8)}`);
    }
    return matches && inRange;
  }).sort((a, b) => (a.row_order || a.question_number) - (b.row_order || b.question_number));
  
  console.log(`[QuestionGroupCard] Filtered groupRows: ${groupRows.length}`);

  // Only actual questions (not info rows) for counting
  const actualQuestions = groupRows.filter(q => q.is_info_row !== true);
  
  // For backward compatibility, also expose as groupQuestions
  const groupQuestions = groupRows;

  const addQuestionToGroup = () => {
    // For question number, only count actual questions (not info rows)
    const nextNum = actualQuestions.length > 0 
      ? Math.max(...actualQuestions.map(q => q.question_number)) + 1
      : group.question_range_start;
    
    // For form_completion, auto-expand the range if needed
    if (nextNum > group.question_range_end && group.question_type === 'form_completion') {
      updateQuestionGroup(group.id, { question_range_end: nextNum });
    } else if (nextNum > group.question_range_end) {
      alert(`This group only covers questions ${group.question_range_start}–${group.question_range_end}. Increase the range to add more.`);
      return;
    }

    // Calculate row order (for display ordering)
    const maxRowOrder = groupRows.length > 0 
      ? Math.max(...groupRows.map(q => q.row_order || q.question_number)) 
      : 0;

    addQuestion(sectionId, {
      question_number: nextNum,
      question_type: group.question_type,
      question_text: '',
      correct_answer: '',
      points: group.points_per_question || 1,
      row_order: maxRowOrder + 1
    });
  };

  // Move row up or down in the table/form
  const moveRow = (questionId, direction) => {
    const sortedRows = [...groupRows].sort((a, b) => 
      (a.row_order || a.question_number) - (b.row_order || b.question_number)
    );
    const currentIndex = sortedRows.findIndex(q => q.id === questionId);
    if (currentIndex < 0) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedRows.length) return;
    
    // Swap row_order values
    const currentRow = sortedRows[currentIndex];
    const targetRow = sortedRows[newIndex];
    
    const currentOrder = currentRow.row_order || currentRow.question_number;
    const targetOrder = targetRow.row_order || targetRow.question_number;
    
    updateQuestion(currentRow.id, { row_order: targetOrder });
    updateQuestion(targetRow.id, { row_order: currentOrder });
  };

  const globalQuestionNumber = (partNumber - 1) * 10;

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
      <div 
        className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-lg">
            <TypeIcon size={20} className="text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">
              Questions {globalQuestionNumber + group.question_range_start}–{globalQuestionNumber + group.question_range_end}
            </h4>
            <p className="text-xs text-gray-500">{typeInfo.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {actualQuestions.length}/{group.question_range_end - group.question_range_start + 1} questions
            {groupRows.length > actualQuestions.length && ` + ${groupRows.length - actualQuestions.length} info`}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); deleteQuestionGroup(group.id); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
          >
            <Trash2 size={16} />
          </button>
          <ChevronDown size={18} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* Question Range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Question"
              type="number"
              min="1"
              max="10"
              value={group.question_range_start || 1}
              onChange={(e) => updateQuestionGroup(group.id, { question_range_start: parseInt(e.target.value) || 1 })}
            />
            <Input
              label="To Question"
              type="number"
              min="1"
              max="10"
              value={group.question_range_end || 1}
              onChange={(e) => updateQuestionGroup(group.id, { question_range_end: parseInt(e.target.value) || 1 })}
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Question Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUESTION_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = group.question_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateQuestionGroup(group.id, { question_type: type.value })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition ${
                      isSelected 
                        ? 'border-amber-400 bg-amber-50 text-amber-800' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-amber-600' : 'text-gray-400'} />
                    <span className="text-xs font-medium truncate">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instruction Text */}
          <RichTextArea
            label="Instruction Text"
            hint="IELTS-style instruction shown to students. Use formatting toolbar above."
            placeholder="Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer."
            rows={3}
            value={group.instruction_text || ""}
            onChange={(e) => updateQuestionGroup(group.id, { instruction_text: e.target.value })}
          />

          {/* Answer Constraints */}
          {['form_completion', 'sentence_completion', 'note_completion', 'short_answer'].includes(group.question_type) && (
            <AnswerConstraintFields group={group} updateGroup={updateQuestionGroup} />
          )}

          {/* Shared Options (for matching) */}
          {group.question_type === 'matching' && (
            <SharedOptionsEditor group={group} updateGroup={updateQuestionGroup} />
          )}

          {/* Image Upload (for map/diagram) */}
          {group.question_type === 'map_labeling' && (
            <ImageUploader group={group} updateGroup={updateQuestionGroup} />
          )}

          {/* Layout Type */}
          {['form_completion', 'note_completion'].includes(group.question_type) && (
            <Select
              label="Layout Type"
              value={group.layout_type || 'form'}
              onChange={(e) => updateQuestionGroup(group.id, { layout_type: e.target.value })}
              options={[
                { value: 'form', label: 'Form' },
                { value: 'table', label: 'Table' },
                { value: 'notes', label: 'Notes' },
                { value: 'summary', label: 'Summary' },
                { value: 'flowchart', label: 'Flow-chart' }
              ]}
            />
          )}

          {/* Table/Form Title - shown above the table */}
          {group.question_type === 'form_completion' && (
            <RichTextArea
              label="Table/Form Title"
              placeholder="e.g., REGISTRATION FORM, Event Details, etc."
              hint="Displayed as header above the table (supports formatting)"
              rows={2}
              value={group.table_title || ""}
              onChange={(e) => updateQuestionGroup(group.id, { table_title: e.target.value })}
            />
          )}

          {/* Audio Start Time */}
          <Input
            label="Audio Start Time (seconds)"
            type="number"
            min="0"
            placeholder="e.g., 120"
            value={group.audio_start_time || ""}
            onChange={(e) => updateQuestionGroup(group.id, { audio_start_time: parseInt(e.target.value) || null })}
            hint="For 'Listen from here' feature"
          />

          {/* Example Block */}
          <ExampleBlock group={group} updateGroup={updateQuestionGroup} />

          {/* Scoring Settings */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200">
            <Input
              label="Points per Question"
              type="number"
              min="1"
              value={group.points_per_question || 1}
              onChange={(e) => updateQuestionGroup(group.id, { points_per_question: parseInt(e.target.value) || 1 })}
            />
            <div className="flex items-end pb-1">
              <Toggle
                label="Case Sensitive"
                checked={group.case_sensitive || false}
                onChange={() => updateQuestionGroup(group.id, { case_sensitive: !group.case_sensitive })}
              />
            </div>
            <div className="flex items-end pb-1">
              <Toggle
                label="Allow Spelling Variations"
                checked={group.spelling_tolerance !== false}
                onChange={() => updateQuestionGroup(group.id, { spelling_tolerance: !group.spelling_tolerance })}
              />
            </div>
          </div>

          {/* Table Builder for form_completion - replaces individual question editing */}
          {group.question_type === 'form_completion' && (
            <div className="border-2 border-amber-300 rounded-xl">
              <TableBuilder 
                group={group} 
                updateGroup={updateQuestionGroup}
                baseQuestionNumber={globalQuestionNumber + group.question_range_start}
              />
            </div>
          )}

          {/* Questions List - for non-form_completion types */}
          {group.question_type !== 'form_completion' && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-gray-700">Questions in this Group</h5>
                <button
                  type="button"
                  onClick={addQuestionToGroup}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition"
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>
              
              {groupRows.length > 0 ? (
                <div className="space-y-2">
                  {groupRows.map((q, idx) => (
                    <div key={q.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <QuestionEditor
                          question={q}
                          questionNumber={q.is_info_row ? null : (globalQuestionNumber + q.question_number)}
                          groupType={group.question_type}
                          updateQuestion={updateQuestion}
                          deleteQuestion={deleteQuestion}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">No questions yet. Click "Add Question" to start.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// PART (SECTION) CARD
// ============================================
const PartCard = ({ section, partNumber }) => {
  const { updateSection, questionGroups, addQuestionGroup } = useExamEditor();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // DEBUG
  console.log(`[PartCard] Part ${partNumber}, section.id: ${section.id}`);
  console.log(`[PartCard] All questionGroups (${questionGroups.length}):`, questionGroups.map(g => ({
    id: g.id?.substring(0, 8),
    section_id: g.section_id?.substring(0, 8),
    type: g.question_type,
    range: `${g.question_range_start}-${g.question_range_end}`
  })));

  const sectionGroups = questionGroups
    .filter(g => g.section_id === section.id)
    .sort((a, b) => a.group_order - b.group_order);
  
  console.log(`[PartCard] Filtered sectionGroups for Part ${partNumber}: ${sectionGroups.length}`);

  const colors = [
    { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
    { bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  ][partNumber - 1];

  const toggleAudio = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const addNewGroup = () => {
    const existingRanges = sectionGroups.map(g => ({ start: g.question_range_start, end: g.question_range_end }));
    let nextStart = 1;
    for (const range of existingRanges.sort((a, b) => a.start - b.start)) {
      if (range.start > nextStart) break;
      nextStart = range.end + 1;
    }
    
    if (nextStart > 10) {
      alert('All questions (1-10) in this part are already assigned to groups.');
      return;
    }

    addQuestionGroup(section.id, {
      question_range_start: nextStart,
      question_range_end: Math.min(nextStart + 2, 10),
      question_type: 'multiple_choice',
      instruction_text: '',
      points_per_question: 1
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div 
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${colors.bg} text-white font-bold text-xl`}>
            {partNumber}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{section.title || `Part ${partNumber}`}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm text-gray-500">Questions {(partNumber - 1) * 10 + 1}–{partNumber * 10}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${colors.light} ${colors.text}`}>
                {sectionGroups.length} groups
              </span>
            </div>
          </div>
        </div>
        <ChevronDown size={22} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <>
          <div className={`px-5 py-4 ${colors.light} border-t ${colors.border}`}>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input
                label="Part Title"
                placeholder="e.g., Part 1 - Conversation"
                value={section.title || ""}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
              />
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Audio URL</label>
                <div className="flex gap-2">
                  {section.audio_url && (
                    <button
                      type="button"
                      onClick={toggleAudio}
                      className={`w-10 h-10 flex items-center justify-center ${colors.bg} text-white rounded-lg hover:opacity-90 transition`}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>
                  )}
                  <input
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-amber-400 outline-none"
                    placeholder="https://example.com/part-audio.mp3"
                    value={section.audio_url || ""}
                    onChange={(e) => updateSection(section.id, { audio_url: e.target.value })}
                  />
                  {section.audio_url && <audio ref={audioRef} src={section.audio_url} onEnded={() => setIsPlaying(false)} />}
                </div>
              </div>
              <Input
                label="Audio Start Time (sec)"
                type="number"
                min="0"
                placeholder="0"
                value={section.audio_start_time || ""}
                onChange={(e) => updateSection(section.id, { audio_start_time: parseInt(e.target.value) || 0 })}
                hint="Start time in global audio"
              />
            </div>
            
            <div className="mt-3">
              <TextArea
                label="Part Description (admin notes)"
                placeholder="Brief description of this part's context..."
                rows={2}
                value={section.section_description || ""}
                onChange={(e) => updateSection(section.id, { section_description: e.target.value })}
              />
            </div>

            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">+ Transcript (optional)</summary>
              <textarea
                className="w-full mt-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm resize-none focus:border-amber-400 outline-none"
                rows={4}
                placeholder="Paste transcript for reference..."
                value={section.content || ""}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
              />
            </details>
          </div>

          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-700">Question Groups</h4>
              <button
                type="button"
                onClick={addNewGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition"
              >
                <Plus size={16} /> Add Group
              </button>
            </div>

            {sectionGroups.length > 0 ? (
              <div className="space-y-4">
                {sectionGroups.map((group) => (
                  <QuestionGroupCard 
                    key={group.id} 
                    group={group} 
                    sectionId={section.id}
                    partNumber={partNumber}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Mic size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No question groups yet</p>
                <p className="text-xs text-gray-400 mt-1">Add groups to define question types and ranges</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// GLOBAL AUDIO SETTINGS
// ============================================
const GlobalAudioSettings = () => {
  const { exam, updateExam } = useExamEditor();
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const listeningConfig = exam.listening_config || {};

  const updateConfig = (field, value) => {
    updateExam({
      listening_config: { ...listeningConfig, [field]: value }
    });
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden">
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-lg">
            <Settings size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">Global Audio Settings</h3>
            <p className="text-xs text-amber-600">Main audio file, duration, and transfer time</p>
          </div>
        </div>
        <ChevronDown size={20} className={`text-amber-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <div className="px-4 py-4 border-t border-amber-200 space-y-4">
          <Toggle
            label="Use single global audio file"
            checked={listeningConfig.use_global_audio !== false}
            onChange={() => updateConfig('use_global_audio', !listeningConfig.use_global_audio)}
          />

          {listeningConfig.use_global_audio !== false && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Main Audio File URL</label>
              <div className="flex gap-2">
                {listeningConfig.global_audio_url && (
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className="w-10 h-10 flex items-center justify-center bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                )}
                <input
                  className="flex-1 px-3 py-2.5 bg-white border border-amber-200 rounded-lg text-sm focus:border-amber-400 outline-none"
                  placeholder="https://example.com/full-listening-test.mp3"
                  value={listeningConfig.global_audio_url || ""}
                  onChange={(e) => updateConfig('global_audio_url', e.target.value)}
                />
              </div>
              {listeningConfig.global_audio_url && (
                <audio ref={audioRef} src={listeningConfig.global_audio_url} onEnded={() => setIsPlaying(false)} />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Duration (seconds)"
              type="number"
              min="0"
              placeholder="1800 (30 min)"
              value={listeningConfig.total_duration || ""}
              onChange={(e) => updateConfig('total_duration', parseInt(e.target.value) || null)}
            />
            <Input
              label="Transfer Time (seconds)"
              type="number"
              min="0"
              placeholder="600 (10 min)"
              value={listeningConfig.transfer_time || ""}
              onChange={(e) => updateConfig('transfer_time', parseInt(e.target.value) || null)}
              hint="Time to transfer answers"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// PREVIEW MODE
// ============================================
const PreviewMode = ({ isOpen, onClose }) => {
  const { sections, questions, questionGroups } = useExamEditor();
  const [selectedPart, setSelectedPart] = useState(1);

  if (!isOpen) return null;

  const listeningSections = sections
    .filter(s => s.module_type === 'listening')
    .sort((a, b) => a.section_order - b.section_order);

  const currentSection = listeningSections[selectedPart - 1];

  const currentGroups = questionGroups
    .filter(g => g.section_id === currentSection?.id)
    .sort((a, b) => a.group_order - b.group_order);

  // Render questions grouped by type for proper IELTS layout
  const renderQuestionGroup = (group, groupQuestions, globalOffset) => {
    const type = group.question_type;

    // Accent color: rgb(50, 180, 200)
    const accentColor = 'rgb(50, 180, 200)';

    // Word/number counting and validation helper
    const countWordsAndNumbers = (text) => {
      if (!text || !text.trim()) return { words: 0, numbers: 0 };
      const tokens = text.trim().split(/\s+/);
      let words = 0;
      let numbers = 0;
      tokens.forEach(token => {
        // Check if token is a number (including decimals, negatives)
        if (/^-?\d+(\.\d+)?$/.test(token)) {
          numbers++;
        } else {
          words++;
        }
      });
      return { words, numbers };
    };

    // Validate input against max_words and max_numbers
    const validateInput = (value, maxWords, maxNumbers) => {
      const { words, numbers } = countWordsAndNumbers(value);
      const totalAllowed = (maxWords || 999) + (maxNumbers || 999);
      const total = words + numbers;
      
      // Check if within limits
      if (maxWords && words > maxWords) return false;
      if (maxNumbers && numbers > maxNumbers) return false;
      return true;
    };

    // Reusable blank input for student preview - circle + rounded input with word/number limit
    const StudentBlankInput = ({ num }) => {
      const [value, setValue] = React.useState('');
      const [isOverLimit, setIsOverLimit] = React.useState(false);
      
      const maxWords = group.max_words;
      const maxNumbers = group.max_numbers;
      
      const handleChange = (e) => {
        const newValue = e.target.value;
        const { words, numbers } = countWordsAndNumbers(newValue);
        
        // Check limits
        const wordsOk = !maxWords || words <= maxWords;
        const numbersOk = !maxNumbers || numbers <= maxNumbers;
        
        if (wordsOk && numbersOk) {
          setValue(newValue);
          setIsOverLimit(false);
        } else {
          // Show visual feedback but don't update value
          setIsOverLimit(true);
          // Still allow typing but show it's over limit
          setValue(newValue);
        }
      };

      // Calculate limit text for placeholder
      const limitText = maxWords 
        ? `Max ${maxWords} word${maxWords > 1 ? 's' : ''}${maxNumbers ? ` + ${maxNumbers} number${maxNumbers > 1 ? 's' : ''}` : ''}`
        : '';

      return (
        <span className="inline-flex items-center gap-2 mx-1 my-0.5">
          {/* Circle with question number - accent color, Montserrat */}
          <span 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              width: '28px',
              height: '28px',
              minWidth: '28px',
              minHeight: '28px',
              backgroundColor: accentColor,
              borderRadius: '50%',
              color: 'rgb(255, 255, 255)',
              fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              padding: '10px',
              margin: '2px 0'
            }}
          >
            {num}
          </span>
          {/* Rounded input field with limit validation */}
          <input 
            type="text" 
            value={value}
            onChange={handleChange}
            className="w-36 px-4 py-1.5 text-sm text-center bg-white outline-none"
            style={{ 
              fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
              borderRadius: '12px',
              border: isOverLimit ? '2px solid rgb(239, 68, 68)' : '1px solid rgb(209, 213, 219)'
            }}
            placeholder=""
            title={limitText}
          />
        </span>
      );
    };

    // Multiple Choice: Number, question, then A/B/C options below
    if (type === 'multiple_choice') {
      return groupQuestions.map(q => {
        const globalNum = globalOffset + q.question_number;
        return (
          <div key={q.id} className="py-4" style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}>
            {/* Question number as plain bold text */}
            <p style={{
              color: 'rgb(40, 40, 40)',
              fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: '24px',
              marginTop: '10px',
              marginBottom: '10px'
            }}>
              {globalNum}. <RenderHtml html={q.question_text || ''} />
            </p>
            <div className="ml-4 space-y-2">
              {['A', 'B', 'C', 'D'].map(letter => {
                const text = q[`option_${letter.toLowerCase()}`];
                if (!text) return null;
                return (
                  <label key={letter} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-50 rounded-lg">
                    {/* Letter circle (gray) first */}
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgb(223, 223, 223)',
                      color: 'rgb(41, 69, 99)',
                      fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                      fontSize: '14px',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginRight: '8px'
                    }}>
                      {letter}
                    </span>
                    {/* Radio button */}
                    <input type="radio" name={`q${q.id}`} className="w-4 h-4" />
                    {/* Option text */}
                    <span style={{ marginLeft: '4px' }}><RenderHtml html={text} /></span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      });
    }

    // Form/Table Completion: Render table from table_data or fallback to old format
    if (type === 'form_completion') {
      const tableStyles = {
        outer: {
          border: '1px solid rgb(221, 221, 221)',
          borderRadius: '10px',
          padding: '16px',
          marginTop: '20px',
          marginBottom: '0',
          fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '21px',
          color: 'rgb(40, 40, 40)'
        },
        header: {
          color: 'rgb(41, 69, 99)',
          fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
          fontSize: '20px',
          fontWeight: 700,
          lineHeight: '24px',
          marginBottom: '16px',
          textAlign: 'left'
        },
        cell: {
          border: '1px solid rgb(221, 221, 221)',
          padding: '10px 12px',
          verticalAlign: 'middle',
          fontSize: '14px',
          lineHeight: '20px'
        },
        headerCell: {
          backgroundColor: 'rgb(221, 221, 221)',
          border: '1px solid rgb(221, 221, 221)',
          padding: '8px',
          textAlign: 'center',
          fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          verticalAlign: 'top'
        }
      };

      // Use new table_data format if available
      const tableData = group.table_data;
      if (tableData && tableData.cells && tableData.cells.length > 0) {
        const { cells, headers, hasHeaders } = tableData;
        
        // Count blanks to calculate question numbers
        let blankCounter = 0;
        
        const renderCellContent = (cellContent) => {
          if (!cellContent) return null;
          
          const parts = cellContent.split(/(\[BLANK\])/);
          return parts.map((part, idx) => {
            if (part === '[BLANK]') {
              const qNum = globalOffset + group.question_range_start + blankCounter;
              blankCounter++;
              return <StudentBlankInput key={idx} num={qNum} />;
            }
            return <span key={idx}>{part}</span>;
          });
        };

        return (
          <div className="mb-4">
            <div style={tableStyles.outer}>
              {group.table_title && (
                <div 
                  style={tableStyles.header}
                  dangerouslySetInnerHTML={{ __html: group.table_title }}
                />
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgb(221, 221, 221)' }}>
                {hasHeaders && headers && headers.some(h => h) && (
                  <thead>
                    <tr>
                      {headers.map((header, idx) => (
                        <th key={idx} style={tableStyles.headerCell}>
                          {header || ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {cells.map((row, rowIdx) => {
                    // Reset blank counter for proper counting per render
                    return (
                      <tr key={rowIdx}>
                        {row.map((cell, colIdx) => (
                          <td key={colIdx} style={tableStyles.cell}>
                            {renderCellContent(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      // Fallback to old row-based format for backward compatibility
      return (
        <div className="mb-4">
          <div style={tableStyles.outer}>
            {group.table_title && (
              <div 
                style={tableStyles.header}
                dangerouslySetInnerHTML={{ __html: group.table_title }}
              />
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgb(221, 221, 221)' }}>
              <tbody>
                {groupQuestions.map(q => {
                  const globalNum = globalOffset + q.question_number;
                  const template = q.question_template || '';
                  const isInfoRow = q.is_info_row === true;
                  const hasBlank = template.includes('[BLANK]');
                
                  if (isInfoRow) {
                    return (
                      <tr key={q.id}>
                        <td style={{ ...tableStyles.cell, width: '33%' }}>
                          <RenderHtml html={q.label_text || ''} />
                        </td>
                        <td style={tableStyles.cell}>
                          <RenderHtml html={q.info_text || ''} />
                        </td>
                      </tr>
                    );
                  }
                
                  return (
                    <tr key={q.id}>
                      <td style={{ ...tableStyles.cell, width: '33%' }}>
                        <RenderHtml html={q.label_text || ''} />
                      </td>
                      <td style={tableStyles.cell}>
                        {hasBlank ? (
                          template.split('[BLANK]').map((part, idx, arr) => (
                            <React.Fragment key={idx}>
                              <RenderHtml html={part} />
                              {idx < arr.length - 1 && <StudentBlankInput num={globalNum} />}
                            </React.Fragment>
                          ))
                        ) : (
                          <RenderHtml html={template} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Sentence Completion: One sentence per line
    if (type === 'sentence_completion') {
      return groupQuestions.map(q => {
        const globalNum = globalOffset + q.question_number;
        const template = q.question_template || '';
        return (
          <div 
            key={q.id} 
            className="py-3 flex items-center flex-wrap gap-1"
            style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', fontSize: '14px', lineHeight: '21px' }}
          >
            {template.split('[BLANK]').map((part, idx, arr) => (
              <React.Fragment key={idx}>
                <RenderHtml html={part} />
                {idx < arr.length - 1 && <StudentBlankInput num={globalNum} />}
              </React.Fragment>
            ))}
          </div>
        );
      });
    }

    // Note/Summary Completion
    if (type === 'note_completion') {
      return (
        <div 
          className="rounded-lg p-4 space-y-3"
          style={{ 
            fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', 
            fontSize: '14px', 
            lineHeight: '21px',
            border: '1px solid rgb(221, 221, 221)',
            borderRadius: '10px',
            padding: '10px'
          }}
        >
          {groupQuestions.map(q => {
            const globalNum = globalOffset + q.question_number;
            const template = q.question_template || '';
            return (
              <div key={q.id} className="py-1 flex items-center flex-wrap gap-1">
                {template.split('[BLANK]').map((part, idx, arr) => (
                  <React.Fragment key={idx}>
                    <RenderHtml html={part} />
                    {idx < arr.length - 1 && <StudentBlankInput num={globalNum} />}
                  </React.Fragment>
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    // Matching
    if (type === 'matching') {
      return groupQuestions.map(q => {
        const globalNum = globalOffset + q.question_number;
        return (
          <div key={q.id} className="py-3 flex items-center gap-3" style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}>
            <span 
              className="w-7 h-7 flex items-center justify-center rounded-full text-white text-sm font-bold flex-shrink-0"
              style={{ minWidth: '28px', minHeight: '28px', backgroundColor: accentColor }}
            >
              {globalNum}
            </span>
            <span className="flex-1"><RenderHtml html={q.question_text || ''} /></span>
            <select 
              className="px-4 py-1.5 border border-gray-300 rounded bg-white outline-none min-w-[100px]"
              style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
            >
              <option value="">Select</option>
              {(group.shared_options || []).map(opt => (
                <option key={opt.label} value={opt.label}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      });
    }

    // Short Answer: Question text on top, numbered input below
    if (type === 'short_answer') {
      return groupQuestions.map(q => {
        const globalNum = globalOffset + q.question_number;
        return (
          <div key={q.id} className="py-3" style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}>
            {/* Question text - styled bold text */}
            <p style={{
              color: 'rgb(40, 40, 40)',
              fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: '24px',
              marginTop: '10px',
              marginBottom: '10px'
            }}>
              <RenderHtml html={q.question_text || ''} />
            </p>
            {/* Answer input with question number in front */}
            <div className="flex items-center gap-2 mt-2">
              <span 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  minHeight: '28px',
                  backgroundColor: accentColor,
                  borderRadius: '50%',
                  color: 'rgb(255, 255, 255)',
                  fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {globalNum}
              </span>
              <input 
                type="text" 
                className="w-36 px-4 py-1.5 text-sm text-center bg-white outline-none"
                style={{ 
                  fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                  borderRadius: '12px',
                  border: '1px solid rgb(209, 213, 219)'
                }}
                placeholder=""
              />
            </div>
          </div>
        );
      });
    }

    // Map/Diagram Labeling (default)
    return groupQuestions.map(q => {
      const globalNum = globalOffset + q.question_number;
      return (
        <div key={q.id} className="py-3 flex items-center gap-3" style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}>
          <span 
            className="w-7 h-7 flex items-center justify-center rounded-full text-white text-sm font-bold flex-shrink-0"
            style={{ minWidth: '28px', minHeight: '28px', backgroundColor: accentColor }}
          >
            {globalNum}
          </span>
          <span className="flex-1"><RenderHtml html={q.question_text || ''} /></span>
          <input 
            type="text" 
            className="px-4 py-1.5 border border-gray-300 rounded w-32 outline-none"
            style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
            placeholder=""
          />
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Preview Mode</h2>
            <p className="text-sm text-gray-500">Student view of the exam</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <EyeOff size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => setSelectedPart(num)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                selectedPart === num 
                  ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Part {num}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentSection ? (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {currentSection.title || `Part ${selectedPart}`}
              </h3>

              {currentGroups.length > 0 ? (
                currentGroups.map(group => {
                  const groupQuestions = questions
                    .filter(q => q.section_id === currentSection.id && 
                      q.question_number >= group.question_range_start && 
                      q.question_number <= group.question_range_end)
                    .sort((a, b) => a.question_number - b.question_number);

                  const globalOffset = (selectedPart - 1) * 10;
                  
                  // Build exampleOptions from option_a, option_b, etc.
                  const exampleData = group.example_data || {};
                  const exampleOptions = [];
                  ['a', 'b', 'c', 'd'].forEach(letter => {
                    if (exampleData[`option_${letter}`]) {
                      exampleOptions.push(exampleData[`option_${letter}`]);
                    }
                  });
                  // Fallback to options array if exists
                  if (exampleOptions.length === 0 && exampleData.options) {
                    exampleOptions.push(...exampleData.options);
                  }

                  return (
                    <div 
                      key={group.id} 
                      className="mb-8 pb-6 border-b border-gray-100 last:border-0"
                      style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
                    >
                      {/* Questions header - accent color, Montserrat font */}
                      <p style={{
                        color: 'rgb(50, 180, 200)',
                        fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
                        fontSize: '20px',
                        fontWeight: 700,
                        lineHeight: '24px',
                        marginTop: '10px',
                        marginBottom: '10px'
                      }}>
                        Questions {globalOffset + group.question_range_start}–{globalOffset + group.question_range_end}
                      </p>
                      
                      {/* Instruction text - render as HTML, no container */}
                      {group.instruction_text && (
                        <div 
                          className="mb-4 [&>*]:m-0"
                          style={{ color: 'rgb(40, 40, 40)', fontSize: '14px', lineHeight: '21px' }}
                          dangerouslySetInnerHTML={{ __html: group.instruction_text }}
                        />
                      )}

                      {group.question_type === 'matching' && group.shared_options?.length > 0 && (
                        <div className="bg-purple-50 rounded-lg p-4 mb-4">
                          <p className="text-sm font-semibold text-purple-700 mb-2">Options:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {group.shared_options.map(opt => (
                              <div key={opt.label} className="flex items-start gap-2">
                                <span className="font-bold text-purple-700">{opt.label}</span>
                                <span className="text-sm">{opt.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {group.question_type === 'map_labeling' && group.image_url && (
                        <div className="mb-4">
                          <img src={group.image_url} alt="Map/Diagram" className="max-h-64 mx-auto rounded-lg border" />
                        </div>
                      )}

                      {/* Example section - styled as requested */}
                      {group.has_example && group.example_data && (
                        <div className="mb-6 text-gray-700">
                          {/* Example header - italic, underlined, bold */}
                          <p className="font-bold italic underline mb-3">Example:</p>
                          
                          {/* Example question text - italic, render HTML */}
                          {(group.example_data.stem || group.example_data.question_text) && (
                            <p 
                              className="italic mb-3 [&>*]:m-0"
                              dangerouslySetInnerHTML={{ __html: group.example_data.stem || group.example_data.question_text }}
                            />
                          )}
                          
                          {/* Example options - simple A. B. C. format (no circles) */}
                          {exampleOptions.length > 0 && (
                            <div className="space-y-2 ml-4">
                              {exampleOptions.map((opt, idx) => {
                                const letter = String.fromCharCode(65 + idx);
                                const optText = typeof opt === 'object' ? (opt.text || opt.label || '') : opt;
                                const correctAnswer = group.example_data.answer || group.example_data.correct_answer;
                                const isCorrect = correctAnswer === letter || correctAnswer === optText || correctAnswer === String(idx);
                                return (
                                  <p key={idx} className={`italic ${isCorrect ? 'font-bold' : ''}`}>
                                    {letter}. {optText}
                                  </p>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        {renderQuestionGroup(group, groupQuestions, globalOffset)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">No question groups in this part</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Section not found</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function ListeningTab() {
  const { sections } = useExamEditor();
  const [showPreview, setShowPreview] = useState(false);

  const listeningSections = sections
    .filter(s => s.module_type === 'listening')
    .sort((a, b) => a.section_order - b.section_order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Listening</h2>
          <p className="text-sm text-gray-500 mt-1">4 parts • 40 questions • ~30 minutes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Eye size={18} /> Preview
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
            <Mic size={16} /> IELTS
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
        <HelpCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-amber-800 font-medium">Creating an IELTS Listening Test</p>
          <ol className="text-xs text-amber-700 mt-2 space-y-1 list-decimal list-inside">
            <li>Configure global audio settings (or add separate audio per part)</li>
            <li>For each Part, add Question Groups with specific question types</li>
            <li>Within each group, add questions matching the IELTS format</li>
            <li>Use [BLANK] marker for inline completion questions</li>
          </ol>
        </div>
      </div>

      <GlobalAudioSettings />

      <div className="space-y-5">
        {listeningSections.length > 0 ? (
          listeningSections.map((section, idx) => (
            <PartCard key={section.id} section={section} partNumber={idx + 1} />
          ))
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Mic size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No listening sections found</p>
            <p className="text-xs text-gray-400 mt-1">Sections should be initialized automatically</p>
          </div>
        )}
      </div>

      <PreviewMode isOpen={showPreview} onClose={() => setShowPreview(false)} />
    </div>
  );
}
