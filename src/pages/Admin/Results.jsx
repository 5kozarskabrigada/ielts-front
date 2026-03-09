import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { 
  apiListExams, 
  apiGetSubmissionsForGrading, 
  apiGetSubmissionDetail,
  apiOverrideAnswerGrade,
  apiOverrideWritingGrade,
  apiExportResultsCSV,
  apiGradeWritingWithAI
} from "../../api";
import { 
  Search, Download, Eye, ChevronDown, ChevronUp, Check, X, 
  AlertCircle, Edit2, Save, RefreshCw, User, Calendar, Clock,
  FileText, Headphones, BookOpen, PenTool, Sparkles
} from "lucide-react";

// Submission Detail Modal
function SubmissionDetailModal({ submissionId, token, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [editingAnswers, setEditingAnswers] = useState({});
  const [savingAnswer, setSavingAnswer] = useState(null);
  const [activeTab, setActiveTab] = useState('listening');

  useEffect(() => {
    loadDetail();
  }, [submissionId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const result = await apiGetSubmissionDetail(token, submissionId);
      console.log('📊 Submission Detail Data:', result);
      console.log('📝 Answers Count:', result?.answers?.length);
      console.log('📋 First Answer Sample:', result?.answers?.[0]);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideAnswer = async (answerId) => {
    const edit = editingAnswers[answerId];
    if (!edit) return;

    setSavingAnswer(answerId);
    try {
      await apiOverrideAnswerGrade(token, answerId, {
        is_correct: edit.is_correct,
        score: edit.score,
        notes: edit.notes
      });
      // Reload data
      await loadDetail();
      setEditingAnswers(prev => {
        const next = { ...prev };
        delete next[answerId];
        return next;
      });
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSavingAnswer(null);
    }
  };

  const startEditing = (answer) => {
    setEditingAnswers(prev => ({
      ...prev,
      [answer.id]: {
        is_correct: answer.admin_override_correct ?? answer.is_correct,
        score: answer.admin_override_score ?? answer.score,
        notes: answer.admin_notes || ""
      }
    }));
  };

  const cancelEditing = (answerId) => {
    setEditingAnswers(prev => {
      const next = { ...prev };
      delete next[answerId];
      return next;
    });
  };

  // Group answers by module
  const groupedAnswers = data?.answers?.reduce((acc, ans) => {
    const module = ans.questions?.exam_sections?.module_type || 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(ans);
    return acc;
  }, {}) || {};

  console.log('🗂️ Grouped Answers:', groupedAnswers);
  console.log('🎯 Active Tab:', activeTab);
  console.log('📊 Answers for Active Tab:', groupedAnswers[activeTab]?.length || 0);

  const moduleIcons = {
    listening: Headphones,
    reading: BookOpen,
    writing: PenTool
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-3 text-gray-600">Loading submission details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {data?.submission?.users?.name || "Student"}'s Submission
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {data?.submission?.users?.email} • Submitted {data?.submission?.submitted_at ? new Date(data.submission.submitted_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition">
              <X size={20} />
            </button>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-5 gap-3">
            {/* Overall Score */}
            <div className="bg-white rounded-lg p-3 border-2 border-blue-500">
              <div className="text-2xl font-bold text-blue-600">
                {data?.submission?.overall_band_score?.toFixed(1) || '-'}
              </div>
              <div className="text-xs text-gray-600 font-medium mt-1">Overall Band</div>
              <div className="text-xs text-gray-500 mt-1">
                {data?.submission?.total_correct || 0} / {data?.submission?.total_questions || 0} correct
              </div>
            </div>

            {/* Module Scores */}
            {['listening', 'reading', 'writing'].map(module => {
              const moduleScore = data?.submission?.scores_by_module?.[module];
              const Icon = moduleIcons[module];
              const answersCount = groupedAnswers[module]?.length || 0;
              const correctCount = groupedAnswers[module]?.filter(a => a.is_correct).length || 0;
              
              return (
                <div key={module} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center justify-between mb-1">
                    <Icon size={16} className="text-gray-600" />
                    <div className="text-lg font-bold text-gray-900">
                      {moduleScore?.toFixed(1) || '-'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 font-medium capitalize">{module}</div>
                  {module !== 'writing' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {correctCount} / {answersCount}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Time Spent */}
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center justify-between mb-1">
                <Clock size={16} className="text-gray-600" />
                <div className="text-lg font-bold text-gray-900">
                  {data?.submission?.time_spent ? Math.floor(data.submission.time_spent / 60) : '-'}
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium">Minutes</div>
              <div className="text-xs text-gray-500 mt-1">Total Time</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {['listening', 'reading', 'writing'].map(tab => {
            const Icon = moduleIcons[tab];
            const count = groupedAnswers[tab]?.length || 0;
            const writingCount = tab === 'writing' ? (data?.writingResponses?.length || 0) : count;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium text-sm transition ${
                  activeTab === tab 
                    ? 'bg-white border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span className="capitalize">{tab}</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {tab === 'writing' ? writingCount : count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Listening/Reading Answers */}
          {(activeTab === 'listening' || activeTab === 'reading') && (
            <div className="space-y-2">
              {(groupedAnswers[activeTab] || []).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No {activeTab} answers found for this submission.
                </div>
              ) : (
                (groupedAnswers[activeTab] || []).sort((a, b) => 
                  (a.questions?.question_number || 0) - (b.questions?.question_number || 0)
                ).map(answer => {
                  const isEditing = editingAnswers[answer.id];
                  const currentCorrect = isEditing?.is_correct ?? answer.admin_override_correct ?? answer.is_correct;
                  const hasOverride = answer.admin_override_correct !== null;

                  // Format user answer - handle different types
                  let userAnswerDisplay = '-';
                  if (answer.user_answer !== null && answer.user_answer !== undefined) {
                    if (typeof answer.user_answer === 'object') {
                      userAnswerDisplay = Array.isArray(answer.user_answer) 
                        ? answer.user_answer.join(', ') 
                        : JSON.stringify(answer.user_answer);
                    } else {
                      userAnswerDisplay = String(answer.user_answer);
                    }
                  }

                  return (
                    <div 
                      key={answer.id}
                      className={`border rounded-lg p-3 transition ${
                        currentCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Question Number & Status Icon */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                            currentCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {answer.questions?.question_number || '?'}
                          </div>
                        </div>

                        {/* Question Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-medium bg-gray-200 px-2 py-0.5 rounded">
                              {answer.questions?.question_type?.replace(/_/g, ' ').toUpperCase() || 'Question'}
                            </span>
                            {hasOverride && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                                ⚠️ Admin Override
                              </span>
                            )}
                            {currentCorrect ? (
                              <span className="text-xs text-green-700 font-medium">✓ Correct</span>
                            ) : (
                              <span className="text-xs text-red-700 font-medium">✗ Incorrect</span>
                            )}
                          </div>
                          
                          {answer.questions?.question_text && (
                            <p className="text-sm text-gray-800 mb-2 line-clamp-2">
                              {answer.questions.question_text}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className={`p-2 rounded ${currentCorrect ? 'bg-white' : 'bg-red-100'}`}>
                              <span className="text-gray-600 font-medium">Student Answer:</span>
                              <p className={`mt-1 font-semibold ${currentCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {userAnswerDisplay}
                              </p>
                            </div>
                            <div className="p-2 bg-green-100 rounded">
                              <span className="text-gray-600 font-medium">Correct Answer:</span>
                              <p className="mt-1 font-semibold text-green-700">
                                {answer.questions?.correct_answer || '-'}
                              </p>
                            </div>
                          </div>

                          {answer.admin_notes && (
                            <div className="mt-2 bg-amber-50 border border-amber-200 p-2 rounded text-xs">
                              <strong className="text-amber-800">Admin Note:</strong>
                              <span className="text-amber-700 ml-1">{answer.admin_notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-start gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => setEditingAnswers(prev => ({
                                  ...prev,
                                  [answer.id]: { ...prev[answer.id], is_correct: true }
                                }))}
                                className={`p-1.5 rounded ${
                                  isEditing.is_correct 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                                title="Mark Correct"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setEditingAnswers(prev => ({
                                  ...prev,
                                  [answer.id]: { ...prev[answer.id], is_correct: false }
                                }))}
                                className={`p-1.5 rounded ${
                                  !isEditing.is_correct 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                                title="Mark Incorrect"
                              >
                                <X size={16} />
                              </button>
                              <input
                                type="text"
                                placeholder="Add note..."
                                className="text-xs border rounded px-2 py-1 w-24"
                                value={isEditing.notes}
                                onChange={(e) => setEditingAnswers(prev => ({
                                  ...prev,
                                  [answer.id]: { ...prev[answer.id], notes: e.target.value }
                                }))}
                              />
                              <button
                                onClick={() => handleOverrideAnswer(answer.id)}
                                disabled={savingAnswer === answer.id}
                                className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                title="Save"
                              >
                                {savingAnswer === answer.id ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                              </button>
                              <button
                                onClick={() => cancelEditing(answer.id)}
                                className="p-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditing(answer)}
                              className="p-1.5 bg-white border rounded hover:bg-gray-50 text-gray-600"
                              title="Override grade"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Writing Responses */}
          {activeTab === 'writing' && (
            <div className="space-y-6">
              {(data?.writingResponses || []).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No writing responses found for this submission.
                </div>
              ) : (
                data.writingResponses.map(wr => (
                  <WritingResponseCard 
                    key={wr.id} 
                    response={wr} 
                    token={token}
                    onUpdate={loadDetail}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Writing Response Card Component
function WritingResponseCard({ response, token, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [overrideBand, setOverrideBand] = useState(response.admin_override_band || response.ai_overall_band || 5);
  const [feedback, setFeedback] = useState(response.admin_feedback || '');
  const [saving, setSaving] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);

  let aiFeedback = {};
  try {
    aiFeedback = response.ai_feedback ? JSON.parse(response.ai_feedback) : {};
  } catch { }

  const handleSaveOverride = async () => {
    setSaving(true);
    try {
      await apiOverrideWritingGrade(token, response.id, {
        override_band: parseFloat(overrideBand),
        feedback
      });
      await onUpdate();
      setIsEditing(false);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAIGrade = async () => {
    setAiGrading(true);
    try {
      await apiGradeWritingWithAI(token, {
        submissionId: response.submission_id,
        sectionId: response.section_id,
        taskNumber: response.task_number,
        responseText: response.response_text
      });
      await onUpdate();
    } catch (err) {
      alert("AI Grading failed: " + err.message);
    } finally {
      setAiGrading(false);
    }
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div 
        className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold">
            {response.task_number}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Writing Task {response.task_number}</h4>
            <p className="text-xs text-gray-500">{response.word_count} words</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xl font-bold text-purple-600">
              {response.final_band?.toFixed(1) || response.ai_overall_band?.toFixed(1) || '-'}
            </div>
            <div className="text-xs text-gray-500">
              {response.admin_override_band ? 'Admin Score' : response.ai_overall_band ? 'AI Score' : 'Not Graded'}
            </div>
          </div>
          {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* Response Text */}
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Student's Response</h5>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {response.response_text}
            </div>
          </div>

          {/* AI Scores */}
          {response.ai_overall_band && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                <Sparkles size={16} className="mr-2" /> AI Grading Results
              </h5>
              <div className="grid grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{response.ai_task_response_score?.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Task Response</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{response.ai_coherence_score?.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Coherence</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{response.ai_lexical_score?.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Lexical</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{response.ai_grammar_score?.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Grammar</div>
                </div>
              </div>
              {aiFeedback.feedback && (
                <div className="text-sm text-gray-700 bg-white p-3 rounded">
                  <strong>Feedback:</strong> {aiFeedback.feedback}
                </div>
              )}
              {aiFeedback.key_improvements?.length > 0 && (
                <div className="mt-2 text-sm">
                  <strong className="text-gray-700">Key Improvements:</strong>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    {aiFeedback.key_improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Admin Override Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium text-gray-700">Admin Grading</h5>
              <div className="flex space-x-2">
                {!response.ai_overall_band && (
                  <button
                    onClick={handleAIGrade}
                    disabled={aiGrading}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {aiGrading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>Grade with AI</span>
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
                >
                  <Edit2 size={14} />
                  <span>Override</span>
                </button>
              </div>
            </div>

            {isEditing && (
              <div className="bg-amber-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Override Band Score:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    value={overrideBand}
                    onChange={(e) => setOverrideBand(e.target.value)}
                    className="w-20 px-2 py-1 border rounded text-center"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Admin Feedback:</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full h-24 p-3 border rounded-lg text-sm"
                    placeholder="Add feedback for the student..."
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveOverride}
                    disabled={saving}
                    className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save Override</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {response.admin_override_band && !isEditing && (
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-800">
                    <strong>Admin Override:</strong> Band {response.admin_override_band}
                  </span>
                  <span className="text-xs text-gray-500">
                    {response.admin_graded_at ? new Date(response.admin_graded_at).toLocaleString() : ''}
                  </span>
                </div>
                {response.admin_feedback && (
                  <p className="text-sm text-gray-700 mt-2">{response.admin_feedback}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Results Page
export default function ResultsPage() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [selectedExam, statusFilter]);

  const loadData = async () => {
    try {
      const examList = await apiListExams(token);
      setExams(examList);
      await loadSubmissions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const params = {};
      if (selectedExam) params.examId = selectedExam;
      if (statusFilter) params.status = statusFilter;
      
      const result = await apiGetSubmissionsForGrading(token, params);
      setSubmissions(result.submissions || []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await apiExportResultsCSV(token, selectedExam);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exam_results.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sub.users?.name?.toLowerCase().includes(q) ||
      sub.users?.email?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status, writingStatus) => {
    if (status === 'submitted' || status === 'auto_submitted') {
      if (writingStatus === 'pending') {
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Needs Grading</span>;
      }
      if (writingStatus === 'ai_graded') {
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">AI Graded</span>;
      }
      if (writingStatus === 'admin_reviewed') {
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Reviewed</span>;
      }
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Completed</span>;
    }
    if (status === 'in_progress') {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">In Progress</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{status}</span>;
  };
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
        <div className="flex space-x-2">
          <button 
            onClick={loadSubmissions}
            className="bg-white border text-gray-700 px-4 py-2 rounded flex items-center space-x-2 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> <span>Refresh</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-white border text-gray-700 px-4 py-2 rounded flex items-center space-x-2 hover:bg-gray-50"
          >
            <Download size={16} /> <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center space-x-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex space-x-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input 
            className="w-full pl-10 pr-4 py-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="border rounded px-4 py-2 bg-white"
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
        >
          <option value="">All Exams</option>
          {exams.map(exam => (
            <option key={exam.id} value={exam.id}>{exam.title}</option>
          ))}
        </select>
        <select 
          className="border rounded px-4 py-2 bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="submitted">Completed</option>
          <option value="needs_grading">Needs Grading</option>
          <option value="in_progress">In Progress</option>
        </select>
      </div>

      {/* Results Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Student</th>
              <th className="p-4 font-medium text-gray-600">Exam</th>
              <th className="p-4 font-medium text-gray-600">Date</th>
              <th className="p-4 font-medium text-gray-600">Overall Band</th>
              <th className="p-4 font-medium text-gray-600">Correct</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                      <Search size={24} className="text-gray-400" />
                    </div>
                    <p>No results found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubmissions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{sub.users?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{sub.users?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900">{sub.exams?.title || "Exam"}</div>
                    <div className="text-xs text-gray-500 capitalize">{sub.exams?.type || "-"}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900">
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString() : ""}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-lg font-bold text-blue-600">
                      {sub.overall_band_score?.toFixed(1) || "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600">
                      {sub.total_correct || 0} / {sub.total_questions || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(sub.status, sub.writing_grading_status)}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedSubmission(sub.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      <Eye size={14} />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submissionId={selectedSubmission}
          token={token}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}
