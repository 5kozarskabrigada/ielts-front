import React, { useState, useRef } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { 
  ChevronDown, ChevronUp, Plus, Trash2, Mic, FileText, 
  Clock, AlertCircle, CheckCircle, Eye, EyeOff, Info, Edit3,
  Upload, Play, Pause, Volume2, Target, List, Table, MapPin,
  MessageSquare, HelpCircle, Users, Building, Briefcase
} from "lucide-react";

// IELTS Listening Question Types with icons and descriptions
const QUESTION_TYPES = [
  { value: "multiple_choice_single", label: "Multiple Choice (Single)", icon: Target, description: "Choose one correct answer", color: "blue" },
  { value: "multiple_choice_multiple", label: "Multiple Choice (Multiple)", icon: List, description: "Choose multiple answers", color: "blue" },
  { value: "matching", label: "Matching", icon: Target, description: "Match items to options", color: "purple" },
  { value: "map_labeling", label: "Plan/Map/Diagram Labeling", icon: MapPin, description: "Label locations on a map", color: "purple" },
  { value: "form_completion", label: "Form Completion", icon: FileText, description: "Complete a form with details", color: "amber" },
  { value: "note_completion", label: "Note Completion", icon: Edit3, description: "Complete notes from audio", color: "amber" },
  { value: "table_completion", label: "Table Completion", icon: Table, description: "Fill gaps in a table", color: "amber" },
  { value: "summary_completion", label: "Summary Completion", icon: FileText, description: "Complete a summary", color: "amber" },
  { value: "sentence_completion", label: "Sentence Completion", icon: Edit3, description: "Complete sentences", color: "teal" },
  { value: "short_answer", label: "Short Answer", icon: MessageSquare, description: "Answer with words from audio", color: "teal" },
];

// IELTS Listening Section contexts
const SECTION_CONTEXTS = [
  { value: 1, label: "Section 1", icon: Users, description: "Social conversation between 2 people", difficulty: "Easiest" },
  { value: 2, label: "Section 2", icon: Building, description: "Monologue on social topic", difficulty: "Easy" },
  { value: 3, label: "Section 3", icon: Briefcase, description: "Academic discussion (2-4 people)", difficulty: "Medium" },
  { value: 4, label: "Section 4", icon: FileText, description: "Academic lecture/monologue", difficulty: "Hardest" },
];

const getQuestionTypeInfo = (typeValue) => {
  return QUESTION_TYPES.find(t => t.value === typeValue) || QUESTION_TYPES[0];
};

