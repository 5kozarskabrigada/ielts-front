import React, { useState } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { 
  ChevronDown, Plus, Trash2, BookOpen, CheckCircle, 
  HelpCircle, Target, List, ArrowRightLeft, FileText, 
  Type, Table2, MapPin, MessageSquare, Info
} from "lucide-react";
import RichTextEditor from "../../../../components/RichTextEditor/RichTextEditor";

// Question types with icons and hints
const QUESTION_TYPES = [
  { value: "multiple_choice_single", label: "Multiple Choice", icon: Target, hint: "Choose one correct answer from A-D" },
  { value: "multiple_choice_multiple", label: "Multi-Select", icon: List, hint: "Choose multiple correct answers" },
  { value: "true_false_not_given", label: "True/False/NG", icon: CheckCircle, hint: "Factual information questions" },
  { value: "yes_no_not_given", label: "Yes/No/NG", icon: HelpCircle, hint: "Writer's views/claims questions" },
  { value: "matching_headings", label: "Match Headings", icon: Type, hint: "Match headings to paragraphs" },
  { value: "matching_information", label: "Match Info", icon: ArrowRightLeft, hint: "Match statements to paragraphs" },
  { value: "matching_features", label: "Match Features", icon: ArrowRightLeft, hint: "Match items to categories" },
  { value: "matching_sentence_endings", label: "Sentence Endings", icon: ArrowRightLeft, hint: "Complete sentences by matching" },
  { value: "summary_completion", label: "Summary", icon: FileText, hint: "Fill gaps in a summary" },
  { value: "sentence_completion", label: "Sentence", icon: Type, hint: "Complete sentences with words" },
  { value: "table_completion", label: "Table", icon: Table2, hint: "Fill gaps in a table" },
  { value: "diagram_labeling", label: "Diagram", icon: MapPin, hint: "Label parts of a diagram" },
  { value: "short_answer", label: "Short Answer", icon: MessageSquare, hint: "Answer with words from text" },
];

