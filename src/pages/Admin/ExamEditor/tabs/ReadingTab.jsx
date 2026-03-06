import React, { useState } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { 
  ChevronDown, Plus, Trash2, BookOpen, CheckCircle, 
  HelpCircle, Target, List, ArrowRightLeft, FileText, 
  Type, Table2, MapPin, MessageSquare, Info
} from "lucide-react";
import PassageImageUploader from "./PassageImageUploader";
import GroupImageUploader from "./GroupImageUploader";
import RichTextEditor from "../../../../components/RichTextEditor/RichTextEditor";

// Question types with icons and detailed hints
const QUESTION_TYPES = [
  { 
    value: "multiple_choice_single", 
    label: "Multiple Choice", 
    icon: Target, 
    hint: "Student selects ONE correct answer from A-D options"
  },
  { 
    value: "multiple_choice_multiple", 
    label: "Multi-Select", 
    icon: List, 
    hint: "Student selects TWO or more correct answers from A-E options"
  },
  { 
    value: "true_false_not_given", 
    label: "True/False/NG", 
    icon: CheckCircle, 
    hint: "Student decides if factual statements agree with, contradict, or go beyond the text"
  },
  { 
    value: "yes_no_not_given", 
    label: "Yes/No/NG", 
    icon: HelpCircle, 
    hint: "Student decides if writer's views/claims match statements (opinion-based)"
  },
  { 
    value: "matching_headings", 
    label: "Match Headings", 
    icon: Type, 
    hint: "Student matches Roman numeral headings (i, ii, iii...) to paragraphs"
  },
  { 
    value: "matching_information", 
    label: "Match Info", 
    icon: ArrowRightLeft, 
    hint: "Student matches statements to the paragraphs (A, B, C...) where info is found"
  },
  { 
    value: "matching_features", 
    label: "Match Features", 
    icon: ArrowRightLeft, 
    hint: "Student matches items/features to categories (e.g., researchers to findings)"
  },
  { 
    value: "matching_sentence_endings", 
    label: "Sentence Endings", 
    icon: ArrowRightLeft, 
    hint: "Student completes sentence beginnings by matching to correct endings (A-G)"
  },
  { 
    value: "summary_completion", 
    label: "Summary", 
    icon: FileText, 
    hint: "Student fills gaps in a summary with words from text or word bank"
  },
  { 
    value: "sentence_completion", 
    label: "Sentence", 
    icon: Type, 
    hint: "Student completes a sentence with 1-3 words from the passage"
  },
  { 
    value: "table_completion", 
    label: "Table", 
    icon: Table2, 
    hint: "Student fills missing cells in a table with information from text"
  },
  { 
    value: "diagram_labeling", 
    label: "Diagram", 
    icon: MapPin, 
    hint: "Student labels parts of a diagram/process with words from text"
  },
  { 
    value: "short_answer", 
    label: "Short Answer", 
    icon: MessageSquare, 
    hint: "Student answers a question with words taken directly from the passage"
  },
];

