import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import { apiGetExam, apiUpdateExamStatus, apiGetExamLogs, apiAddQuestions, apiCreateSection } from "../../api";
import { 
  ArrowLeft, Clock, Shield, Users, Activity, FileText, Plus, Save, ChevronDown, ChevronUp, BookOpen, Headphones, PenTool 
} from "lucide-react";

export default function ExamDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  
  // Forms
  const [questionData, setQuestionData] = useState({
    module_type: "reading",
    question_text: "",
    question_number: 1,
    points: 1,
    correct_answer: "",
    section_id: "" // To be populated
  });

  const [sectionData, setSectionData] = useState({
    module_type: "reading",
    section_order: 1,
    title: "",
    content: "", // Passage or prompt
    audio_url: "",
    duration_minutes: 0
  });

  const fetchExamData = async () => {
    try {
      const data = await apiGetExam(token, id);
      setExam(data);
      if (activeTab === "logs") {
        const logData = await apiGetExamLogs(token, id);
        setLogs(logData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamData();
  }, [id, token, activeTab]);

  const handleStatusUpdate = async (updates) => {
    try {
      const updated = await apiUpdateExamStatus(token, id, updates);
      setExam({ ...exam, ...updated });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await apiCreateSection(token, id, sectionData);
      alert("Section created!");
      setIsSectionModalOpen(false);
      fetchExamData();
    } catch (err) {
      alert("Failed to create section: " + err.message);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      // Find default section if not selected?
      // For now, require section_id or handle top-level questions
      await apiAddQuestions(token, id, [questionData]);
      alert("Question added!");
      setIsQuestionModalOpen(false);
      setQuestionData(prev => ({
        ...prev,
        question_text: "",
        question_number: prev.question_number + 1
      }));
      fetchExamData();
    } catch (err) {
      alert("Failed to add question");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!exam) return <div className="p-8 text-center">Exam not found</div>;

  return (
    <div className="container mx-auto pb-10">
      <button onClick={() => navigate("/admin/exams")} className="flex items-center text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={18} className="mr-1" /> Back to Exams
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.title}</h1>
            <p className="text-gray-500">{exam.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${
              exam.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {exam.status}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-4 mt-6 pt-6 border-t">
          <button 
            onClick={() => handleStatusUpdate({ status: exam.status === 'active' ? 'draft' : 'active' })}
            className={`px-4 py-2 rounded font-medium transition ${
              exam.status === 'active' 
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {exam.status === 'active' ? 'Deactivate Exam' : 'Activate Exam'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {['overview', 'content', 'logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-md text-sm font-medium capitalize transition ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'content' ? 'Sections & Questions' : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <Clock size={32} className="mx-auto text-blue-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{exam.duration_minutes}m</div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <FileText size={32} className="mx-auto text-purple-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{exam.questions?.length || 0}</div>
              <div className="text-sm text-gray-500">Total Questions</div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Exam Content</h3>
              <div className="space-x-2">
                <button 
                  onClick={() => setIsSectionModalOpen(true)}
                  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 text-sm"
                >
                  + Add Section
                </button>
                <button 
                  onClick={() => setIsQuestionModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  + Add Question
                </button>
              </div>
            </div>
            
            {/* Sections List */}
            <div className="space-y-6">
              {['reading', 'listening', 'writing', 'speaking'].map(module => {
                const moduleSections = exam.sections?.filter(s => s.module_type === module) || [];
                const moduleQuestions = exam.questions?.filter(q => q.module_type === module) || [];
                if (moduleSections.length === 0 && moduleQuestions.length === 0) return null;

                return (
                  <div key={module} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                      <h4 className="font-bold uppercase text-gray-700 flex items-center">
                        {module === 'reading' && <BookOpen size={16} className="mr-2" />}
                        {module === 'listening' && <Headphones size={16} className="mr-2" />}
                        {module === 'writing' && <PenTool size={16} className="mr-2" />}
                        {module} Module
                      </h4>
                      <span className="text-xs text-gray-500">{moduleSections.length} Sections, {moduleQuestions.length} Questions</span>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* Sections */}
                      {moduleSections.map(section => (
                        <div key={section.id} className="bg-white border rounded p-4">
                          <div className="flex justify-between mb-2">
                            <span className="font-semibold text-blue-600">Section {section.section_order}: {section.title}</span>
                          </div>
                          {section.content && (
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 mb-2 max-h-32 overflow-hidden">
                              {section.content.substring(0, 150)}...
                            </div>
                          )}
                          {section.audio_url && (
                            <div className="text-xs text-gray-500 mb-2 font-mono">Audio: {section.audio_url}</div>
                          )}
                        </div>
                      ))}

                      {/* Questions */}
                      <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                        {moduleQuestions.map(q => (
                          <div key={q.id} className="text-sm flex justify-between group">
                            <span className="text-gray-700">Q{q.question_number}. {q.question_text.substring(0, 60)}...</span>
                            <span className="text-gray-400 group-hover:text-blue-600 cursor-pointer">Edit</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {(!exam.sections || exam.sections.length === 0) && (!exam.questions || exam.questions.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  No content added. Start by adding a section (e.g., Reading Passage).
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-0">
             {/* Log table existing code */}
             <div className="p-8 text-center text-gray-500">Logs will appear here</div>
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Exam Section</h2>
            <form onSubmit={handleCreateSection} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                  <select
                    className="w-full p-2 border rounded outline-none"
                    value={sectionData.module_type}
                    onChange={(e) => setSectionData({ ...sectionData, module_type: e.target.value })}
                  >
                    <option value="reading">Reading</option>
                    <option value="listening">Listening</option>
                    <option value="writing">Writing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded outline-none"
                    value={sectionData.section_order}
                    onChange={(e) => setSectionData({ ...sectionData, section_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  className="w-full p-2 border rounded outline-none"
                  placeholder="e.g., Passage 1: The History of Tea"
                  value={sectionData.title}
                  onChange={(e) => setSectionData({ ...sectionData, title: e.target.value })}
                  required
                />
              </div>

              {sectionData.module_type === 'reading' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passage Content</label>
                  <textarea
                    className="w-full p-2 border rounded outline-none h-40"
                    value={sectionData.content}
                    onChange={(e) => setSectionData({ ...sectionData, content: e.target.value })}
                  />
                </div>
              )}

              {sectionData.module_type === 'writing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Prompt</label>
                  <textarea
                    className="w-full p-2 border rounded outline-none h-40"
                    value={sectionData.content}
                    onChange={(e) => setSectionData({ ...sectionData, content: e.target.value })}
                  />
                </div>
              )}

              {sectionData.module_type === 'listening' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audio URL</label>
                  <input
                    className="w-full p-2 border rounded outline-none"
                    placeholder="https://..."
                    value={sectionData.audio_url}
                    onChange={(e) => setSectionData({ ...sectionData, audio_url: e.target.value })}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Question</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              {/* Question Form Fields (Simplified) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                <select
                  className="w-full p-2 border rounded outline-none"
                  value={questionData.module_type}
                  onChange={(e) => setQuestionData({ ...questionData, module_type: e.target.value })}
                >
                  <option value="reading">Reading</option>
                  <option value="listening">Listening</option>
                  <option value="writing">Writing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea
                  className="w-full p-2 border rounded outline-none"
                  value={questionData.question_text}
                  onChange={(e) => setQuestionData({ ...questionData, question_text: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Q No.</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded outline-none"
                    value={questionData.question_number}
                    onChange={(e) => setQuestionData({ ...questionData, question_number: parseInt(e.target.value) })}
                  />
                 </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                  <input
                    className="w-full p-2 border rounded outline-none"
                    value={questionData.correct_answer}
                    onChange={(e) => setQuestionData({ ...questionData, correct_answer: e.target.value })}
                  />
                 </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
