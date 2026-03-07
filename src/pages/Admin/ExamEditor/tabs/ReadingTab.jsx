import React, { useState, useRef, useEffect } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { API_URL } from "../../../../api";
import RichTextEditor from "../../../../components/RichTextEditor/RichTextEditor";
import { 
  ChevronDown, ChevronUp, Plus, Trash2, BookOpen, CheckCircle, 
  HelpCircle, Target, List, ArrowRightLeft, FileText, 
  Type, Table2, MapPin, MessageSquare, Info, Upload, Eye, EyeOff
} from "lucide-react";

// ============================================
// QUESTION TYPE DEFINITIONS
// ============================================
const QUESTION_TYPES = [
  { value: "multiple_choice_single", label: "Multiple Choice (Single)", icon: Target, hint: "Student selects ONE correct answer from A-D options" },
  { value: "multiple_choice_multiple", label: "Multiple Choice (Multiple)", icon: List, hint: "Student selects TWO or more correct answers" },
  { value: "true_false_not_given", label: "True/False/Not Given", icon: CheckCircle, hint: "Factual statements" },
  { value: "yes_no_not_given", label: "Yes/No/Not Given", icon: HelpCircle, hint: "Writer's views/claims" },
  { value: "matching_headings", label: "Matching Headings", icon: Type, hint: "Match paragraph letters to headings" },
  { value: "matching_information", label: "Matching Information", icon: ArrowRightLeft, hint: "Match statements to paragraphs" },
  { value: "matching_features", label: "Matching Features", icon: ArrowRightLeft, hint: "Match items to categories" },
  { value: "matching_sentence_endings", label: "Matching Sentence Endings", icon: ArrowRightLeft, hint: "Match sentence beginnings to endings" },
  { value: "summary_completion", label: "Summary Completion", icon: FileText, hint: "Fill gaps in a summary" },
  { value: "sentence_completion", label: "Sentence Completion", icon: Type, hint: "Complete sentences with words from passage" },
  { value: "table_completion", label: "Table Completion", icon: Table2, hint: "Fill missing cells in a table" },
  { value: "diagram_labeling", label: "Diagram Labeling", icon: MapPin, hint: "Label parts of a diagram" },
  { value: "short_answer", label: "Short Answer", icon: MessageSquare, hint: "Answer questions with words from passage" },
];

