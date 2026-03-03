import React, { useState } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { 
  ChevronDown, ChevronUp, Plus, Trash2, FileText, BookOpen, Clock, Target, 
  AlertCircle, CheckCircle, Eye, EyeOff, Info, Edit3, Hash, Type, List,
  HelpCircle, ArrowRight, Table, MapPin, MessageSquare
} from "lucide-react";
import RichTextEditor from "../../../../components/RichTextEditor/RichTextEditor";

// IELTS Reading Question Types with icons and descriptions
const QUESTION_TYPES = [
  { value: "multiple_choice_single", label: "Multiple Choice (Single)", icon: Target, description: "Choose one correct answer from options", color: "blue" },
  { value: "multiple_choice_multiple", label: "Multiple Choice (Multiple)", icon: List, description: "Choose multiple correct answers", color: "blue" },
  { value: "true_false_not_given", label: "True/False/Not Given", icon: CheckCircle, description: "Factual information questions", color: "green" },
  { value: "yes_no_not_given", label: "Yes/No/Not Given", icon: HelpCircle, description: "Writer's views/claims questions", color: "green" },
  { value: "matching_headings", label: "Matching Headings", icon: Type, description: "Match headings to paragraphs", color: "purple" },
  { value: "matching_information", label: "Matching Information", icon: ArrowRight, description: "Match statements to paragraphs", color: "purple" },
  { value: "matching_features", label: "Matching Features", icon: ArrowRight, description: "Match items to categories", color: "purple" },
  { value: "matching_sentence_endings", label: "Matching Sentence Endings", icon: Edit3, description: "Complete sentences by matching", color: "purple" },
  { value: "summary_completion", label: "Summary Completion", icon: FileText, description: "Fill gaps in a summary", color: "amber" },
  { value: "sentence_completion", label: "Sentence Completion", icon: Edit3, description: "Complete sentences with words", color: "amber" },
  { value: "table_completion", label: "Table Completion", icon: Table, description: "Fill gaps in a table", color: "amber" },
  { value: "diagram_labeling", label: "Diagram Labeling", icon: MapPin, description: "Label parts of a diagram", color: "amber" },
  { value: "short_answer", label: "Short Answer", icon: MessageSquare, description: "Answer questions with words from text", color: "teal" },
];

const getQuestionTypeInfo = (typeValue) => {
  return QUESTION_TYPES.find(t => t.value === typeValue) || QUESTION_TYPES[0];
};