// Styled input components
const Input = ({ label, hint, className = "", ...props }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <input
      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition"
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

// QuestionFields component - renders question input fields based on type
function QuestionFields({ question, updateQuestion, passageLetters }) {
  return (
    <div className="space-y-3">
      <Input
        label="Question Text"
        placeholder="Enter question text..."
        value={question.text || ""}
        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
      />
      <Input
        label="Answer"
        placeholder="Enter correct answer..."
        value={question.answer || ""}
        onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
      />
    </div>
  );
}

// Reading Group Card (modeled after ListeningTab)
function ReadingGroupCard({ group, sectionId, passageNumber, passageLetters }) {
  const { updateQuestionGroup, deleteQuestionGroup, questions, addQuestion, updateQuestion, deleteQuestion } = useExamEditor();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const groupQuestions = questions.filter(q => q.group_id === group.id);
  const addQuestionToGroup = () => {
    const nextNum = groupQuestions.length > 0
      ? Math.max(...groupQuestions.map(q => q.question_number || 0)) + 1
      : group.question_range_start || 1;
    addQuestion(sectionId, {
      question_number: nextNum,
      type: group.question_type,
      text: '',
      answer: '',
      group_id: group.id
    });
  };
  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm mb-4">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
            <span className="text-blue-600 font-bold text-lg">{group.question_type?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">
              {group.instruction_text?.slice(0, 40) || 'Reading Group'}
            </h4>
            <p className="text-xs text-gray-500">Questions {group.question_range_start}–{group.question_range_end}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {groupQuestions.length} questions
          </span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); deleteQuestionGroup(group.id); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
          >
            <Trash2 size={16} />
          </button>
          <ChevronDown size={18} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 border-t border-blue-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none"
              placeholder="Instruction text..."
              value={group.instruction_text || ''}
              onChange={e => updateQuestionGroup(group.id, { instruction_text: e.target.value })}
            />
            <select
              className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none"
              value={group.question_type || ''}
              onChange={e => updateQuestionGroup(group.id, { question_type: e.target.value })}
            >
              <option value="">Select type…</option>
              <option value="paragraph_matching">Paragraph Matching</option>
              <option value="sentence_completion">Sentence Completion</option>
              <option value="true_false_not_given">True/False/Not Given</option>
              <option value="heading_matching">Heading Matching</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>
          <GroupImageUploader
            imageUrl={group.image_url || ''}
            onChange={url => updateQuestionGroup(group.id, { image_url: url })}
            description={group.image_description || ''}
            onDescriptionChange={desc => updateQuestionGroup(group.id, { image_description: desc })}
          />
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-gray-700">Questions</h5>
            <button
              onClick={addQuestionToGroup}
              className="flex items-center gap-1.5 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition"
            >
              <Plus size={14} /> Add Question
            </button>
          </div>
          {groupQuestions.length > 0 ? (
            <div className="space-y-2">
              {groupQuestions.map((q, idx) => (
                <div key={q.id} className="border rounded p-2 bg-blue-50">
                  <QuestionFields
                    question={q}
                    updateQuestion={updateQuestion}
                    passageLetters={passageLetters}
                  />
                  <button
                    type="button"
                    onClick={() => deleteQuestion(q.id)}
                    className="text-xs text-red-500 hover:underline mt-1"
                  >Delete</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-400 bg-blue-50 rounded">No questions yet</div>
          )}
        </div>
      )}
    </div>
  );
}

// Question Card (for backwards compatibility if needed)
function QuestionCard({ question, updateQuestion, deleteQuestion, index, passageNumber, passageLetters }) {
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
          <QuestionFields question={question} updateQuestion={updateQuestion} passageLetters={passageLetters} />
        </div>
      )}
    </div>
  );
}



function PassageCard({ section, passageNumber, passageLetters }) {
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

            {/* Passage Image Uploader - after part 1 */}
            <PassageImageUploader
              imageUrl={section.image_url || ""}
              onChange={url => updateSection(section.id, { image_url: url })}
              description={section.image_description || ""}
              onDescriptionChange={desc => updateSection(section.id, { image_description: desc })}
            />

            <div className="mt-4">
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
                    passageLetters={passageLetters}
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
  const { sections, questionGroups, addQuestionGroup } = useExamEditor();
  const readingSections = sections
    .filter(s => s.module_type === 'reading')
    .sort((a, b) => a.section_order - b.section_order);

  // Generate passage letters (A, B, C, ...) for the number of reading sections
  const passageLetters = Array.from({ length: readingSections.length }, (_, i) => String.fromCharCode(65 + i));

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
          Each passage should be 700-900 words. Click a group to expand and add questions. Different group types have specialized input fields.
        </p>
      </div>

      {/* Passages */}
      <div className="space-y-5">
        {readingSections.length > 0 ? (
          readingSections.map((section, idx) => (
            <div key={section.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-500 text-white font-bold text-lg`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{section.title || `Passage ${idx + 1}`}</h3>
                    <span className="text-xs text-gray-500">Letter: {passageLetters[idx]}</span>
                  </div>
                </div>
                <button
                  onClick={() => addQuestionGroup(section.id, { question_type: '', instruction_text: '', question_range_start: 1, question_range_end: 1 })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition"
                >
                  <Plus size={16} /> Add Group
                </button>
              </div>
              <div className="px-5 pb-4">
                <PassageImageUploader
                  imageUrl={section.image_url || ""}
                  onChange={url => {}}
                  description={section.image_description || ""}
                  onDescriptionChange={desc => {}}
                />
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Passage Content
                    <span className="ml-2 font-normal text-gray-400">(700-900 words recommended)</span>
                  </label>
                  <RichTextEditor
                    content={section.content || ""}
                    onChange={(html) => {}}
                    placeholder="Paste or type the reading passage here..."
                    minHeight="300px"
                  />
                </div>
                {/* Groups for this section */}
                <div className="mt-6 space-y-4">
                  {questionGroups.filter(g => g.section_id === section.id).length > 0 ? (
                    questionGroups.filter(g => g.section_id === section.id)
                      .sort((a, b) => (a.group_order || 0) - (b.group_order || 0))
                      .map((group, gidx) => (
                        <ReadingGroupCard key={group.id} group={group} sectionId={section.id} passageNumber={idx + 1} passageLetters={passageLetters} />
                      ))
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-400 bg-blue-50 rounded">No groups yet</div>
                  )}
                </div>
              </div>
            </div>
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