// ============================================
// STYLED COMPONENTS
// ============================================
const Input = ({ label, hint, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <input className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition" {...props} />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const TextArea = ({ label, hint, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <textarea className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition resize-none" {...props} />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Select = ({ label, hint, options, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <select className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition" {...props}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div className={`w-9 h-5 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-gray-300'} relative`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </div>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

// ============================================
// RICH TEXT EDITOR
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
            className="px-2 py-1 rounded hover:bg-emerald-100 text-emerald-700 transition text-xs font-medium border border-emerald-300 bg-emerald-50"
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
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-b-lg text-sm text-gray-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition overflow-auto"
        style={{ minHeight: props.rows ? `${props.rows * 24}px` : '60px' }}
        suppressContentEditableWarning
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
};

const RenderHtml = ({ html }) => <span dangerouslySetInnerHTML={{ __html: html || '' }} />;

// ============================================
// BLANK INPUT COMPONENT - Circle number + rounded rectangular input
// ============================================
const BlankInput = ({ questionNumber, accentColor = 'rgb(50, 180, 200)' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '2px 4px' }}>
    {/* Circle with question number */}
    <span style={{ 
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
      margin: '2px 0px' 
    }}>
      {questionNumber}
    </span>
    {/* Input field */}
    <input 
      placeholder="" 
      title="Max 2 words + 1 number" 
      type="text" 
      style={{ 
        width: '200px',
        height: '32px',
        padding: '0 20px 0 10px',
        border: '1px solid rgb(189, 197, 207)',
        borderRadius: '100px',
        fontSize: '14px',
        fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
        boxShadow: 'rgba(0, 0, 0, 0.075) 0px 1px 1px 0px inset',
        textOverflow: 'ellipsis',
        color: 'rgb(40, 40, 40)',
        lineHeight: '20px',
        cursor: 'default',
        margin: '5px 0',
        transition: 'border-color 0.15s ease-in-out',
        display: 'inline-block',
        textAlign: 'start',
        outline: 'none'
      }} 
    />
  </span>
);

// Render template with proper blank inputs
const renderTemplateWithBlanks = (template, questionNumber, accentColor) => {
  if (!template) return null;
  const parts = template.split('[BLANK]');
  return parts.map((part, idx, arr) => (
    <React.Fragment key={idx}>
      <RenderHtml html={part} />
      {idx < arr.length - 1 && <BlankInput questionNumber={questionNumber} accentColor={accentColor} />}
    </React.Fragment>
  ));
};

// ============================================
// IMAGE UPLOADER
// ============================================
const ImageUploader = ({ group, updateGroup, imageUrl, onImageChange, description, onDescriptionChange }) => {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('Starting image upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadUrl: `${API_URL}/upload/passage-image`
    });
    
    setUploading(true);
    setError("");
    try {
      const token = localStorage.getItem('ielts_token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const formData = new FormData();
      formData.append("image", file);
      
      console.log('Sending upload request...');
      const response = await fetch(`${API_URL}/upload/passage-image`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      console.log('Upload response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload error response:', errorData);
        
        if (response.status === 401) {
          throw new Error('Session expired. Please logout and login again.');
        }
        
        throw new Error(errorData.error || errorData.message || `Upload failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Upload success:', result);
      
      const { url } = result;
      if (group) {
        updateGroup(group.id, { image_url: url });
      } else if (onImageChange) {
        onImageChange(url);
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const currentImageUrl = group ? group.image_url : imageUrl;
  const currentDescription = group ? group.image_description : description;

  const handleUrlChange = (url) => {
    if (group) {
      updateGroup(group.id, { image_url: url });
    } else if (onImageChange) {
      onImageChange(url);
    }
  };

  const handleDescriptionChange = (desc) => {
    if (group) {
      updateGroup(group.id, { image_description: desc });
    } else if (onDescriptionChange) {
      onDescriptionChange(desc);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 mt-4">
      <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{group ? 'Group Image' : 'Passage Image'}</h5>
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none" placeholder="https://example.com/image.png or click upload" value={currentImageUrl || ""} onChange={(e) => handleUrlChange(e.target.value)} />
        <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      </div>
      <textarea className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none resize-none" placeholder="Image description (for accessibility)" rows={2} value={currentDescription || ""} onChange={(e) => handleDescriptionChange(e.target.value)} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {currentImageUrl && (
        <div className="bg-white rounded-lg border border-blue-200 p-2">
          <img src={currentImageUrl} alt={currentDescription || "Preview"} className="max-h-48 mx-auto rounded" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
};

// ============================================
// PARAGRAPH LETTERING INFO
// ============================================
const ParagraphLetteringInfo = ({ content }) => {
  if (!content) return null;
  
  // Use same detection logic as preview
  const detectParagraphLetters = (content) => {
    if (!content) return [];
    // Strip HTML tags and normalize whitespace
    const textOnly = content.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\r/g, '\n');
    
    // Split into lines and look for paragraph markers
    const lines = textOnly.split('\n');
    const letters = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match patterns like "A. text" or "A) text" at the start
      const match = trimmed.match(/^([A-Z])[\.\)]\s+/);
      if (match) {
        letters.push(match[1]);
      }
    }
    
    return [...new Set(letters)].sort();
  };
  
  const letters = detectParagraphLetters(content);
  if (letters.length === 0) return null;
  
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
      <h5 className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-2"><Info size={14} />Paragraph Letters (Auto-detected)</h5>
      <p className="text-xs text-purple-600 mb-2">{letters.length} paragraph{letters.length !== 1 ? 's' : ''} detected in this passage</p>
      <div className="flex flex-wrap gap-2">
        {letters.map(letter => (
          <span key={letter} className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono text-xs font-bold">{letter}</span>
        ))}
      </div>
      <p className="text-xs text-purple-600 mt-2">Format paragraphs as: <code className="bg-purple-100 px-1 rounded">A. text...</code> or <code className="bg-purple-100 px-1 rounded">A) text...</code></p>
    </div>
  );
};

// ============================================
// QUESTION EDITOR BY TYPE
// ============================================
const QuestionEditor = ({ question, questionNumber, groupType, updateQuestion, deleteQuestion, passageLetters = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Strip HTML tags for display in collapsed view
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white border-gray-200">
      <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs bg-emerald-100 text-emerald-700">{questionNumber}</span>
          <div>
            <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{stripHtml(question.question_text) || 'Question ' + questionNumber}</p>
            {question.correct_answer && <p className="text-xs text-green-600">Answer: {question.correct_answer}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {question.correct_answer && <CheckCircle size={16} className="text-green-500" />}
          <button type="button" onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition">
            <Trash2 size={16} />
          </button>
          <ChevronDown size={18} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-4 border-t border-gray-100 space-y-4 bg-gray-50">
          {/* Multiple Choice Single */}
          {groupType === 'multiple_choice_single' && (
            <>
              <RichTextArea label="Question Text" placeholder="What is the main idea?" rows={3} value={question.question_text || ""} onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })} />
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-500 uppercase">Options</label>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => {
                  const optionValue = question[`option_${letter.toLowerCase()}`];
                  // Always show A-D, show E-H only if they have content or if previous letter has content
                  const prevLetter = String.fromCharCode(letter.charCodeAt(0) - 1);
                  const showOption = ['A', 'B', 'C', 'D'].includes(letter) || 
                                    optionValue || 
                                    (prevLetter >= 'A' && question[`option_${prevLetter.toLowerCase()}`]);
                  if (!showOption) return null;
                  
                  return (
                    <div key={letter} className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuestion(question.id, { correct_answer: letter })} className={`w-8 h-8 flex-shrink-0 font-bold rounded transition ${question.correct_answer === letter ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{letter}</button>
                      <input className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-400 outline-none" placeholder={`Option ${letter}`} value={optionValue || ""} onChange={(e) => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: e.target.value })} />
                      {!['A', 'B', 'C', 'D'].includes(letter) && optionValue && (
                        <button type="button" onClick={() => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: '' })} className="p-2 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Multiple Choice Multiple */}
          {groupType === 'multiple_choice_multiple' && (
            <>
              <RichTextArea label="Question Text" placeholder="Which TWO of the following are mentioned?" rows={3} value={question.question_text || ""} onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })} />
              <Input label="Correct Answers (comma-separated, e.g., A,C)" placeholder="A,C" value={question.correct_answer || ""} onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })} />
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-500 uppercase">Options</label>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => {
                  const optionValue = question[`option_${letter.toLowerCase()}`];
                  // Always show A-D, show E-H only if they have content or if previous letter has content
                  const prevLetter = String.fromCharCode(letter.charCodeAt(0) - 1);
                  const showOption = ['A', 'B', 'C', 'D'].includes(letter) || 
                                    optionValue || 
                                    (prevLetter >= 'A' && question[`option_${prevLetter.toLowerCase()}`]);
                  if (!showOption) return null;
                  
                  return (
                    <div key={letter} className="flex items-center gap-2">
                      <span className="w-8 h-8 flex-shrink-0 font-bold rounded bg-gray-100 text-gray-600 flex items-center justify-center">{letter}</span>
                      <input className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-400 outline-none" placeholder={`Option ${letter}`} value={optionValue || ""} onChange={(e) => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: e.target.value })} />
                      {!['A', 'B', 'C', 'D'].includes(letter) && optionValue && (
                        <button type="button" onClick={() => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: '' })} className="p-2 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* True/False/Not Given */}
          {groupType === 'true_false_not_given' && (
            <>
              <RichTextArea label="Statement" placeholder="The study was conducted in 2020." rows={2} value={question.question_text || ""} onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })} />
              <Select label="Correct Answer" value={question.correct_answer || ""} onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })} options={[
                { value: "", label: "Select answer..." },
                { value: "TRUE", label: "TRUE" },
                { value: "FALSE", label: "FALSE" },
                { value: "NOT GIVEN", label: "NOT GIVEN" }
              ]} />
            </>
          )}

          {/* Yes/No/Not Given */}
          {groupType === 'yes_no_not_given' && (
            <>
              <RichTextArea label="Statement (Writer's view/claim)" placeholder="The author believes technology improves education." rows={2} value={question.question_text || ""} onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })} />
              <Select label="Correct Answer" value={question.correct_answer || ""} onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })} options={[
                { value: "", label: "Select answer..." },
                { value: "YES", label: "YES" },
                { value: "NO", label: "NO" },
                { value: "NOT GIVEN", label: "NOT GIVEN" }
              ]} />
            </>
          )}

          {/* Matching types */}
          {(groupType === 'matching_headings' || groupType === 'matching_information' || groupType === 'matching_features' || groupType === 'matching_sentence_endings') && (
            <>
              <RichTextArea label="Item/Statement Text" placeholder="The historical development of the technique" rows={2} value={question.question_text || ""} onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })} />
              <div>
                <Input label="Correct Answer (Letter)" placeholder="C" value={question.correct_answer || ""} onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value.toUpperCase() })} />
                {passageLetters.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Detected paragraph letters:</span>
                    <div className="flex flex-wrap gap-1">
                      {passageLetters.map(letter => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => updateQuestion(question.id, { correct_answer: letter })}
                          className={`px-2 py-1 text-xs font-bold rounded transition ${
                            question.correct_answer === letter
                              ? 'bg-green-500 text-white'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Summary/Sentence/Diagram/Short Answer */}
          {(groupType === 'summary_completion' || groupType === 'sentence_completion' || groupType === 'diagram_labeling' || groupType === 'short_answer') && (
            <>
              {groupType === 'short_answer' ? (
                <RichTextArea label="Question" placeholder="What is the name of the technique?" rows={2} value={question.question_text || ""} onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })} />
              ) : (
                <RichTextArea label={groupType === 'diagram_labeling' ? 'Label position/description' : 'Text with blank'} placeholder={groupType === 'diagram_labeling' ? 'Arrow pointing to [BLANK]' : 'The technique was developed in [BLANK].'} rows={2} value={question.question_template || question.question_text || ""} onChange={(e) => updateQuestion(question.id, { question_template: e.target.value, question_text: e.target.value })} showBlankButton={true} />
              )}
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Preview (Q{questionNumber}):</p>
                <p className="text-sm text-gray-700">{question.question_template ? renderTemplateWithBlanks(question.question_template, questionNumber) : question.question_text || 'Enter question text'}</p>
              </div>
              <Input label="Correct Answer" placeholder="e.g., photosynthesis, 1990" value={question.correct_answer || ""} onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })} />
              <Input label="Alternative Answers (comma-separated)" placeholder="e.g., photo-synthesis, Photosynthesis" value={(question.answer_alternatives || []).join(', ')} onChange={(e) => updateQuestion(question.id, { answer_alternatives: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
            </>
          )}

          {/* Table Completion */}
          {groupType === 'table_completion' && (
            <>
              <Input label="Table Row Label" placeholder="e.g., Year, Location" value={question.label_text || ""} onChange={(e) => updateQuestion(question.id, { label_text: e.target.value })} />
              <RichTextArea label="Cell content with blank" placeholder="Started in [BLANK]" rows={2} value={question.question_template || ""} onChange={(e) => updateQuestion(question.id, { question_template: e.target.value })} showBlankButton={true} />
              <Input label="Correct Answer" placeholder="e.g., 1990, London" value={question.correct_answer || ""} onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// QUESTION GROUP CARD
// ============================================
const QuestionGroupCard = ({ group, sectionId, passageNumber, passageLetters }) => {
  const { questions, setQuestions, updateQuestionGroup, deleteQuestionGroup } = useExamEditor();
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedType = QUESTION_TYPES.find(t => t.value === group.question_type);
  const Icon = selectedType?.icon || HelpCircle;

  const groupQuestions = questions
    .filter(q => q.section_id === sectionId && q.question_number >= group.question_range_start && q.question_number <= group.question_range_end)
    .sort((a, b) => a.question_number - b.question_number);

  const baseQuestionNumber = (passageNumber - 1) * 13 + group.question_range_start;

  const addQuestion = () => {
    const nextNumber = groupQuestions.length > 0 ? Math.max(...groupQuestions.map(q => q.question_number)) + 1 : group.question_range_start;
    if (nextNumber > group.question_range_end) {
      alert(`Cannot add more questions. Group range is ${group.question_range_start}-${group.question_range_end}`);
      return;
    }

    const newQuestion = {
      id: `temp_${Date.now()}`,
      section_id: sectionId,
      group_id: group.id,
      question_type: group.question_type,
      question_number: nextNumber,
      question_text: '',
      correct_answer: '',
      points: group.points_per_question || 1
    };

    setQuestions(prev => [...prev, newQuestion]);
  };

  const deleteQuestion = (questionId) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId, updates) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-emerald-600" />
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">{selectedType?.label || 'Select Type'} · Q{baseQuestionNumber}–{baseQuestionNumber + (group.question_range_end - group.question_range_start)}</h4>
            <p className="text-xs text-gray-500">{groupQuestions.length}/{group.question_range_end - group.question_range_start + 1} questions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); deleteQuestionGroup(group.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
          <ChevronDown size={20} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Question Range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Question"
              type="number"
              min="1"
              max="13"
              value={group.question_range_start || 1}
              onChange={(e) => updateQuestionGroup(group.id, { question_range_start: parseInt(e.target.value) || 1 })}
            />
            <Input
              label="To Question"
              type="number"
              min="1"
              max="13"
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
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-emerald-600' : 'text-gray-400'} />
                    <span className="text-xs font-medium truncate">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedType && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-center gap-2"><Info size={14} />{selectedType.hint}</p>
            </div>
          )}

          {/* Instruction Text */}
          <RichTextArea
            label="Instruction Text"
            hint="IELTS-style instruction shown to students. Use formatting toolbar above."
            placeholder="Read the text and answer questions..."
            rows={3}
            value={group.instruction_text || ""}
            onChange={(e) => updateQuestionGroup(group.id, { instruction_text: e.target.value })}
          />

          {(group.question_type === 'diagram_labeling' || group.question_type === 'table_completion') && (
            <ImageUploader group={group} updateGroup={updateQuestionGroup} />
          )}

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

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-gray-700">Questions in this Group</h5>
              <button type="button" onClick={addQuestion} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition"><Plus size={14} /> Add Question</button>
            </div>

            {groupQuestions.length > 0 ? (
              <div className="space-y-3">
                {groupQuestions.map((question, idx) => (
                  <QuestionEditor key={question.id} question={question} questionNumber={baseQuestionNumber + idx} groupType={group.question_type} updateQuestion={updateQuestion} deleteQuestion={deleteQuestion} passageLetters={passageLetters} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-500">No questions yet. Click "Add Question" to start.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// PASSAGE (SECTION) CARD
// ============================================
const PassageCard = ({ section, passageNumber, passageLetters }) => {
  const { updateSection, questionGroups, addQuestionGroup } = useExamEditor();
  const [isExpanded, setIsExpanded] = useState(true);

  const sectionGroups = questionGroups.filter(g => g.section_id === section.id).sort((a, b) => a.group_order - b.group_order);
  
  // Detect paragraph letters from this section's content
  const detectParagraphLetters = (content) => {
    if (!content) return [];
    // Strip HTML tags and normalize whitespace
    const textOnly = content.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\r/g, '\n');
    
    // Split into lines and look for paragraph markers
    const lines = textOnly.split('\n');
    const letters = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match patterns like "A. text" or "A) text" at the start
      const match = trimmed.match(/^([A-Z])[\.\)]\s+/);
      if (match) {
        letters.push(match[1]);
      }
    }
    
    return [...new Set(letters)].sort();
  };
  
  const paragraphLettersForThisSection = detectParagraphLetters(section.content);

  const colors = [
    { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  ][passageNumber - 1];

  const addNewGroup = () => {
    const existingRanges = sectionGroups.map(g => ({ start: g.question_range_start, end: g.question_range_end }));
    let nextStart = 1;
    for (const range of existingRanges.sort((a, b) => a.start - b.start)) {
      if (range.start > nextStart) break;
      nextStart = range.end + 1;
    }
    if (nextStart > 13) {
      alert('All questions (1-13) in this passage are already assigned to groups.');
      return;
    }

    addQuestionGroup(section.id, {
      question_range_start: nextStart,
      question_range_end: Math.min(nextStart + 2, 13),
      question_type: 'multiple_choice_single',
      instruction_text: '',
      points_per_question: 1,
      group_order: sectionGroups.length + 1
    });
  };

  const wordCount = section.content ? section.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${colors.bg} text-white font-bold text-xl`}>{passageNumber}</div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{section.title || `Passage ${passageNumber}`}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm text-gray-500">{wordCount} words</span>
              <span className="text-sm text-gray-500">•</span>
              <span className={`text-xs px-2 py-0.5 rounded ${colors.light} ${colors.text}`}>{sectionGroups.length} groups</span>
            </div>
          </div>
        </div>
        <ChevronDown size={22} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <>
          <div className={`px-5 py-4 ${colors.light} border-t ${colors.border}`}>
            <Input label="Passage Title" placeholder="e.g., The History of Coffee" value={section.title || ""} onChange={(e) => updateSection(section.id, { title: e.target.value })} />
            <RichTextArea 
              label="Instruction Text" 
              hint="e.g., 'You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.'"
              placeholder="Enter the instruction text that appears before the passage"
              rows={2}
              value={section.instruction || ""} 
              onChange={(e) => updateSection(section.id, { instruction: e.target.value })} 
              className="mt-4"
              showBlankButton={false}
            />
            <ImageUploader imageUrl={section.image_url} onImageChange={(url) => updateSection(section.id, { image_url: url })} description={section.image_description} onDescriptionChange={(desc) => updateSection(section.id, { image_description: desc })} />
            
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Passage Content
                <span className="text-gray-400 ml-2 normal-case text-[10px]">700-900 words recommended. Use alignment buttons to align specific paragraphs.</span>
              </label>
              <RichTextEditor
                content={section.content || ""}
                onChange={(html) => updateSection(section.id, { content: html })}
                placeholder="Paste or type the reading passage here..."
                minHeight="400px"
              />
            </div>
            <div className="flex justify-end items-center mt-2">
              <span className={`text-xs font-medium ${wordCount >= 700 && wordCount <= 900 ? 'text-green-600' : wordCount >= 400 ? 'text-amber-600' : 'text-gray-400'}`}>{wordCount} words</span>
            </div>
            <ParagraphLetteringInfo content={section.content} />
          </div>

          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-700">Question Groups</h4>
              <button type="button" onClick={addNewGroup} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition"><Plus size={16} /> Add Group</button>
            </div>

            {sectionGroups.length > 0 ? (
              <div className="space-y-4">
                {sectionGroups.map((group) => (
                  <QuestionGroupCard key={group.id} group={group} sectionId={section.id} passageNumber={passageNumber} passageLetters={paragraphLettersForThisSection} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <BookOpen size={28} className="mx-auto text-gray-300 mb-2" />
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
// PREVIEW MODE
// ============================================
const PreviewMode = ({ isOpen, onClose }) => {
  const { sections, questions, questionGroups } = useExamEditor();
  const [selectedPassage, setSelectedPassage] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});

  const readingSections = sections.filter(s => s.module_type === 'reading').sort((a, b) => a.section_order - b.section_order);
  const passageLetters = Array.from({ length: readingSections.length }, (_, i) => String.fromCharCode(65 + i));
  const currentSection = readingSections[selectedPassage - 1];
  const currentGroups = questionGroups.filter(g => g.section_id === currentSection?.id).sort((a, b) => a.group_order - b.group_order);

  // Accent colors for each passage - all use same green for consistency
  const accentColors = [
    'rgb(55, 133, 77)',   // Passage 1: Green
    'rgb(55, 133, 77)',   // Passage 2: Green
    'rgb(55, 133, 77)'    // Passage 3: Green
  ];
  const accentColor = accentColors[selectedPassage - 1] || accentColors[0];

  if (!isOpen) return null;

  // Detect paragraph letters from content
  const detectParagraphLetters = (content) => {
    if (!content) return [];
    // Strip HTML tags and normalize whitespace
    const textOnly = content.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\r/g, '\n');
    
    // Split into lines and look for paragraph markers at the start of lines
    // Pattern: optional whitespace, then capital letter, then . or ), then whitespace
    const lines = textOnly.split('\n');
    const letters = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match patterns like "A. text" or "A) text" at the start
      const match = trimmed.match(/^([A-Z])[\.\)]\s+/);
      if (match) {
        letters.push(match[1]);
      }
    }
    
    // Remove duplicates and sort
    const uniqueLetters = [...new Set(letters)].sort();
    
    console.log('Paragraph detection debug:', {
      contentLength: content?.length,
      textOnlyPreview: textOnly.substring(0, 300),
      totalLines: lines.length,
      matchedLines: lines.filter(l => l.trim().match(/^([A-Z])[\.\)]\s+/)).map(l => l.trim().substring(0, 50)),
      lettersDetected: uniqueLetters
    });
    
    return uniqueLetters;
  };

  const paragraphLetters = detectParagraphLetters(currentSection?.content);

  const renderQuestionGroup = (group, groupQuestions, globalOffset, accentColor) => {
    const groupType = group.question_type;
    const qStart = globalOffset + group.question_range_start;
    const qEnd = globalOffset + group.question_range_end;

    // True/False/Not Given Table
    if (groupType === 'true_false_not_given' || groupType === 'yes_no_not_given') {
      const isYesNo = groupType === 'yes_no_not_given';
      return (
        <div>
          <div style={{ border: '1px solid rgb(221, 221, 221)', borderRadius: '10px', padding: '10px', marginBottom: '20px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              <tr style={{ backgroundColor: 'rgb(245, 245, 245)' }}>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', width: '148.5px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <strong>{isYesNo ? 'YES.' : 'TRUE.'}</strong>
                </td>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', verticalAlign: 'top' }}>
                  if the statement agrees with the information
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <strong>{isYesNo ? 'NO.' : 'FALSE.'}</strong>
                </td>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', verticalAlign: 'top' }}>
                  if the statement contradicts the information
                </td>
              </tr>
              <tr style={{ backgroundColor: 'rgb(245, 245, 245)' }}>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <strong>NOT GIVEN.</strong>
                </td>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', verticalAlign: 'top' }}>
                  if there is no information on this
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <div className="space-y-3">
            {groupQuestions.map((q, idx) => {
              const qNum = globalOffset + q.question_number;
              return (
                <div key={q.id} className="flex items-center gap-3">
                  <span className="font-bold text-gray-700" style={{ minWidth: '30px', display: 'inline-block' }}>{qNum}.</span>
                  <div className="flex items-center gap-2 flex-1">
                    <select style={{ width: '100px', height: '32px', padding: '0 20px 0 10px', border: '1px solid rgb(189, 197, 207)', borderRadius: '100px', fontSize: '14px', fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', appearance: 'none', backgroundImage: 'url(data:image/svg+xml,%3C%3Fxml version=\'1.0\' encoding=\'utf-8\'%3F%3E%3C!-- Generator: Adobe Illustrator 24.2.3, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version=\'1.1\' id=\'Layer_1\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' x=\'0px\' y=\'0px\' width=\'12px\' height=\'4px\' viewBox=\'0 0 17.5 9.5\' style=\'enable-background:new 0 0 17.5 9.5;\' xml:space=\'preserve\'%3E%3Cstyle type=\'text/css\'%3E .st0%7Bfill-rule:evenodd;clip-rule:evenodd;%7D%0A%3C/style%3E%3Cg id=\'Arrow_x2F_Chevrons\'%3E%3Cpath fill=\'%23294563\' id=\'Vector__x28_Stroke_x29_\' class=\'st0\' d=\'M0.2,0.2c0.3-0.3,0.8-0.3,1.1,0l7.5,7.5l7.5-7.5c0.3-0.3,0.8-0.3,1.1,0 s0.3,0.8,0,1.1l-8,8C9,9.6,8.5,9.6,8.2,9.3l-8-8C-0.1,1-0.1,0.5,0.2,0.2z\'/%3E%3C/g%3E%3C/svg%3E%0A)', backgroundPosition: 'calc(100% - 10px) 50%', backgroundRepeat: 'no-repeat', boxShadow: 'rgba(0, 0, 0, 0.075) 0px 1px 1px 0px inset', textOverflow: 'ellipsis', color: 'rgb(40, 40, 40)', lineHeight: '20px', cursor: 'default', margin: '5px 0', transition: 'border-color 0.15s ease-in-out', verticalAlign: 'middle', display: 'inline-block', textAlign: 'start' }}>
                      <option value="" style={{ display: 'none' }} disabled selected></option>
                      <option value="true">{isYesNo ? 'YES' : 'TRUE'}</option>
                      <option value="false">{isYesNo ? 'NO' : 'FALSE'}</option>
                      <option value="not_given">NOT GIVEN</option>
                    </select>
                    <p className="flex-1"><RenderHtml html={q.question_text || ''} /></p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {groupQuestions.map((q, idx) => {
          const qNum = globalOffset + q.question_number;

          // Multiple Choice - Show each question separately like listening
          if (groupType === 'multiple_choice_single' || groupType === 'multiple_choice_multiple') {
            const isMultiple = groupType === 'multiple_choice_multiple';
            
            return (
              <div key={q.id} className="py-2" style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}>
                {/* Question number and text - hide number for multiple choice multiple */}
                {!isMultiple && (
                  <p style={{
                    color: 'rgb(40, 40, 40)',
                    fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    lineHeight: '24px',
                    marginTop: '10px',
                    marginBottom: '10px'
                  }}>
                    {qNum}. <RenderHtml html={q.question_text || ''} />
                  </p>
                )}
                {isMultiple && (
                  <p style={{
                    color: 'rgb(40, 40, 40)',
                    fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '24px',
                    marginTop: '10px',
                    marginBottom: '10px'
                  }}>
                    <RenderHtml html={q.question_text || ''} />
                  </p>
                )}
                {/* Options */}
                <div className="ml-4 space-y-2">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => {
                    const optText = q[`option_${letter.toLowerCase()}`];
                    if (!optText) return null;
                    const optionKey = `${q.id}-${letter}`;
                    const isSelected = selectedOptions[optionKey];
                    
                    return (
                      <label 
                        key={letter} 
                        className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          if (isMultiple) {
                            setSelectedOptions(prev => ({
                              ...prev,
                              [optionKey]: !prev[optionKey]
                            }));
                          } else {
                            // For single choice, clear others from this question
                            const newOptions = { ...selectedOptions };
                            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(l => {
                              delete newOptions[`${q.id}-${l}`];
                            });
                            newOptions[optionKey] = true;
                            setSelectedOptions(newOptions);
                          }
                        }}
                      >
                        {/* Letter circle */}
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
                        {/* Radio/Checkbox input */}
                        <input 
                          type={isMultiple ? "checkbox" : "radio"} 
                          checked={isSelected || false}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 pointer-events-none" 
                        />
                        {/* Option text */}
                        <span style={{ marginLeft: '4px' }}><RenderHtml html={optText} /></span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Matching Headings with dropdown
          if (groupType === 'matching_headings' || groupType === 'matching_information' || groupType === 'matching_features' || groupType === 'matching_sentence_endings') {
            return (
              <div key={q.id} className="flex items-center gap-3">
                <span className="font-bold text-gray-700" style={{ minWidth: '30px', display: 'inline-block' }}>{qNum}.</span>
                <div className="flex-1 flex items-center gap-2">
                  <select style={{ width: '100px', height: '32px', padding: '0 20px 0 10px', border: '1px solid rgb(189, 197, 207)', borderRadius: '100px', fontSize: '14px', fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', appearance: 'none', backgroundImage: 'url(data:image/svg+xml,%3C%3Fxml version=\'1.0\' encoding=\'utf-8\'%3F%3E%3C!-- Generator: Adobe Illustrator 24.2.3, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version=\'1.1\' id=\'Layer_1\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' x=\'0px\' y=\'0px\' width=\'12px\' height=\'4px\' viewBox=\'0 0 17.5 9.5\' style=\'enable-background:new 0 0 17.5 9.5;\' xml:space=\'preserve\'%3E%3Cstyle type=\'text/css\'%3E .st0%7Bfill-rule:evenodd;clip-rule:evenodd;%7D%0A%3C/style%3E%3Cg id=\'Arrow_x2F_Chevrons\'%3E%3Cpath fill=\'%23294563\' id=\'Vector__x28_Stroke_x29_\' class=\'st0\' d=\'M0.2,0.2c0.3-0.3,0.8-0.3,1.1,0l7.5,7.5l7.5-7.5c0.3-0.3,0.8-0.3,1.1,0 s0.3,0.8,0,1.1l-8,8C9,9.6,8.5,9.6,8.2,9.3l-8-8C-0.1,1-0.1,0.5,0.2,0.2z\'/%3E%3C/g%3E%3C/svg%3E%0A)', backgroundPosition: 'calc(100% - 10px) 50%', backgroundRepeat: 'no-repeat', boxShadow: 'rgba(0, 0, 0, 0.075) 0px 1px 1px 0px inset', textOverflow: 'ellipsis', color: 'rgb(40, 40, 40)', lineHeight: '20px', cursor: 'default', margin: '5px 0', transition: 'border-color 0.15s ease-in-out', verticalAlign: 'middle', display: 'inline-block', textAlign: 'start' }}>
                    <option value="" style={{ display: 'none' }} disabled selected></option>
                    {paragraphLetters.map(letter => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>
                  <p className="flex-1"><RenderHtml html={q.question_text || ''} /></p>
                </div>
              </div>
            );
          }

          // Sentence Completion - NO NUMBER PREFIX, just template with blanks
          if (groupType === 'sentence_completion') {
            return (
              <div key={q.id} className="mb-3">
                <div>{renderTemplateWithBlanks(q.question_template || q.question_text, qNum, accentColor)}</div>
              </div>
            );
          }

          // Other completion types with blanks
          if (['summary_completion', 'table_completion', 'diagram_labeling', 'note_completion', 'form_completion'].includes(groupType)) {
            return (
              <div key={q.id} className="flex items-start gap-3">
                <span className="font-bold text-gray-700">{qNum}.</span>
                <div>{renderTemplateWithBlanks(q.question_template || q.question_text, qNum, accentColor)}</div>
              </div>
            );
          }

          // Short answer
          if (groupType === 'short_answer') {
            return (
              <div key={q.id} className="flex items-start gap-3">
                <span className="font-bold text-gray-700">{qNum}.</span>
                <p><RenderHtml html={q.question_text || ''} /></p>
              </div>
            );
          }

          // Default
          return (
            <div key={q.id} className="flex items-start gap-3">
              <span className="font-bold text-gray-700">{qNum}.</span>
              <p><RenderHtml html={q.question_text || q.question_template || ''} /></p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <style>{`
        .reading-instruction p {
          margin-bottom: 5px !important;
        }
      `}</style>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div><h2 className="text-xl font-bold text-gray-800">Preview Mode</h2><p className="text-sm text-gray-500">Student view of the reading section</p></div>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"><EyeOff size={20} /></button>
        </div>

        <div className="flex border-b border-gray-200">
          {[1, 2, 3].map(num => (
            <button key={num} type="button" onClick={() => setSelectedPassage(num)} className={`flex-1 py-3 text-sm font-medium transition ${selectedPassage === num ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}>Passage {num}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentSection ? (
            <div>
              {/* IELTS-style headers */}
              <h1 style={{ fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', color: 'rgb(41, 69, 99)', margin: '0 0 5px 0', padding: 0, lineHeight: '28.8px', textAlign: 'left' }}>
                PART {selectedPassage}
              </h1>
              <h2 style={{ fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', color: 'rgb(41, 69, 99)', margin: '0 0 10px 0', padding: 0, lineHeight: '21.6px', textAlign: 'left' }}>
                READING PASSAGE {selectedPassage}
              </h2>
              {currentSection.instruction && (
                <div 
                  className="reading-instruction"
                  style={{ 
                    fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', 
                    fontSize: '14px', 
                    fontStyle: 'italic',
                    color: 'rgb(40, 40, 40)', 
                    marginBottom: '5px', 
                    lineHeight: '21px',
                    display: 'inline'
                  }}
                  dangerouslySetInnerHTML={{ __html: currentSection.instruction }}
                />
              )}
              
              <div className="mb-6">
                {currentSection.image_url && (
                  <img 
                    src={currentSection.image_url} 
                    alt={currentSection.image_description || 'Passage image'} 
                    style={{ maxWidth: '100%', display: 'block', verticalAlign: 'middle', marginBottom: '16px' }} 
                  />
                )}
                <h3 style={{ 
                  fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
                  fontSize: '26px', 
                  fontWeight: 700, 
                  textTransform: 'uppercase',
                  color: 'rgb(41, 69, 99)', 
                  marginBottom: '10px', 
                  lineHeight: '31.2px',
                  textAlign: 'center'
                }}>
                  {currentSection.title || `Passage ${selectedPassage}`}
                </h3>
                <div 
                  style={{ 
                    fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', 
                    fontSize: '16px', 
                    color: 'rgb(40, 40, 40)', 
                    lineHeight: '1.6'
                  }}
                  dangerouslySetInnerHTML={{ __html: (currentSection.content || 'No content yet').replace(/\b([A-Z])\. /g, '<strong>$1.</strong> ') }}
                />
              </div>

              {currentGroups.length > 0 ? (
                currentGroups.map(group => {
                  const groupQuestions = questions.filter(q => q.section_id === currentSection.id && q.question_number >= group.question_range_start && q.question_number <= group.question_range_end).sort((a, b) => a.question_number - b.question_number);
                  const globalOffset = (selectedPassage - 1) * 13;
                  const qStart = globalOffset + group.question_range_start;
                  const qEnd = globalOffset + group.question_range_end;
                  const questionRangeText = qStart === qEnd ? `Question ${qStart}` : `Questions ${qStart}–${qEnd}`;

                  return (
                    <div key={group.id} className="mb-10">
                      <h3 style={{ fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', fontSize: '20px', fontWeight: 700, color: accentColor, marginTop: '20px', marginBottom: '30px', lineHeight: '24px' }}>
                        {questionRangeText}
                      </h3>
                      {group.instruction_text && (
                        <div 
                          style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', fontSize: '16px', color: 'rgb(40, 40, 40)', marginBottom: '16px', lineHeight: '1.5' }}
                          dangerouslySetInnerHTML={{ __html: group.instruction_text }} 
                        />
                      )}
                      {group.image_url && (
                        <div className="mb-4">
                          <img 
                            src={group.image_url} 
                            alt={group.image_description || 'Diagram'} 
                            style={{ maxWidth: '100%', display: 'block', border: '1px solid rgb(221, 221, 221)' }} 
                          />
                        </div>
                      )}
                      <div>{renderQuestionGroup(group, groupQuestions, globalOffset, accentColor)}</div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">No question groups in this passage</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Passage not found</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function ReadingTab() {
  const { sections } = useExamEditor();
  const [showPreview, setShowPreview] = useState(false);

  const readingSections = sections.filter(s => s.module_type === 'reading').sort((a, b) => a.section_order - b.section_order);
  const passageLetters = Array.from({ length: readingSections.length }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-800">Reading</h2><p className="text-sm text-gray-500 mt-1">3 passages • 40 questions • 60 minutes</p></div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"><Eye size={18} /> Preview</button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium"><BookOpen size={16} /> IELTS</div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
        <HelpCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-emerald-800 font-medium">Creating an IELTS Reading Test</p>
          <ol className="text-xs text-emerald-700 mt-2 space-y-1 list-decimal list-inside">
            <li>Each passage should be 700-900 words with a clear title</li>
            <li>Paragraphs are automatically lettered A, B, C, etc.</li>
            <li>Add Question Groups with specific question types (13 questions per passage recommended)</li>
            <li>For matching questions, students select from passage letters or provided options</li>
          </ol>
        </div>
      </div>

      <div className="space-y-5">
        {readingSections.length > 0 ? (
          readingSections.map((section, idx) => <PassageCard key={section.id} section={section} passageNumber={idx + 1} passageLetters={passageLetters} />)
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No reading sections found</p>
            <p className="text-xs text-gray-400 mt-1">Sections should be initialized automatically</p>
          </div>
        )}
      </div>

      <PreviewMode isOpen={showPreview} onClose={() => setShowPreview(false)} />
    </div>
  );
}