function QuestionEditor({ question, updateQuestion, deleteQuestion, index, passageNumber }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeInfo = getQuestionTypeInfo(question.type);
  const IconComponent = typeInfo.icon;
  
  const isConfigured = question.text && question.answer;
  const globalQuestionNumber = (passageNumber - 1) * 13 + index + 1; // Approximate IELTS numbering

  return (
    <div className={`border rounded-xl bg-white overflow-hidden transition-all ${isExpanded ? 'shadow-md ring-2 ring-emerald-200' : 'shadow-sm hover:shadow'}`}>
      <div 
        className={`p-4 flex justify-between items-center cursor-pointer transition ${
          isExpanded ? 'bg-gradient-to-r from-emerald-50 to-teal-50' : 'bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm ${
            isConfigured ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {globalQuestionNumber}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <IconComponent size={14} className={`text-${typeInfo.color}-600`} />
              <span className="font-medium text-gray-800">{typeInfo.label}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
              {question.text || "Click to configure question..."}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isConfigured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isConfigured ? 'Ready' : 'Setup'}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }} 
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={16} />
          </button>
          {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-5 space-y-5 border-t bg-white">
          {/* Question Type Selection - Button Grid */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3 block">Question Type</label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {QUESTION_TYPES.map(type => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => updateQuestion(question.id, { type: type.value })}
                    className={`p-3 rounded-lg border-2 text-left transition flex items-start space-x-2 ${
                      question.type === type.value 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <TypeIcon size={16} className={`mt-0.5 ${question.type === type.value ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-gray-900 text-xs">{type.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5 hidden lg:block">{type.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <Edit3 size={14} className="mr-2" /> Question Text
            </label>
            <textarea
              className="w-full h-24 p-3 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              placeholder="Enter the question text that students will see..."
              value={question.text || ""}
              onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
            />
          </div>

          {/* Options for Multiple Choice */}
          {(question.type === 'multiple_choice_single' || question.type === 'multiple_choice_multiple') && (
            <div>
              <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                <List size={14} className="mr-2" /> Answer Options
              </label>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((letter) => (
                  <div key={letter} className="flex items-center space-x-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg font-medium text-sm text-gray-600">{letter}</span>
                    <input
                      className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder={`Option ${letter}...`}
                      value={question[`option_${letter.toLowerCase()}`] || ""}
                      onChange={(e) => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct Answer */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <CheckCircle size={14} className="mr-2" /> Correct Answer
            </label>
            {(question.type === 'true_false_not_given' || question.type === 'yes_no_not_given') ? (
              <div className="flex space-x-2">
                {(question.type === 'true_false_not_given' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map(opt => (
                  <button
                    key={opt}
                    onClick={() => updateQuestion(question.id, { answer: opt })}
                    className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition ${
                      question.answer === opt 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder={question.type?.includes('multiple_choice') ? "Enter correct option (e.g., A, B, C, or D)" : "Enter the correct answer..."}
                value={question.answer || ""}
                onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
              />
            )}
            <p className="text-xs text-gray-500 mt-2">
              <Info size={12} className="inline mr-1" />
              {question.type?.includes('matching') 
                ? 'For matching questions, use format: 1-C, 2-A, 3-B' 
                : 'This is used for auto-grading and won\'t be shown to students'}
            </p>
          </div>

          {/* Explanation (Optional) */}
          <div className="border-t pt-4">
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <HelpCircle size={14} className="mr-2" /> Explanation (Optional)
            </label>
            <textarea
              className="w-full h-20 p-3 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-gray-50"
              placeholder="Add an explanation for why this is the correct answer (shown after submission)..."
              value={question.explanation || ""}
              onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PassageEditor({ section, passageNumber }) {
  const { updateSection, questions, addQuestion, updateQuestion, deleteQuestion } = useExamEditor();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);

  const sectionQuestions = questions.filter(q => q.section_id === section.id);
  const wordCount = section.content ? section.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(w => w).length : 0;
  const isPassageConfigured = section.content && wordCount > 100;
  const expectedQuestions = passageNumber === 1 ? 13 : passageNumber === 2 ? 13 : 14; // IELTS distribution

  // Gradient colors for each passage
  const gradientColors = [
    'from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100',
    'from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100',
    'from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100',
  ];
  const badgeColors = ['bg-emerald-600', 'bg-cyan-600', 'bg-violet-600'];

  return (
    <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
      {/* Header */}
      <div 
        className={`p-5 border-b flex justify-between items-center cursor-pointer transition bg-gradient-to-r ${gradientColors[passageNumber - 1] || gradientColors[0]}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold text-lg text-white ${badgeColors[passageNumber - 1] || badgeColors[0]}`}>
            {passageNumber}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">
              {section.title || `Reading Passage ${passageNumber}`}
            </h4>
            <p className="text-sm text-gray-600 mt-0.5">
              {wordCount} words • {sectionQuestions.length}/{expectedQuestions} questions
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            isPassageConfigured && sectionQuestions.length >= expectedQuestions - 2
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isPassageConfigured && sectionQuestions.length >= expectedQuestions - 2 ? 'Configured' : 'Needs Setup'}
          </span>
          {isExpanded ? <ChevronUp size={22} className="text-gray-400" /> : <ChevronDown size={22} className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Passage Title */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <Type size={14} className="mr-2" /> Passage Title
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter the passage title (e.g., 'The History of Chocolate')"
              value={section.title || ""}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
            />
          </div>

          {/* Passage Content with Rich Text Editor */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <BookOpen size={14} className="mr-2" /> Passage Content
              <span className="ml-2 text-xs font-normal text-gray-500">
                Use toolbar to format: <strong>bold</strong> key terms, <em>italicize</em> titles, <mark>highlight</mark> important phrases
              </span>
            </label>
            <RichTextEditor
              content={section.content || ""}
              onChange={(html) => updateSection(section.id, { content: html })}
              placeholder="Paste or type the reading passage here. Use the toolbar above to format text - bold important vocabulary, italicize book titles or foreign words, highlight key phrases for reference questions..."
              minHeight="350px"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                <Info size={12} className="inline mr-1" />
                IELTS passages are typically 700-900 words
              </p>
              <span className={`text-xs font-medium ${wordCount >= 700 ? 'text-green-600' : wordCount >= 400 ? 'text-yellow-600' : 'text-gray-400'}`}>
                {wordCount} words
              </span>
            </div>
          </div>

          {/* Questions Section */}
          <div className="border-t pt-6">
            <div 
              className="flex justify-between items-center mb-4 cursor-pointer"
              onClick={() => setShowQuestions(!showQuestions)}
            >
              <div className="flex items-center space-x-2">
                {showQuestions ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
                <h5 className="font-bold text-gray-700">Questions ({sectionQuestions.length})</h5>
                <span className="text-xs text-gray-500">Click to {showQuestions ? 'collapse' : 'expand'}</span>
              </div>
              <button
                onClick={(e) => { 
                  e.stopPropagation();
                  addQuestion(section.id, { type: 'multiple_choice_single', text: '', answer: '' });
                }}
                className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2 transition"
              >
                <Plus size={16} /> <span>Add Question</span>
              </button>
            </div>
            
            {showQuestions && (
              <div className="space-y-3">
                {sectionQuestions.map((q, idx) => (
                  <QuestionEditor 
                    key={q.id} 
                    question={q} 
                    index={idx}
                    passageNumber={passageNumber}
                    updateQuestion={updateQuestion}
                    deleteQuestion={deleteQuestion}
                  />
                ))}
                {sectionQuestions.length === 0 && (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <HelpCircle size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No questions added yet</p>
                    <p className="text-sm text-gray-400 mt-1">Add questions to test comprehension of this passage</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReadingTab() {
  const { sections, exam } = useExamEditor();
  const readingSections = sections.filter(s => s.module_type === 'reading');
  const sortedSections = [...readingSections].sort((a, b) => a.section_order - b.section_order);

  const totalQuestions = sections
    .filter(s => s.module_type === 'reading')
    .reduce((acc, s) => acc + (s.questions?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Reading Module</h3>
          <p className="text-sm text-gray-500 mt-1">
            {exam?.type === 'general' ? 'General Training' : 'Academic'} Reading • 3 Passages • 60 minutes
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full">
            <BookOpen size={14} />
            <span>40 Questions Total</span>
          </div>
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
            <Clock size={14} />
            <span>60 Minutes</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900">IELTS Reading Format</h4>
            <p className="text-sm text-amber-800 mt-1">
              <strong>Academic:</strong> 3 long texts from books, journals, magazines, and newspapers. Topics are of general interest and appropriate for university-level learners.
            </p>
            <p className="text-sm text-amber-800 mt-1">
              <strong>Question Types:</strong> Multiple choice, matching, sentence completion, summary completion, True/False/Not Given, and more. Use the formatting tools to <strong>bold</strong> key vocabulary and <mark className="bg-yellow-200">highlight</mark> important phrases.
            </p>
          </div>
        </div>
      </div>

      {/* Passage Editors */}
      <div className="space-y-6">
        {sortedSections.length > 0 ? (
          sortedSections.map((section, idx) => (
            <PassageEditor 
              key={section.id} 
              section={section} 
              passageNumber={idx + 1}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Reading sections not initialized. Try refreshing.</p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gray-50 rounded-xl p-5 border">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center">
          <CheckCircle size={18} className="mr-2 text-green-600" />
          Passage Setup Checklist
        </h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-2">Passage 1 (Easiest)</p>
            <ul className="space-y-1 text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>700-900 words passage text</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>~13 questions (Q1-13)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>Bold key vocabulary</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Passage 2 (Medium)</p>
            <ul className="space-y-1 text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                <span>700-900 words passage text</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                <span>~13 questions (Q14-26)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                <span>Mix question types</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Passage 3 (Hardest)</p>
            <ul className="space-y-1 text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                <span>800-1000 words passage text</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                <span>~14 questions (Q27-40)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                <span>Complex question types</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
