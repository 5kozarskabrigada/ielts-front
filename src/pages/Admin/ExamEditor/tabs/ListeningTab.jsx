import React, { useState, useRef } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { 
  ChevronDown, Plus, Trash2, Mic, Play, Pause, CheckCircle, 
  HelpCircle, ListChecks, ArrowRightLeft, MapPin, FileText, 
  StickyNote, Table2, Type, MessageSquare, Info
} from "lucide-react";

// Question types with icons and detailed descriptions
const QUESTION_TYPES = [
  { 
    value: "multiple_choice", 
    label: "Multiple Choice", 
    icon: ListChecks, 
    hint: "Student picks ONE correct answer (A/B/C/D) from four options"
  },
  { 
    value: "matching", 
    label: "Matching", 
    icon: ArrowRightLeft, 
    hint: "Student matches numbered items to lettered options (more options than items)"
  },
  { 
    value: "map_labeling", 
    label: "Map/Plan", 
    icon: MapPin, 
    hint: "Student labels numbered locations on a map, plan, or diagram"
  },
  { 
    value: "form_completion", 
    label: "Form", 
    icon: FileText, 
    hint: "Student fills in blanks in a form (name, date, phone, etc.)"
  },
  { 
    value: "note_completion", 
    label: "Notes", 
    icon: StickyNote, 
    hint: "Student completes gaps in lecture/meeting notes"
  },
  { 
    value: "table_completion", 
    label: "Table", 
    icon: Table2, 
    hint: "Student fills in missing cells in a table"
  },
  { 
    value: "sentence_completion", 
    label: "Sentence", 
    icon: Type, 
    hint: "Student completes a sentence with words from the audio"
  },
  { 
    value: "short_answer", 
    label: "Short Answer", 
    icon: MessageSquare, 
    hint: "Student answers a direct question with 1-3 words from the audio"
  },
];

// Info box component for question type guidance
const TypeInfoBox = ({ title, description, example, tips }) => (
  <div className="mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 flex items-center justify-center bg-amber-100 rounded-lg flex-shrink-0">
        <Info size={16} className="text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-amber-900 text-sm">{title}</h4>
        <p className="text-xs text-amber-700 mt-1">{description}</p>
        {example && (
          <div className="mt-2 bg-white/60 rounded-lg px-3 py-2 border border-amber-100">
            <span className="text-xs font-medium text-amber-600">Example: </span>
            <span className="text-xs text-amber-800">{example}</span>
          </div>
        )}
        {tips && (
          <p className="text-xs text-amber-600 mt-2 italic">💡 {tips}</p>
        )}
      </div>
    </div>
  </div>
);