// Styled input
const Input = ({ label, hint, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    <input
      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition"
      {...props}
    />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

// Styled textarea
const TextArea = ({ label, hint, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    <textarea
      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition resize-none"
      {...props}
    />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

// Question type specific fields
function QuestionFields({ question, updateQuestion }) {
  const type = question.type || 'short_answer';

  // MULTIPLE CHOICE (SINGLE)
  if (type === 'multiple_choice_single') {
    return (
      <div className="space-y-5">
        <Input
          label="Question"
          placeholder="e.g., What is the main purpose of the passage?"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />
        
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Options</label>
          <div className="space-y-2">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <div key={letter} className="flex items-center gap-2">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                  question.answer === letter ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {letter}
                </div>
                <input
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-400 outline-none"
                  placeholder={`Option ${letter}`}
                  value={question[`option_${letter.toLowerCase()}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Correct Answer</label>
          <div className="flex gap-2">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => updateQuestion(question.id, { answer: letter })}
                className={`w-12 h-10 rounded-lg font-semibold text-sm transition ${
                  question.answer === letter 
                    ? 'bg-green-500 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // MULTIPLE CHOICE (MULTIPLE)
  if (type === 'multiple_choice_multiple') {
    const selected = (question.answer || '').split(',').map(s => s.trim()).filter(Boolean);
    const toggleOption = (letter) => {
      const newSelected = selected.includes(letter) 
        ? selected.filter(l => l !== letter)
        : [...selected, letter].sort();
      updateQuestion(question.id, { answer: newSelected.join(', ') });
    };

    return (
      <div className="space-y-5">
        <Input
          label="Question"
          placeholder="e.g., Which TWO features are mentioned in the text?"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />
        
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Options (click multiple to select)</label>
          <div className="space-y-2">
            {['A', 'B', 'C', 'D', 'E'].map((letter) => (
              <div key={letter} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleOption(letter)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                    selected.includes(letter) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {letter}
                </button>
                <input
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-400 outline-none"
                  placeholder={`Option ${letter}`}
                  value={question[`option_${letter.toLowerCase()}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Selected Answers</label>
          <p className="text-sm text-green-800 font-medium">{question.answer || 'None selected'}</p>
        </div>
      </div>
    );
  }

  // TRUE/FALSE/NOT GIVEN
  if (type === 'true_false_not_given') {
    return (
      <div className="space-y-5">
        <TextArea
          label="Statement"
          placeholder="e.g., The author believes that climate change is reversible."
          rows={2}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Answer</label>
          <div className="flex gap-2">
            {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateQuestion(question.id, { answer: opt })}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition ${
                  question.answer === opt 
                    ? opt === 'TRUE' ? 'bg-green-500 text-white' 
                      : opt === 'FALSE' ? 'bg-red-500 text-white' 
                      : 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // YES/NO/NOT GIVEN
  if (type === 'yes_no_not_given') {
    return (
      <div className="space-y-5">
        <TextArea
          label="Statement (Writer's View)"
          placeholder="e.g., The writer suggests that technology has improved education."
          rows={2}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Answer</label>
          <div className="flex gap-2">
            {['YES', 'NO', 'NOT GIVEN'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateQuestion(question.id, { answer: opt })}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition ${
                  question.answer === opt 
                    ? opt === 'YES' ? 'bg-green-500 text-white' 
                      : opt === 'NO' ? 'bg-red-500 text-white' 
                      : 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // MATCHING HEADINGS
  if (type === 'matching_headings') {
    const count = parseInt(question.heading_count) || 4;
    return (
      <div className="space-y-5">
        <Input
          label="Paragraph Reference"
          placeholder="e.g., Paragraph A / Section 1"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="bg-indigo-50/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Heading Options</label>
            <select
              className="text-xs px-2 py-1 border border-indigo-200 rounded bg-white"
              value={count}
              onChange={(e) => updateQuestion(question.id, { heading_count: e.target.value })}
            >
              {[3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-medium text-indigo-600">{String.fromCharCode(105 + i)}</span>
                <input
                  className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-200 rounded text-sm focus:border-indigo-400 outline-none"
                  placeholder={`Heading ${i + 1}`}
                  value={question[`heading_${i + 1}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`heading_${i + 1}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Heading</label>
          <input
            className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="e.g., iv (lowercase Roman numeral)"
            value={question.answer || ""}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
        </div>
      </div>
    );
  }

  // MATCHING INFORMATION / FEATURES
  if (type === 'matching_information' || type === 'matching_features') {
    const itemCount = parseInt(question.match_count) || 3;
    const label = type === 'matching_information' ? 'Statement' : 'Feature';
    return (
      <div className="space-y-5">
        <Input
          label={label}
          placeholder={type === 'matching_information' 
            ? "e.g., This paragraph mentions the first discovery." 
            : "e.g., believes traditional methods are superior"}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="bg-purple-50/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-purple-700 uppercase tracking-wide">
              {type === 'matching_information' ? 'Paragraphs' : 'Categories'}
            </label>
            <select
              className="text-xs px-2 py-1 border border-purple-200 rounded bg-white"
              value={itemCount}
              onChange={(e) => updateQuestion(question.id, { match_count: e.target.value })}
            >
              {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(itemCount)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-purple-100 rounded text-xs font-medium text-purple-700">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  className="flex-1 px-2.5 py-1.5 bg-white border border-purple-200 rounded text-sm focus:border-purple-400 outline-none"
                  placeholder={type === 'matching_information' ? `Para ${String.fromCharCode(65 + i)}` : `Category ${i + 1}`}
                  value={question[`match_opt_${String.fromCharCode(97 + i)}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`match_opt_${String.fromCharCode(97 + i)}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Answer</label>
          <input
            className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="e.g., B"
            value={question.answer || ""}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
        </div>
      </div>
    );
  }

  // MATCHING SENTENCE ENDINGS
  if (type === 'matching_sentence_endings') {
    const count = parseInt(question.ending_count) || 4;
    return (
      <div className="space-y-5">
        <Input
          label="Sentence Beginning"
          placeholder="e.g., The researcher discovered that..."
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="bg-teal-50/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-teal-700 uppercase tracking-wide">Sentence Endings</label>
            <select
              className="text-xs px-2 py-1 border border-teal-200 rounded bg-white"
              value={count}
              onChange={(e) => updateQuestion(question.id, { ending_count: e.target.value })}
            >
              {[3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-teal-100 rounded text-xs font-medium text-teal-700">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  className="flex-1 px-2.5 py-1.5 bg-white border border-teal-200 rounded text-sm focus:border-teal-400 outline-none"
                  placeholder={`Ending ${String.fromCharCode(65 + i)}`}
                  value={question[`ending_${String.fromCharCode(97 + i)}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`ending_${String.fromCharCode(97 + i)}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Ending</label>
          <input
            className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="e.g., C"
            value={question.answer || ""}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
        </div>
      </div>
    );
  }

  // SUMMARY/TABLE COMPLETION
  if (type === 'summary_completion' || type === 'table_completion') {
    const gapCount = parseInt(question.gap_count) || 4;
    const label = type === 'summary_completion' ? 'Summary' : 'Table';
    return (
      <div className="space-y-5">
        <Input
          label={`${label} Topic`}
          placeholder={`e.g., ${type === 'summary_completion' ? 'Summary of the experiment' : 'Comparison table'}`}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <TextArea
          label={`${label} Content`}
          hint="Use (1) ___, (2) ___ to mark blanks"
          placeholder={type === 'summary_completion' 
            ? "The study found that (1) ___ was the main factor affecting (2) ___..."
            : "| Category | Value |\n| A | (1) ___ |\n| B | (2) ___ |"}
          rows={5}
          value={question.content || ""}
          onChange={(e) => updateQuestion(question.id, { content: e.target.value })}
        />

        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Answers</label>
            <select
              className="text-xs px-2 py-1 border border-green-200 rounded bg-white"
              value={gapCount}
              onChange={(e) => updateQuestion(question.id, { gap_count: e.target.value })}
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(gapCount)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-green-100 rounded text-xs font-medium text-green-700">{i + 1}</span>
                <input
                  className="flex-1 px-2 py-1.5 bg-white border border-green-200 rounded text-sm focus:border-green-400 outline-none"
                  placeholder={`Answer ${i + 1}`}
                  value={question[`gap_${i + 1}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`gap_${i + 1}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SENTENCE COMPLETION
  if (type === 'sentence_completion') {
    return (
      <div className="space-y-5">
        <TextArea
          label="Sentence with blank"
          hint="Use ___ to mark where the answer goes"
          placeholder="e.g., The experiment was conducted in ___ under controlled conditions."
          rows={2}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Answer</label>
          <input
            className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="e.g., laboratory"
            value={question.answer || ""}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
          <p className="text-xs text-green-600 mt-1.5">Word(s) from the passage, usually 1-3 words</p>
        </div>
      </div>
    );
  }

  // DIAGRAM LABELING
  if (type === 'diagram_labeling') {
    const labelCount = parseInt(question.label_count) || 4;
    return (
      <div className="space-y-5">
        <Input
          label="Label Reference"
          placeholder="e.g., Label A / Part 1"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Diagram Image URL</label>
          <input
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-400 outline-none"
            placeholder="https://example.com/diagram.png"
            value={question.image_url || ""}
            onChange={(e) => updateQuestion(question.id, { image_url: e.target.value })}
          />
          {question.image_url && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
              <img src={question.image_url} alt="Diagram preview" className="max-h-40 mx-auto rounded" />
            </div>
          )}
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Label</label>
          <input
            className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="e.g., control panel"
            value={question.answer || ""}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
        </div>
      </div>
    );
  }

  // SHORT ANSWER (default)
  return (
    <div className="space-y-5">
      <Input
        label="Question"
        placeholder="e.g., What year was the discovery made?"
        value={question.text || ""}
        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
      />

      <div className="bg-green-50 rounded-lg p-3">
        <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Answer</label>
        <input
          className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
          placeholder="e.g., 1998"
          value={question.answer || ""}
          onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
        />
        <p className="text-xs text-green-600 mt-1.5">Words/numbers from the passage (usually 1-3 words)</p>
      </div>
    </div>
  );
}

// Question Card
function QuestionCard({ question, updateQuestion, deleteQuestion, index, passageNumber }) {
  const [isOpen, setIsOpen] = useState(false);
  const qNum = (passageNumber - 1) * 13 + index + 1;
  const hasContent = question.text && question.answer;
  const typeInfo = QUESTION_TYPES.find(t => t.value === question.type) || QUESTION_TYPES[0];
  const TypeIcon = typeInfo.icon;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      isOpen ? 'border-emerald-300 shadow-sm' : 'border-gray-200'
    }`}>
      <div
        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition ${
          isOpen ? 'bg-emerald-50' : 'bg-white hover:bg-gray-50'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold ${
            hasContent ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {qNum}
          </span>
          <div className="flex items-center gap-2">
            <TypeIcon size={16} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-800">{typeInfo.label}</p>
              {question.text && (
                <p className="text-xs text-gray-400 truncate max-w-[180px] sm:max-w-xs">{question.text}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasContent && <CheckCircle size={16} className="text-green-500" />}
          <button
            onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={16} />
          </button>
          <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-gray-50/70 border-t border-gray-100">
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Question Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {QUESTION_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = question.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateQuestion(question.id, { type: type.value })}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition ${
                      isSelected 
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={12} className={isSelected ? 'text-emerald-600' : 'text-gray-400'} />
                    <span className="text-xs font-medium truncate">{type.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-start gap-1.5 mt-2 text-xs text-gray-400">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>{typeInfo.hint}</span>
            </div>
          </div>
          <QuestionFields question={question} updateQuestion={updateQuestion} />
        </div>
      )}
    </div>
  );
}

// Passage Card
function PassageCard({ section, passageNumber }) {
  const { updateSection, questions, addQuestion, updateQuestion, deleteQuestion } = useExamEditor();
  const [isOpen, setIsOpen] = useState(true);

  const sectionQuestions = questions.filter(q => q.section_id === section.id);
  const completedCount = sectionQuestions.filter(q => q.text && q.answer).length;
  const wordCount = section.content ? section.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(w => w).length : 0;

  const colors = [
    { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  ][passageNumber - 1] || { bg: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${colors.bg} text-white font-bold text-lg`}>
            {passageNumber}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{section.title || `Passage ${passageNumber}`}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm text-gray-500">{wordCount} words</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">{sectionQuestions.length} questions</span>
              {completedCount > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.light} ${colors.text}`}>
                  {completedCount} ready
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {wordCount >= 700 && completedCount >= 10 && (
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Complete</span>
          )}
          <ChevronDown size={22} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <>
          {/* Passage Settings */}
          <div className={`px-5 py-4 ${colors.light} border-t ${colors.border}`}>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Passage Title</label>
              <input
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-400 outline-none"
                placeholder="e.g., The History of Coffee"
                value={section.title || ""}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Passage Content
                <span className="ml-2 font-normal text-gray-400">(700-900 words recommended)</span>
              </label>
              <RichTextEditor
                content={section.content || ""}
                onChange={(html) => updateSection(section.id, { content: html })}
                placeholder="Paste or type the reading passage here..."
                minHeight="300px"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400">Use toolbar to bold key terms, italicize titles</p>
                <span className={`text-xs font-medium ${wordCount >= 700 ? 'text-green-600' : wordCount >= 400 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {wordCount} words
                </span>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-700">Questions</h4>
              <button
                onClick={() => addQuestion(section.id, { type: 'multiple_choice_single', text: '', answer: '' })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition"
              >
                <Plus size={16} /> Add Question
              </button>
            </div>

            {sectionQuestions.length > 0 ? (
              <div className="space-y-3">
                {sectionQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={idx}
                    passageNumber={passageNumber}
                    updateQuestion={updateQuestion}
                    deleteQuestion={deleteQuestion}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <BookOpen size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No questions yet</p>
              </div>
            )}

            {sectionQuestions.length > 0 && sectionQuestions.length < 13 && (
              <div className="mt-4 text-center text-xs text-emerald-600 bg-emerald-50 rounded-lg py-2">
                Add more questions (typical: 13-14 per passage)
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Main Component
export default function ReadingTab() {
  const { sections } = useExamEditor();
  const readingSections = sections
    .filter(s => s.module_type === 'reading')
    .sort((a, b) => a.section_order - b.section_order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reading</h2>
          <p className="text-sm text-gray-500 mt-1">3 passages • 40 questions • 60 minutes</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
          <BookOpen size={16} /> IELTS
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
        <HelpCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-emerald-800">
          Each passage should be 700-900 words. Click a question to expand it and select the appropriate type.
          Different question types have specialized input fields.
        </p>
      </div>

      {/* Passages */}
      <div className="space-y-5">
        {readingSections.length > 0 ? (
          readingSections.map((section, idx) => (
            <PassageCard key={section.id} section={section} passageNumber={idx + 1} />
          ))
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No reading passages found</p>
          </div>
        )}
      </div>
    </div>
  );
}
