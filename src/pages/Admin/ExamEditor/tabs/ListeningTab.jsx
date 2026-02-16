import React, { useState } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { ChevronDown, ChevronUp, Plus, Trash2, Mic, FileText } from "lucide-react";

const QUESTION_TYPES = [
  "Multiple Choice (Single)", "Multiple Choice (Multiple)", "Matching", "Map Labeling",
  "Form Completion", "Note Completion", "Table Completion", "Sentence Completion", "Short Answer"
];

function QuestionEditor({ question, updateQuestion, deleteQuestion, index }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white mb-2">
      <div className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 rounded-t-lg" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="font-medium text-sm text-gray-700">Q{index + 1}: {question.type || "New Question"}</span>
        <div className="flex items-center space-x-2">
          <button onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-4 border-t">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Type</label>
            <select
              className="w-full p-2 border rounded text-sm"
              value={question.type}
              onChange={(e) => updateQuestion(question.id, { type: e.target.value })}
            >
              {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Question Text</label>
            <input
              className="w-full p-2 border rounded text-sm"
              value={question.text || ""}
              onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Correct Answer</label>
            <input
              className="w-full p-2 border rounded text-sm"
              value={question.answer || ""}
              onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionEditor({ section }) {
  const { updateSection, questions, addQuestion, updateQuestion, deleteQuestion } = useExamEditor();
  const [isExpanded, setIsExpanded] = useState(true);

  const sectionQuestions = questions.filter(q => q.section_id === section.id);

  return (
    <div className="border rounded-lg shadow-sm bg-white overflow-hidden">
      <div 
        className="p-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">
            {section.section_order}
          </div>
          <h4 className="font-bold text-gray-800">{section.title}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${sectionQuestions.length === 10 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {sectionQuestions.length}/10 Questions
          </span>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Media & Transcript */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Mic size={16} className="mr-2" /> Audio Source
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
                {section.audio_url ? (
                  <div className="text-green-600 text-sm font-medium break-all">{section.audio_url}</div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <p>Drag & Drop MP3/WAV</p>
                    <p className="text-xs mt-1">or click to upload</p>
                  </div>
                )}
                {/* Mock Upload Input */}
                <input 
                  type="text" 
                  className="mt-2 w-full text-xs border p-1 rounded" 
                  placeholder="Paste URL for mock..." 
                  value={section.audio_url || ""}
                  onChange={(e) => updateSection(section.id, { audio_url: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <FileText size={16} className="mr-2" /> Transcript (Internal)
              </label>
              <textarea
                className="w-full h-32 p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Paste transcript here..."
                value={section.content || ""}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-bold text-gray-700">Questions</h5>
              <button
                onClick={() => addQuestion(section.id, { type: 'Multiple Choice (Single)', text: '', answer: '' })}
                disabled={sectionQuestions.length >= 10}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
              >
                <Plus size={14} /> <span>Add Question</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {sectionQuestions.map((q, idx) => (
                <QuestionEditor 
                  key={q.id} 
                  question={q} 
                  index={idx}
                  updateQuestion={updateQuestion}
                  deleteQuestion={deleteQuestion}
                />
              ))}
              {sectionQuestions.length === 0 && (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded border border-dashed">
                  No questions added yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListeningTab() {
  const { sections } = useExamEditor();
  const listeningSections = sections.filter(s => s.module_type === 'listening');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Listening Module</h3>
        <span className="text-sm text-gray-500">4 Sections • 40 Questions Required</span>
      </div>
      
      {listeningSections.map(section => (
        <SectionEditor key={section.id} section={section} />
      ))}
    </div>
  );
}