// Styled input component
const Input = ({ label, hint, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    <input
      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition"
      {...props}
    />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

// Styled textarea component
const TextArea = ({ label, hint, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    <textarea
      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition resize-none"
      {...props}
    />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

// Question type specific fields
function QuestionFields({ question, updateQuestion }) {
  const type = question.type || 'short_answer';
  const typeInfo = QUESTION_TYPES.find(t => t.value === type);

  // MULTIPLE CHOICE
  if (type === 'multiple_choice') {
    return (
      <div className="space-y-5">
        <TypeInfoBox
          title="Multiple Choice Question"
          description="Write a question and provide 4 answer options. The student will hear the audio and select the ONE correct answer."
          example="Q: What is the main reason for the speaker's visit? A) To attend a meeting B) To give a presentation C) To meet a client D) To sign a contract"
          tips="Make wrong options plausible but clearly distinguishable from the correct answer."
        />
        
        <Input
          label="Question Text"
          placeholder="e.g., What is the main purpose of the announcement?"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />
        
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Answer Options (A-D)</label>
          <p className="text-xs text-gray-400 mb-3">Enter the text for each option. The student will see these choices.</p>
          <div className="space-y-2">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <div key={letter} className="flex items-center gap-2">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                  question.answer === letter ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {letter}
                </div>
                <input
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-amber-400 outline-none"
                  placeholder={letter === 'A' ? 'e.g., To announce a schedule change' : letter === 'B' ? 'e.g., To introduce a new policy' : letter === 'C' ? 'e.g., To welcome new employees' : 'e.g., To explain safety procedures'}
                  value={question[`option_${letter.toLowerCase()}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`option_${letter.toLowerCase()}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Select Correct Answer</label>
          <p className="text-xs text-gray-400 mb-2">Click the letter that represents the correct answer.</p>
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

  // MATCHING
  if (type === 'matching') {
    const itemCount = parseInt(question.match_count) || 3;
    const optCount = itemCount + 2;
    return (
      <div className="space-y-5">
        <TypeInfoBox
          title="Matching Question"
          description="Create numbered items (questions/statements) and lettered options. Students match each number to a letter. Always provide MORE options than items (extra distractors)."
          example="Match speakers 1-3 to their opinions A-E: 1→C, 2→A, 3→E (B and D are distractors)"
          tips="Options should be similar in length and complexity. The answer format is: 1-B, 2-D, 3-A"
        />
        
        <Input
          label="Instructions for Student"
          placeholder="e.g., Match each speaker (1-3) with the opinion they express (A-E)"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Items Column */}
          <div className="bg-blue-50/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">Items to Match (numbered)</label>
              <select
                className="text-xs px-2 py-1 border border-blue-200 rounded bg-white"
                value={itemCount}
                onChange={(e) => updateQuestion(question.id, { match_count: e.target.value })}
              >
                {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <p className="text-xs text-blue-600 mb-2">These are what students will match FROM</p>
            <div className="space-y-2">
              {[...Array(itemCount)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded text-xs font-medium text-blue-700">{i + 1}</span>
                  <input
                    className="flex-1 px-2.5 py-1.5 bg-white border border-blue-200 rounded text-sm focus:border-blue-400 outline-none"
                    placeholder={i === 0 ? 'e.g., Speaker 1 / First person' : i === 1 ? 'e.g., Speaker 2 / Second person' : `Item ${i + 1}`}
                    value={question[`item_${i + 1}`] || ""}
                    onChange={(e) => updateQuestion(question.id, { [`item_${i + 1}`]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Options Column */}
          <div className="bg-purple-50/50 rounded-lg p-3">
            <label className="block text-xs font-medium text-purple-700 uppercase tracking-wide mb-2">Options (lettered) - Include extras!</label>
            <p className="text-xs text-purple-600 mb-2">These are what students will match TO</p>
            <div className="space-y-2">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, optCount).map((letter) => (
                <div key={letter} className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-purple-100 rounded text-xs font-medium text-purple-700">{letter}</span>
                  <input
                    className="flex-1 px-2.5 py-1.5 bg-white border border-purple-200 rounded text-sm focus:border-purple-400 outline-none"
                    placeholder={`Option ${letter}`}
                    value={question[`match_opt_${letter.toLowerCase()}`] || ""}
                    onChange={(e) => updateQuestion(question.id, { [`match_opt_${letter.toLowerCase()}`]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Answers</label>
          <input
            className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="1-B, 2-D, 3-A"
            value={question.answer || ""}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
          <p className="text-xs text-green-600 mt-1.5">Format: number-letter (e.g., 1-B, 2-D)</p>
        </div>
      </div>
    );
  }

  // MAP/DIAGRAM LABELING
  if (type === 'map_labeling') {
    const labelCount = parseInt(question.label_count) || 4;
    return (
      <div className="space-y-5">
        <TypeInfoBox
          title="Map/Plan/Diagram Labeling"
          description="Students label numbered points on a map, floor plan, or diagram based on audio directions. Upload an image and specify what each numbered label should be."
          example="'Number 1 on the map... that's where you'll find the main reception' → Answer: 1-Reception"
          tips="Use clear directional language in audio (left, right, opposite, next to). Answers are usually location names or room names."
        />
        
        <Input
          label="Instructions for Student"
          placeholder="e.g., Label the plan of the university campus (questions 1-5)"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Map/Diagram Image URL</label>
          <p className="text-xs text-gray-400 mb-2">Upload your image somewhere and paste the URL. The image should have numbered markers (1, 2, 3...)</p>
          <input
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-amber-400 outline-none"
            placeholder="https://example.com/campus-plan.png"
            value={question.image_url || ""}
            onChange={(e) => updateQuestion(question.id, { image_url: e.target.value })}
          />
          {question.image_url && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
              <img src={question.image_url} alt="Map preview" className="max-h-40 mx-auto rounded" />
            </div>
          )}
        </div>

        <div className="bg-orange-50/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-orange-700 uppercase tracking-wide">Label Answers</label>
            <select
              className="text-xs px-2 py-1 border border-orange-200 rounded bg-white"
              value={labelCount}
              onChange={(e) => updateQuestion(question.id, { label_count: e.target.value })}
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <p className="text-xs text-orange-600 mb-2">Enter what each numbered location should be labeled as</p>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(labelCount)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded text-xs font-medium text-orange-700">{i + 1}</span>
                <input
                  className="flex-1 px-2.5 py-1.5 bg-white border border-orange-200 rounded text-sm focus:border-orange-400 outline-none"
                  placeholder={i === 0 ? 'e.g., Library' : i === 1 ? 'e.g., Cafeteria' : `Location ${i + 1}`}
                  value={question[`label_${i + 1}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`label_${i + 1}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Answers</label>
          <input
            className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="1-Library, 2-Cafeteria, 3-Sports Hall"
            value={question.answer || ""}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
        </div>
      </div>
    );
  }

  // FORM COMPLETION
  if (type === 'form_completion') {
    const fieldCount = parseInt(question.field_count) || 4;
    return (
      <div className="space-y-5">
        <TypeInfoBox
          title="Form Completion"
          description="Students fill in blanks in a form (application, booking, registration, etc.). They hear details like names, dates, phone numbers, addresses and write them in the correct fields."
          example="Hotel Booking: Name: _____ | Check-in: _____ | Room Type: _____ → Answers: 'Johnson', 'March 15', 'double'"
          tips="Include typical form fields: names (spelling matters!), dates, times, numbers, addresses. Audio usually spells out names clearly."
        />
        
        <Input
          label="Form Title/Type"
          placeholder="e.g., Hotel Reservation Form / Library Membership Application"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">Form Fields</label>
            <select
              className="text-xs px-2 py-1 border border-slate-200 rounded bg-white"
              value={fieldCount}
              onChange={(e) => updateQuestion(question.id, { field_count: e.target.value })}
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <p className="text-xs text-slate-500 mb-3">Left: What the form field is labeled | Right: The correct answer students should write</p>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 mb-1">
              <span className="text-xs text-slate-500 font-medium">Field Label (shown to student)</span>
              <span className="text-xs text-green-600 font-medium">Correct Answer</span>
            </div>
            {[...Array(fieldCount)].map((_, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <input
                  className="px-2.5 py-2 bg-white border border-slate-200 rounded text-sm focus:border-slate-400 outline-none"
                  placeholder={i === 0 ? 'e.g., Full Name' : i === 1 ? 'e.g., Phone Number' : i === 2 ? 'e.g., Email Address' : `Field ${i + 1}`}
                  value={question[`field_${i + 1}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`field_${i + 1}`]: e.target.value })}
                />
                <input
                  className="px-2.5 py-2 bg-green-50 border border-green-200 rounded text-sm focus:border-green-400 outline-none"
                  placeholder={i === 0 ? 'e.g., Sarah Mitchell' : i === 1 ? 'e.g., 07845 123456' : i === 2 ? 'e.g., s.mitchell@email.com' : 'Answer'}
                  value={question[`field_ans_${i + 1}`] || ""}
                  onChange={(e) => updateQuestion(question.id, { [`field_ans_${i + 1}`]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // NOTE COMPLETION
  if (type === 'note_completion') {
    const gapCount = parseInt(question.gap_count) || 4;
    return (
      <div className="space-y-5">
        <TypeInfoBox
          title="Note Completion"
          description="Students complete gaps in lecture/meeting notes. The notes are written in abbreviated form with numbered blanks that students fill in from audio."
          example="Topic: Marine _____(1)_____ | Location: Great Barrier _____(2)_____ | Started: _____(3)_____ years ago"
          tips="Keep notes brief and use bullet points/headings. Use (1), (2), (3) to number blanks clearly. Answers are usually 1-2 words."
        />
        
        <Input
          label="Notes Title"
          placeholder="e.g., Notes on Marine Biology Lecture / Meeting Minutes"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <TextArea
          label="Notes Content with Blanks"
          hint="Number each blank clearly: (1) ___, (2) ___, etc. Students see this structure."
          placeholder={"MARINE CONSERVATION LECTURE\n\nTopic: (1) _____ ecosystems\n\nKey Points:\n• Found in: (2) _____ regions\n• Main threat: (3) _____\n• Solution: protect (4) _____"}
          rows={6}
          value={question.content || ""}
          onChange={(e) => updateQuestion(question.id, { content: e.target.value })}
        />

        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Correct Answers</label>
            <select
              className="text-xs px-2 py-1 border border-green-200 rounded bg-white"
              value={gapCount}
              onChange={(e) => updateQuestion(question.id, { gap_count: e.target.value })}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <p className="text-xs text-green-600 mb-2">Enter the correct word(s) for each numbered blank above</p>
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

  // TABLE COMPLETION
  if (type === 'table_completion') {
    const gapCount = parseInt(question.gap_count) || 4;
    return (
      <div className="space-y-5">
        <TypeInfoBox
          title="Table Completion"
          description="Students fill in missing cells in a table based on information they hear. Tables typically compare items, list features, or organize data."
          example="| Hotel | Price | Rating |\n| Grand | (1)_____ | 4-star |\n| Plaza | $150 | (2)_____ |"
          tips="Keep table structure simple. Use markdown-style formatting with | for columns. Clear column headers help students follow along."
        />
        
        <Input
          label="Table Topic/Title"
          placeholder="e.g., Comparison of Three Hotel Options / Course Schedule"
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <TextArea
          label="Table Structure with Blanks"
          hint="Use | to separate columns. Number blanks (1), (2), etc."
          placeholder={"| Feature | Option A | Option B |\n|---------|----------|----------|\n| Price | (1) _____ | $200 |\n| Location | Central | (2) _____ |\n| Rating | 3-star | (3) _____ |"}
          rows={6}
          value={question.content || ""}
          onChange={(e) => updateQuestion(question.id, { content: e.target.value })}
        />

        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-green-700 uppercase tracking-wide">Correct Answers</label>
            <select
              className="text-xs px-2 py-1 border border-green-200 rounded bg-white"
              value={gapCount}
              onChange={(e) => updateQuestion(question.id, { gap_count: e.target.value })}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <p className="text-xs text-green-600 mb-2">Enter the correct value for each numbered blank in the table</p>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(gapCount)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-green-100 rounded text-xs font-medium text-green-700">{i + 1}</span>
                <input
                  className="flex-1 px-2 py-1.5 bg-white border border-green-200 rounded text-sm focus:border-green-400 outline-none"
                  placeholder={i === 0 ? 'e.g., $175' : i === 1 ? 'e.g., Suburbs' : `Answer ${i + 1}`}
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
          description="Students complete a sentence with a word or short phrase they hear in the audio. Usually 1-3 words maximum."
          example="'The museum was originally built in _____.' → Answer: '1856' or 'the 1850s'"
          tips="The sentence should be grammatically complete once the blank is filled. Answer is almost always heard word-for-word in the audio."
        />
        
        <TextArea
          label="Sentence with Blank"
          hint="Use _____ to show where the answer goes. Only ONE blank per question."
          placeholder="e.g., The new library will be completed by _____."
          rows={3}
          value={question.text || ""}
          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
        />

        <div className="bg-green-50 rounded-lg p-3">
          <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Answer</label>
          <input
            className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
            placeholder="e.g., September 2024 / next spring / three weeks"
            value={question.answer || ""}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
          <p className="text-xs text-green-600 mt-1.5">Usually 1-3 words or a number</p>
        </div>
      </div>
    );
  }

  // SHORT ANSWER (default)
  return (
    <div className="space-y-5">
      <TypeInfoBox
        title="Short Answer Question"
        description="Students answer a direct question with words they hear in the audio. Answers are usually factual information: names, numbers, times, places."
        example="Q: What time does the library close on weekends? → A: 5 pm (or '5:00 pm' / 'five o'clock')"
        tips="Write clear, specific questions. The answer should be stated clearly in the audio. Accept reasonable spelling variations."
      />
      
      <Input
        label="Question"
        placeholder="e.g., What is the maximum group size for the tour?"
        value={question.text || ""}
        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
      />

      <div className="bg-green-50 rounded-lg p-3">
        <label className="block text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">Correct Answer</label>
        <p className="text-xs text-green-600 mb-2">Enter the answer exactly as it should appear. Usually 1-3 words.</p>
        <input
          className="w-full px-3 py-2.5 bg-white border border-green-200 rounded-lg text-sm focus:border-green-400 outline-none"
          placeholder="e.g., 15 people / Tuesday / $25"
          value={question.answer || ""}
          onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
        />
        <p className="text-xs text-green-500 mt-2 italic">💡 Alternative correct answers (e.g., "5pm" vs "5:00 pm") may need to be handled during grading</p>
      </div>
    </div>
  );
}

// Question Card
function QuestionCard({ question, updateQuestion, deleteQuestion, index, sectionNumber }) {
  const [isOpen, setIsOpen] = useState(false);
  const qNum = (sectionNumber - 1) * 10 + index + 1;
  const hasContent = question.text && question.answer;
  const typeInfo = QUESTION_TYPES.find(t => t.value === question.type) || QUESTION_TYPES[7];
  const TypeIcon = typeInfo.icon;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      isOpen ? 'border-amber-300 shadow-sm' : 'border-gray-200'
    }`}>
      <div
        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition ${
          isOpen ? 'bg-amber-50' : 'bg-white hover:bg-gray-50'
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUESTION_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = question.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateQuestion(question.id, { type: type.value })}
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

// Section Card
function SectionCard({ section, sectionNumber }) {
  const { updateSection, questions, addQuestion, updateQuestion, deleteQuestion } = useExamEditor();
  const [isOpen, setIsOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const sectionQuestions = questions.filter(q => q.section_id === section.id);
  const completedCount = sectionQuestions.filter(q => q.text && q.answer).length;
  const hasAudio = !!section.audio_url;

  const colors = [
    { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  ][sectionNumber - 1] || { bg: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

  const toggleAudio = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${colors.bg} text-white font-bold text-lg`}>
            {sectionNumber}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{section.title || `Section ${sectionNumber}`}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm text-gray-500">{sectionQuestions.length}/10 questions</span>
              {completedCount > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.light} ${colors.text}`}>
                  {completedCount} ready
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sectionQuestions.length === 10 && completedCount === 10 && (
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Complete</span>
          )}
          <ChevronDown size={22} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <>
          <div className={`px-5 py-4 ${colors.light} border-t ${colors.border}`}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Title</label>
                <input
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-amber-400 outline-none"
                  placeholder="e.g., Conversation about renting"
                  value={section.title || ""}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Audio URL</label>
                <div className="flex gap-2">
                  {hasAudio && (
                    <button
                      onClick={toggleAudio}
                      className={`w-10 h-10 flex items-center justify-center ${colors.bg} text-white rounded-lg hover:opacity-90 transition`}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>
                  )}
                  <input
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-amber-400 outline-none"
                    placeholder="https://example.com/audio.mp3"
                    value={section.audio_url || ""}
                    onChange={(e) => updateSection(section.id, { audio_url: e.target.value })}
                  />
                  {hasAudio && <audio ref={audioRef} src={section.audio_url} onEnded={() => setIsPlaying(false)} />}
                </div>
              </div>
            </div>
            
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">+ Transcript (optional)</summary>
              <textarea
                className="w-full mt-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm resize-none focus:border-amber-400 outline-none"
                rows={3}
                placeholder="Paste transcript..."
                value={section.content || ""}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
              />
            </details>
          </div>

          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-700">Questions</h4>
              <button
                onClick={() => addQuestion(section.id, { type: 'short_answer', text: '', answer: '' })}
                disabled={sectionQuestions.length >= 10}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-40 transition"
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {sectionQuestions.length > 0 ? (
              <div className="space-y-3">
                {sectionQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={idx}
                    sectionNumber={sectionNumber}
                    updateQuestion={updateQuestion}
                    deleteQuestion={deleteQuestion}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Mic size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No questions yet</p>
              </div>
            )}

            {sectionQuestions.length > 0 && sectionQuestions.length < 10 && (
              <div className="mt-4 text-center text-xs text-amber-600 bg-amber-50 rounded-lg py-2">
                {10 - sectionQuestions.length} more needed
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Main Component
export default function ListeningTab() {
  const { sections } = useExamEditor();
  const listeningSections = sections
    .filter(s => s.module_type === 'listening')
    .sort((a, b) => a.section_order - b.section_order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Listening</h2>
          <p className="text-sm text-gray-500 mt-1">4 sections • 40 questions • ~30 min</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
          <Mic size={16} /> IELTS
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
        <HelpCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          Click a question to expand it. Select the type and fill in the fields. Each type shows different input fields.
        </p>
      </div>

      <div className="space-y-5">
        {listeningSections.length > 0 ? (
          listeningSections.map((section, idx) => (
            <SectionCard key={section.id} section={section} sectionNumber={idx + 1} />
          ))
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Mic size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No listening sections found</p>
          </div>
        )}
      </div>
    </div>
  );
}
