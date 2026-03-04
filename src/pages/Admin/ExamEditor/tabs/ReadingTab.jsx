import React, { useState } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { 
  ChevronDown, Plus, Trash2, BookOpen, CheckCircle, 
  HelpCircle, Target, List, ArrowRightLeft, FileText, 
  Type, Table2, MapPin, MessageSquare, Info
} from "lucide-react";
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

// Info box component for question type guidance
const TypeInfoBox = ({ title, description, example, tips }) => (
  <div className="mb-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 flex items-center justify-center bg-emerald-100 rounded-lg flex-shrink-0">
        <Info size={16} className="text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-emerald-900 text-sm">{title}</h4>
        <p className="text-xs text-emerald-700 mt-1">{description}</p>
        {example && (
          <div className="mt-2 bg-white/60 rounded-lg px-3 py-2 border border-emerald-100">
            <span className="text-xs font-medium text-emerald-600">Example: </span>
            <span className="text-xs text-emerald-800">{example}</span>
          </div>
        )}
        {tips && (
          <p className="text-xs text-emerald-600 mt-2 italic">💡 {tips}</p>
        )}
      </div>
    </div>
  </div>
);

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
        <TypeInfoBox
          title="Multiple Choice (Single Answer)"
          description="A question with 4 options (A-D) where only ONE is correct. Tests comprehension of specific information, main ideas, or writer's purpose."
          example="Q: What is the main purpose of paragraph 3? A) To explain... B) To compare... C) To argue... D) To describe..."
          tips="Ensure wrong options are plausible but clearly distinguishable. Reference specific paragraphs if asking about detailed information."
        />
        
        <Input
          label="Question"
          placeholder="e.g., What is the writer's main argument in the passage?"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />
        
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Answer Options (A-D)</label>
          <p className="text-xs text-gray-400 mb-3">Write each option as a complete statement or phrase</p>
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
                  placeholder={letter === 'A' ? 'e.g., To explain a new scientific theory' : letter === 'B' ? 'e.g., To compare two different approaches' : letter === 'C' ? 'e.g., To criticize existing methods' : 'e.g., To describe historical events'}
                  value={question[`option_${letter.toLowerCase()}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Select Correct Answer</label>
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
        <TypeInfoBox
          title="Multiple Choice (Multiple Answers)"
          description="A question where students must select TWO or more correct answers from 5 options. Usually phrased as 'Which TWO...' or 'Which THREE...'"
          example="Q: Which TWO of the following are mentioned as benefits? → A, D (both correct)"
          tips="Specify how many answers are needed in your question. Click each correct option to select/deselect it."
        />
        
        <Input
          label="Question"
          placeholder="e.g., Which TWO features does the author describe as innovative?"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />
        
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Options (click to select correct answers)</label>
          <p className="text-xs text-gray-400 mb-3">Toggle each option that is CORRECT. Selected options will highlight green.</p>
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
                  placeholder={letter === 'A' ? 'e.g., Its low environmental impact' : `Option ${letter}`}
                  value={question[`option_${letter.toLowerCase()}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Selected Correct Answers</label>
          <p className="text-sm text-green-800 font-medium">{question.answer || 'None selected - click options above'}</p>
        </div>
      </div>
    );
  }

  // TRUE/FALSE/NOT GIVEN
  if (type === 'true_false_not_given') {
    return (
      <div className="space-y-5">
        <TypeInfoBox
          title="True / False / Not Given (Factual)"
          description="Tests whether FACTUAL information in the passage agrees with, contradicts, or doesn't mention the statement. TRUE = passage says this. FALSE = passage says the opposite. NOT GIVEN = passage doesn't give this information."
          example="Statement: 'The experiment was conducted in 2019.' → TRUE (if passage confirms), FALSE (if passage says different year), NOT GIVEN (if no date mentioned)"
          tips="Focus on facts, dates, numbers, and specific claims. Be careful: NOT GIVEN means NO information, not 'probably true/false'."
        />
        
        <TextArea
          label="Statement (Factual Claim)"
          placeholder="e.g., The research team consisted of five members."
          rows={2}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Select Correct Answer</label>
          <p className="text-xs text-gray-400 mb-2">Does the passage confirm, contradict, or not mention this fact?</p>
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
        <TypeInfoBox
          title="Yes / No / Not Given (Writer's Views)"
          description="Tests whether the writer's OPINION or CLAIM matches the statement. YES = writer agrees. NO = writer disagrees. NOT GIVEN = writer doesn't express a view on this."
          example="Statement: 'The author believes technology will solve climate change.' → YES/NO/NOT GIVEN based on writer's expressed opinion"
          tips="Look for opinion words: believes, argues, suggests, thinks. Different from T/F/NG which tests facts, not opinions."
        />
        
        <TextArea
          label="Statement (Writer's View/Claim)"
          placeholder="e.g., The author believes that traditional methods are more effective."
          rows={2}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Select Correct Answer</label>
          <p className="text-xs text-gray-400 mb-2">Does the writer agree, disagree, or not give an opinion?</p>
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
        <TypeInfoBox
          title="Matching Headings"
          description="Students match Roman numeral headings (i, ii, iii, iv...) to paragraphs. There are more headings than paragraphs (some are distractors). Each question asks which heading fits ONE paragraph."
          example="Paragraph C → Heading: iv 'The unexpected benefits of the study'"
          tips="Use lowercase Roman numerals (i, ii, iii, iv, v). Headings should summarize paragraph main ideas. Include 2-3 extra distractor headings."
        />
        
        <Input
          label="Paragraph Being Matched"
          placeholder="e.g., Paragraph C / Section 2"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="bg-indigo-50/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-indigo-700 uppercase tracking-wide">List of Headings</label>
            <select
              className="text-xs px-2 py-1 border border-indigo-200 rounded bg-white"
              value={count}
              onChange={(e) => updateQuestion(question.id, { heading_count: e.target.value })}
            >
              {[3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <p className="text-xs text-indigo-600 mb-2">Enter the heading options students will choose from (include distractors)</p>
          <div className="space-y-2">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-medium text-indigo-600">{['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'][i]}</span>
                <input
                  className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-200 rounded text-sm focus:border-indigo-400 outline-none"
                  placeholder={i === 0 ? 'e.g., The origins of the problem' : i === 1 ? 'e.g., A surprising solution' : `Heading ${['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'][i]}`}
                  value={question[`heading_${i + 1}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`heading_${i + 1}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Heading Number</label>
          <input
            className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="e.g., iv"
            value={question.answer || ""}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
          <p className="text-xs text-green-600 mt-1">Enter the Roman numeral of the correct heading (lowercase)</p>
        </div>
      </div>
    );
  }

  // MATCHING INFORMATION / FEATURES
  if (type === 'matching_information' || type === 'matching_features') {
    const itemCount = parseInt(question.match_count) || 3;
    const isInfo = type === 'matching_information';
    return (
      <div className="space-y-5">
        <TypeInfoBox
          title={isInfo ? "Matching Information to Paragraphs" : "Matching Features/Items to Categories"}
          description={isInfo 
            ? "Students match statements/questions to the paragraphs (A, B, C...) where the information is found. Same paragraph can be used more than once."
            : "Students match items or features to named categories (e.g., researchers, time periods, theories). Requires understanding who said/did what."
          }
          example={isInfo 
            ? "Statement: 'A reference to financial costs' → Paragraph B"
            : "Feature: 'Believed the experiment was flawed' → Dr. Smith (Category A)"
          }
          tips={isInfo
            ? "Statements may paraphrase text. One paragraph can match multiple statements."
            : "Categories are usually people, time periods, or theories mentioned in the passage."
          }
        />
        
        <Input
          label={isInfo ? "Statement to Match" : "Feature/Item Description"}
          placeholder={isInfo 
            ? "e.g., A mention of environmental concerns" 
            : "e.g., Conducted the longest study"}
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
        <TypeInfoBox
          title="Matching Sentence Endings"
          description="Students complete sentence beginnings by choosing the correct ending from a list (A-G). There are more endings than beginnings (distractors). Tests understanding of how ideas connect."
          example="Beginning: 'The scientists concluded that...' + Ending C: '...further research was needed.' → Answer: C"
          tips="Sentence beginnings and endings should be grammatically compatible. Include plausible distractor endings that don't complete the meaning correctly."
        />
        
        <Input
          label="Sentence Beginning"
          placeholder="e.g., According to the passage, the main problem was that..."
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="bg-teal-50/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-teal-700 uppercase tracking-wide">Possible Endings (A-G)</label>
            <select
              className="text-xs px-2 py-1 border border-teal-200 rounded bg-white"
              value={count}
              onChange={(e) => updateQuestion(question.id, { ending_count: e.target.value })}
            >
              {[3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <p className="text-xs text-teal-600 mb-2">Enter all possible endings. Include extra distractors. Start each with lowercase.</p>
          <div className="space-y-2">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-teal-100 rounded text-xs font-medium text-teal-700">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  className="flex-1 px-2.5 py-1.5 bg-white border border-teal-200 rounded text-sm focus:border-teal-400 outline-none"
                  placeholder={i === 0 ? 'e.g., ...the project was abandoned.' : i === 1 ? 'e.g., ...funding was increased.' : `Ending ${String.fromCharCode(65 + i)}`}
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
    const isSummary = type === 'summary_completion';
    return (
      <div className="space-y-5">
        <TypeInfoBox
          title={isSummary ? "Summary Completion" : "Table Completion"}
          description={isSummary 
            ? "Students complete a summary of the passage by filling in numbered gaps with words. Words may come directly from the passage or from a provided word bank."
            : "Students fill in missing cells in a table that organizes information from the passage. Tests ability to locate and understand specific details."
          }
          example={isSummary 
            ? "'The study found that (1)_____ was the main factor...' → Answer: 'pollution' (from passage)"
            : "| Type | Advantage | → Fill in: (1)_____ in the Advantage column"
          }
          tips={isSummary 
            ? "Ensure answers are exact words from the passage. Specify word limit (e.g., 'NO MORE THAN TWO WORDS')."
            : "Use clear table structure. Answers should be findable in the passage."
          }
        />
        
        <Input
          label={isSummary ? "Summary Title/Topic" : "Table Title/Topic"}
          placeholder={isSummary ? "e.g., Summary: The Effects of Climate Change" : "e.g., Comparison of Research Methods"}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <TextArea
          label={isSummary ? "Summary Content" : "Table Content"}
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
        <TypeInfoBox
          title="Sentence Completion"
          description="Students complete a sentence using words taken directly from the passage. Tests locating and understanding specific information. Answers are usually 1-3 words."
          example="'The main cause of the decline was _____.' → Answer: 'overfishing' (found in passage)"
          tips="The sentence should paraphrase passage content. Answer must be word(s) that appear in the passage. Specify word limit in instructions."
        />
        
        <TextArea
          label="Sentence with Blank"
          hint="Use _____ to mark where the answer goes"
          placeholder="e.g., According to the passage, the primary reason for the failure was _____."
          rows={3}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Answer</label>
          <p className="text-xs text-green-600 mb-2">Enter the exact word(s) from the passage that complete the sentence</p>
          <input
            className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="e.g., insufficient funding"
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
        <TypeInfoBox
          title="Diagram/Flow-chart Labeling"
          description="Students label parts of a diagram, process, or flow-chart with words from the passage. Tests understanding of processes, systems, or relationships described in the text."
          example="Label 3 on the process diagram → Answer: 'fermentation' (the step described in the passage)"
          tips="Diagrams should match processes described in the passage. Labels are usually nouns or short noun phrases taken directly from the text."
        />
        
        <Input
          label="Label Number/Reference"
          placeholder="e.g., Label 3 / Part A / Step 2"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Diagram/Process Image URL</label>
          <p className="text-xs text-gray-400 mb-2">Upload your diagram image and paste the URL. Image should have clearly numbered parts.</p>
          <input
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-400 outline-none"
            placeholder="https://example.com/process-diagram.png"
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
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Label Answer</label>
          <p className="text-xs text-green-600 mb-2">Enter the word(s) from the passage that should label this part</p>
          <input
            className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="e.g., extraction process / heating element"
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
      <TypeInfoBox
        title="Short Answer Question"
        description="Students answer a question using words taken directly from the passage. Tests ability to locate specific information. Answers are usually factual: names, numbers, places, dates."
        example="Q: 'In which year was the museum founded?' → Answer: '1892' (from passage)"
        tips="Questions should be answerable with specific words from the text. Specify word limit (e.g., 'NO MORE THAN THREE WORDS')."
      />
      
      <Input
        label="Question"
        placeholder="e.g., How many participants were involved in the study?"
        value={question.text || ""}
        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
      />

      <div className="bg-green-50 rounded-lg p-3">
        <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Answer</label>
        <p className="text-xs text-green-600 mb-2">Enter the exact word(s)/number from the passage</p>
        <input
          className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
          placeholder="e.g., 250 / three years / Dr. Williams"
          value={question.answer || ""}
          onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
        />
        <p className="text-xs text-green-500 mt-2 italic">💡 Best practice: specify word limit in your question (e.g., 'Answer with NO MORE THAN TWO WORDS')</p>
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