function QuestionEditor({ question, updateQuestion, deleteQuestion, index, sectionNumber }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeInfo = getQuestionTypeInfo(question.type);
  const IconComponent = typeInfo.icon;
  
  const isConfigured = question.text && question.answer;
  const globalQuestionNumber = (sectionNumber - 1) * 10 + index + 1;

  return (
    <div className={`border rounded-xl bg-white overflow-hidden transition-all ${isExpanded ? 'shadow-md ring-2 ring-amber-200' : 'shadow-sm hover:shadow'}`}>
      <div 
        className={`p-4 flex justify-between items-center cursor-pointer transition ${
          isExpanded ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm ${
            isConfigured ? 'bg-amber-600 text-white' : 'bg-gray-300 text-gray-600'
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
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <TypeIcon size={16} className={`mt-0.5 ${question.type === type.value ? 'text-amber-600' : 'text-gray-400'}`} />
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
              className="w-full h-24 p-3 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              placeholder="Enter the question text..."
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
                      className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
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
            <input
              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder={question.type?.includes('multiple_choice') ? "Enter correct option (e.g., A, B, C, or D)" : "Enter the correct answer..."}
              value={question.answer || ""}
              onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-2">
              <Info size={12} className="inline mr-1" />
              For completion questions, accept minor spelling variations in grading
            </p>
          </div>

          {/* Audio Timestamp (Optional) */}
          <div className="border-t pt-4">
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <Clock size={14} className="mr-2" /> Audio Timestamp (Optional)
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-gray-50"
              placeholder="e.g., 2:30 - when this question's answer appears"
              value={question.timestamp || ""}
              onChange={(e) => updateQuestion(question.id, { timestamp: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionEditor({ section, sectionNumber }) {
  const { updateSection, questions, addQuestion, updateQuestion, deleteQuestion } = useExamEditor();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const sectionQuestions = questions.filter(q => q.section_id === section.id);
  const sectionContext = SECTION_CONTEXTS.find(c => c.value === sectionNumber) || SECTION_CONTEXTS[0];
  const ContextIcon = sectionContext.icon;
  
  const isConfigured = section.audio_url && sectionQuestions.length === 10;

  // Gradient colors for each section
  const gradientColors = [
    'from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100',
    'from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100',
    'from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100',
    'from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100',
  ];
  const badgeColors = ['bg-amber-600', 'bg-orange-600', 'bg-rose-600', 'bg-red-600'];

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
      {/* Header */}
      <div 
        className={`p-5 border-b flex justify-between items-center cursor-pointer transition bg-gradient-to-r ${gradientColors[sectionNumber - 1] || gradientColors[0]}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold text-lg text-white ${badgeColors[sectionNumber - 1] || badgeColors[0]}`}>
            {sectionNumber}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-gray-900 text-lg">
                {section.title || `Section ${sectionNumber}`}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                sectionNumber <= 2 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {sectionContext.difficulty}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <ContextIcon size={14} className="text-gray-500" />
              <p className="text-sm text-gray-600">{sectionContext.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            isConfigured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isConfigured ? 'Configured' : `${sectionQuestions.length}/10 Questions`}
          </span>
          {isExpanded ? <ChevronUp size={22} className="text-gray-400" /> : <ChevronDown size={22} className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Section Title */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <Edit3 size={14} className="mr-2" /> Section Title
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder={`e.g., "${sectionNumber === 1 ? 'Booking a Hotel Room' : sectionNumber === 2 ? 'Local Community Centre' : sectionNumber === 3 ? 'Research Project Discussion' : 'Lecture on Marine Biology'}"`}
              value={section.title || ""}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
            />
          </div>

          {/* Audio Upload */}
          <div>
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <Mic size={14} className="mr-2" /> Audio Recording
            </label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
              section.audio_url ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:bg-gray-50'
            }`}>
              {section.audio_url ? (
                <div className="space-y-4">
                  {/* Audio Player */}
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
                      className="w-14 h-14 flex items-center justify-center bg-amber-600 text-white rounded-full hover:bg-amber-700 transition shadow-lg"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">Audio loaded</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{section.audio_url}</p>
                    </div>
                    <audio ref={audioRef} src={section.audio_url} onEnded={() => setIsPlaying(false)} />
                  </div>
                  
                  {/* URL Input */}
                  <div className="flex items-center justify-center space-x-2 pt-2 border-t">
                    <input 
                      type="text" 
                      className="flex-1 max-w-md text-sm border p-2 rounded-lg" 
                      value={section.audio_url}
                      onChange={(e) => updateSection(section.id, { audio_url: e.target.value })}
                      placeholder="Audio URL..."
                    />
                    <button 
                      onClick={() => updateSection(section.id, { audio_url: "" })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload size={28} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Upload Audio Recording</p>
                  <p className="text-xs text-gray-500 mt-1">MP3 or WAV format • Recommended: High quality audio</p>
                  <input 
                    type="text" 
                    className="mt-4 w-full max-w-md mx-auto text-sm border p-2 rounded-lg" 
                    placeholder="Or paste audio URL here..."
                    onChange={(e) => updateSection(section.id, { audio_url: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Transcript Section */}
          <div className="border-t pt-6">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center space-x-2 text-sm font-bold text-gray-700 mb-3 hover:text-amber-600"
            >
              {showTranscript ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>Transcript {showTranscript ? '(Hide)' : '(Show)'}</span>
              <span className="text-xs font-normal text-gray-400">Internal reference only</span>
            </button>
            
            {showTranscript && (
              <div className="space-y-2">
                <textarea
                  className="w-full h-48 p-4 border rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-amber-500 outline-none resize-none bg-gray-50"
                  placeholder="Paste the audio transcript here. This is for internal reference and won't be shown to students during the exam..."
                  value={section.content || ""}
                  onChange={(e) => updateSection(section.id, { content: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  <Info size={12} className="inline mr-1" />
                  The transcript helps with question creation and answer verification
                </p>
              </div>
            )}
          </div>

          {/* Questions Section */}
          <div className="border-t pt-6">
            <div 
              className="flex justify-between items-center mb-4 cursor-pointer"
              onClick={() => setShowQuestions(!showQuestions)}
            >
              <div className="flex items-center space-x-2">
                {showQuestions ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
                <h5 className="font-bold text-gray-700">Questions ({sectionQuestions.length}/10)</h5>
                <span className="text-xs text-gray-500">Click to {showQuestions ? 'collapse' : 'expand'}</span>
              </div>
              <button
                onClick={(e) => { 
                  e.stopPropagation();
                  if (sectionQuestions.length < 10) {
                    addQuestion(section.id, { type: 'multiple_choice_single', text: '', answer: '' });
                  }
                }}
                disabled={sectionQuestions.length >= 10}
                className="text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition"
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
                    sectionNumber={sectionNumber}
                    updateQuestion={updateQuestion}
                    deleteQuestion={deleteQuestion}
                  />
                ))}
                {sectionQuestions.length === 0 && (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Volume2 size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No questions added yet</p>
                    <p className="text-sm text-gray-400 mt-1">Each section should have exactly 10 questions</p>
                  </div>
                )}
                
                {sectionQuestions.length > 0 && sectionQuestions.length < 10 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-yellow-700">
                      <AlertCircle size={14} className="inline mr-1" />
                      {10 - sectionQuestions.length} more question{10 - sectionQuestions.length > 1 ? 's' : ''} needed to complete this section
                    </p>
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

export default function ListeningTab() {
  const { sections, exam } = useExamEditor();
  const listeningSections = sections.filter(s => s.module_type === 'listening');
  const sortedSections = [...listeningSections].sort((a, b) => a.section_order - b.section_order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Listening Module</h3>
          <p className="text-sm text-gray-500 mt-1">
            4 Sections • 40 Questions • 30 minutes + 10 minutes transfer time
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full">
            <Mic size={14} />
            <span>40 Questions Total</span>
          </div>
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
            <Clock size={14} />
            <span>~30 Minutes</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900">IELTS Listening Format</h4>
            <p className="text-sm text-amber-800 mt-1">
              <strong>4 Sections:</strong> Audio is played ONCE only. Each section has 10 questions and gets progressively harder.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {SECTION_CONTEXTS.map((ctx, idx) => (
                <div key={idx} className="text-xs bg-white rounded-lg p-2 border border-amber-100">
                  <span className="font-medium text-amber-900">Section {idx + 1}:</span>
                  <span className="text-amber-700 ml-1">{ctx.description.split(' ').slice(0, 3).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section Editors */}
      <div className="space-y-6">
        {sortedSections.length > 0 ? (
          sortedSections.map((section, idx) => (
            <SectionEditor 
              key={section.id} 
              section={section} 
              sectionNumber={idx + 1}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
            <Mic size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Listening sections not initialized. Try refreshing.</p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gray-50 rounded-xl p-5 border">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center">
          <CheckCircle size={18} className="mr-2 text-green-600" />
          Section Setup Checklist
        </h4>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          {SECTION_CONTEXTS.map((ctx, idx) => (
            <div key={idx}>
              <p className="font-medium text-gray-700 mb-2 flex items-center">
                <ctx.icon size={14} className="mr-1" />
                Section {idx + 1}
              </p>
              <ul className="space-y-1 text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className={`w-1.5 h-1.5 ${badgeColors[idx]} rounded-full`} style={{ backgroundColor: ['#d97706', '#ea580c', '#e11d48', '#dc2626'][idx] }}></span>
                  <span>Upload audio file</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: ['#d97706', '#ea580c', '#e11d48', '#dc2626'][idx] }}></span>
                  <span>Add 10 questions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: ['#d97706', '#ea580c', '#e11d48', '#dc2626'][idx] }}></span>
                  <span>Set correct answers</span>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export badge colors for use in checklist
const badgeColors = ['bg-amber-600', 'bg-orange-600', 'bg-rose-600', 'bg-red-600'];
