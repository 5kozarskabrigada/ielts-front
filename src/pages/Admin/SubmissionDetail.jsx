import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import { ArrowLeft, User, Clock, AlertCircle, CheckCircle, XCircle, FileText, PenTool, Star, Save, Loader2 } from "lucide-react";
import { apiOverrideWritingGrade, apiGradeWritingWithAI } from "../../api";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [writingOverrides, setWritingOverrides] = useState({});
  const [savingOverride, setSavingOverride] = useState(null);
  const [gradingAI, setGradingAI] = useState(null);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [id]);

  const fetchSubmissionDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/monitoring/submissions/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submission: ${response.status}`);
      }
      
      const data = await response.json();
      setSubmission(data);
    } catch (err) {
      console.error("Failed to fetch submission details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSaveOverride = async (responseId) => {
    const override = writingOverrides[responseId];
    if (!override?.band) return;
    setSavingOverride(responseId);
    try {
      await apiOverrideWritingGrade(token, responseId, {
        override_band: parseFloat(override.band),
        feedback: override.feedback || ''
      });
      await fetchSubmissionDetails();
      setWritingOverrides(prev => ({ ...prev, [responseId]: undefined }));
    } catch (err) {
      alert('Failed to save override: ' + err.message);
    } finally {
      setSavingOverride(null);
    }
  };

  const handleAIGrade = async (wr) => {
    setGradingAI(wr.id);
    try {
      await apiGradeWritingWithAI(token, {
        submissionId: submission.id,
        sectionId: wr.section_id,
        taskNumber: wr.task_number,
        responseText: wr.response_text,
        taskType: wr.task_number === 1 ? 'Academic Report' : 'Essay',
        taskPrompt: ''
      });
      await fetchSubmissionDetails();
    } catch (err) {
      alert('AI grading failed: ' + err.message);
    } finally {
      setGradingAI(null);
    }
  };

  const getBandColor = (band) => {
    if (band >= 7) return "text-green-600 bg-green-50 border-green-200";
    if (band >= 5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load submission details: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate(-1)} 
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700 transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Submissions
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Submission Details</h1>
        <p className="text-gray-600 mt-1">Detailed view of exam submission</p>
      </div>

      {/* Student Info Card */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{submission.user_name || 'Unknown Student'}</h2>
              <p className="text-gray-600">{submission.user_email}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="font-semibold text-gray-900">{formatDate(submission.submitted_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Exam</p>
            <p className="font-semibold text-gray-900">{submission.exam_title || 'Unknown Exam'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Time Spent</p>
            <p className="font-semibold text-gray-900">
              {submission.time_spent ? formatDuration(submission.time_spent) : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              {submission.status || 'Submitted'}
            </span>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Overall Score</h3>
        <div className="flex items-center justify-center">
          <div className={`text-center px-8 py-6 rounded-xl border-2 ${getBandColor(submission.band_score)}`}>
            <p className="text-sm font-semibold uppercase mb-2">Band Score</p>
            <p className="text-6xl font-bold">{submission.band_score?.toFixed(1) || 'N/A'}</p>
            <p className="text-sm mt-2">
              {submission.total_correct || 0} / {submission.total_questions || 0} correct
            </p>
          </div>
        </div>
      </div>

      {/* Module-Wise Scores */}
      {(submission.scores_by_module || submission.answers_by_module) && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Module-Wise Band Scores</h3>
          <div className="grid grid-cols-3 gap-4">
            {['listening', 'reading', 'writing'].map(module => {
              const score = submission.scores_by_module?.[module] ?? 0;
              const moduleAnswers = submission.answers_by_module?.[module];
              const correct = moduleAnswers?.correct || 0;
              const total = correct + (moduleAnswers?.wrong || 0);
              return (
                <div key={module} className={`rounded-xl border-2 p-6 text-center ${getBandColor(score)}`}>
                  <p className="text-sm font-semibold uppercase tracking-wide mb-2">{module}</p>
                  <p className="text-5xl font-bold">{score.toFixed(1)}</p>
                  <p className="text-sm mt-2">
                    {correct} / {total} correct
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Answers by Module */}
      {submission.answers_by_module && (
        <div className="space-y-6">
          {['listening', 'reading'].map(module => {
            const moduleData = submission.answers_by_module[module];
            if (!moduleData || moduleData.answers.length === 0) return null;

            // Group answers by section
            const answersBySection = {};
            moduleData.answers.forEach(ans => {
              const sectionKey = ans.section_title || 'Unknown Section';
              if (!answersBySection[sectionKey]) {
                answersBySection[sectionKey] = { order: ans.section_order, answers: [] };
              }
              answersBySection[sectionKey].answers.push(ans);
            });

            // Sort sections by order
            const sortedSections = Object.entries(answersBySection)
              .sort(([, a], [, b]) => a.order - b.order);

            return (
              <div key={module} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 capitalize flex items-center space-x-2">
                      <FileText size={24} />
                      <span>{module} Module</span>
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle size={20} className="text-green-600" />
                        <span className="text-green-600 font-semibold">{moduleData.correct} Correct</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <XCircle size={20} className="text-red-600" />
                        <span className="text-red-600 font-semibold">{moduleData.wrong} Wrong</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {sortedSections.map(([sectionTitle, sectionData], sIdx) => (
                  <div key={sIdx}>
                    <div className="px-6 py-2 bg-blue-50 border-b border-blue-100">
                      <span className="text-sm font-semibold text-blue-800">
                        Part {sIdx + 1}: {sectionTitle}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {sectionData.answers
                        .sort((a, b) => a.question_number - b.question_number)
                        .map((ans, idx) => {
                          const formatAnswer = (val) => {
                            if (val === null || val === undefined || val === '') return null;
                            if (typeof val === 'object') {
                              return Array.isArray(val) ? val.join(', ') : JSON.stringify(val);
                            }
                            return String(val);
                          };
                          
                          const userAnswer = formatAnswer(ans.user_answer);
                          const correctAnswer = formatAnswer(ans.correct_answer);
                          
                          return (
                            <div 
                              key={idx}
                              className={`px-6 py-3 flex items-center gap-4 ${
                                !userAnswer ? 'bg-gray-50' : ans.is_correct ? 'bg-green-50/40' : 'bg-red-50/40'
                              }`}
                            >
                              {/* Question Number */}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                !userAnswer ? 'bg-gray-300 text-white' : ans.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {ans.question_number}
                              </div>
                              
                              {/* Question Text */}
                              <div className="flex-1 min-w-0">
                                {ans.question_text && (
                                  <p className="text-sm text-gray-700 truncate">{ans.question_text}</p>
                                )}
                                <span className="text-xs text-gray-400">{ans.question_type?.replace(/_/g, ' ')}</span>
                              </div>
                              
                              {/* Student Answer */}
                              <div className="w-40 text-sm">
                                <span className="text-xs text-gray-500 block">Student:</span>
                                {userAnswer ? (
                                  <span className={`font-semibold ${ans.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                                    {userAnswer}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Skipped</span>
                                )}
                              </div>
                              
                              {/* Correct Answer */}
                              <div className="w-40 text-sm">
                                <span className="text-xs text-gray-500 block">Correct:</span>
                                <span className="font-semibold text-green-700">{correctAnswer || '-'}</span>
                              </div>
                              
                              {/* Status Badge */}
                              <div className="w-24 flex-shrink-0 text-center">
                                {!userAnswer ? (
                                  <span className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                                    Skipped
                                  </span>
                                ) : ans.is_correct ? (
                                  <span className="inline-flex items-center px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                                    <CheckCircle size={12} className="mr-1" />
                                    Correct
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-semibold">
                                    <XCircle size={12} className="mr-1" />
                                    Wrong
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Writing Module Section */}
      {(() => {
        const writingResponses = submission.writing_responses || [];
        if (writingResponses.length === 0) return null;

        return (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <PenTool size={24} />
                <span>Writing Module</span>
              </h3>
            </div>

            {writingResponses.map((wr, idx) => {
              const essayText = wr.response_text || '';
              const wordCount = wr.word_count || (essayText.trim() ? essayText.trim().split(/\s+/).length : 0);
              const aiFeedback = (() => {
                if (!wr.ai_feedback) return null;
                try { return typeof wr.ai_feedback === 'string' ? JSON.parse(wr.ai_feedback) : wr.ai_feedback; }
                catch { return null; }
              })();
              const override = writingOverrides[wr.id] || {};
              const finalBand = wr.admin_override_band || wr.final_band || wr.ai_overall_band;
              const isRawFallback = String(wr.id).startsWith('raw-');

              return (
                <div key={wr.id} className="border-b last:border-b-0">
                  <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-800">
                      Task {wr.task_number}: {wr.section_title || `Writing Task ${wr.task_number}`}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">{wordCount} words</span>
                      {finalBand != null && (
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          finalBand >= 7 ? 'bg-green-100 text-green-700' :
                          finalBand >= 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Band {typeof finalBand === 'number' ? finalBand.toFixed(1) : finalBand}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Student Essay */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Student's Response</h4>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border">
                        {essayText || <span className="text-gray-400 italic">No response submitted</span>}
                      </div>
                    </div>

                    {/* AI Grading */}
                    {wr.ai_overall_band != null ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                          <Star size={16} className="text-amber-500" />
                          <span>AI Grading</span>
                        </h4>
                        <div className="grid grid-cols-5 gap-3 mb-4">
                          {[
                            { label: 'Task Response', score: wr.ai_task_response_score },
                            { label: 'Coherence', score: wr.ai_coherence_score },
                            { label: 'Lexical', score: wr.ai_lexical_score },
                            { label: 'Grammar', score: wr.ai_grammar_score },
                            { label: 'Overall', score: wr.ai_overall_band },
                          ].map(({ label, score }) => (
                            <div key={label} className={`rounded-lg p-3 text-center border ${
                              score >= 7 ? 'bg-green-50 border-green-200' :
                              score >= 5 ? 'bg-yellow-50 border-yellow-200' :
                              'bg-red-50 border-red-200'
                            }`}>
                              <p className="text-xs text-gray-500 mb-1">{label}</p>
                              <p className="text-xl font-bold">{score?.toFixed(1)}</p>
                            </div>
                          ))}
                        </div>

                        {aiFeedback?.feedback && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                            <p className="text-sm font-semibold text-blue-800 mb-2">AI Feedback</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiFeedback.feedback}</p>
                          </div>
                        )}

                        {aiFeedback?.key_improvements?.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-amber-800 mb-2">Key Improvements</p>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {aiFeedback.key_improvements.map((imp, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-amber-600 mr-2">•</span>
                                  {imp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border">
                        <p className="text-sm text-gray-500">No AI grading yet</p>
                        {essayText && (
                          <button
                            onClick={() => handleAIGrade({ id: wr.id, section_id: wr.section_id, task_number: wr.task_number, response_text: essayText })}
                            disabled={gradingAI === wr.id}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                          >
                            {gradingAI === wr.id ? (
                              <><Loader2 size={16} className="animate-spin" /><span>Grading...</span></>
                            ) : (
                              <><Star size={16} /><span>Grade with AI</span></>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Admin Override */}
                    {!isRawFallback && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Admin Grade Override</h4>
                        {wr.admin_override_band != null && !override.editing ? (
                          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <div>
                              <p className="text-sm text-indigo-800">
                                <span className="font-semibold">Override Band: {wr.admin_override_band.toFixed(1)}</span>
                                {wr.admin_graded_at && (
                                  <span className="text-xs text-indigo-500 ml-2">
                                    (set {new Date(wr.admin_graded_at).toLocaleDateString()})
                                  </span>
                                )}
                              </p>
                              {wr.admin_feedback && (
                                <p className="text-sm text-gray-600 mt-1">{wr.admin_feedback}</p>
                              )}
                            </div>
                            <button
                              onClick={() => setWritingOverrides(prev => ({ ...prev, [wr.id]: { band: wr.admin_override_band, feedback: wr.admin_feedback || '', editing: true } }))}
                              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-end gap-3">
                            <div className="flex-shrink-0">
                              <label className="text-xs text-gray-500 block mb-1">Band Score</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="9"
                                value={override.band ?? ''}
                                onChange={(e) => setWritingOverrides(prev => ({ ...prev, [wr.id]: { ...prev[wr.id], band: e.target.value } }))}
                                className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center"
                                placeholder="0-9"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 block mb-1">Feedback (optional)</label>
                              <input
                                type="text"
                                value={override.feedback ?? ''}
                                onChange={(e) => setWritingOverrides(prev => ({ ...prev, [wr.id]: { ...prev[wr.id], feedback: e.target.value } }))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                placeholder="Admin feedback..."
                              />
                            </div>
                            <button
                              onClick={() => handleSaveOverride(wr.id)}
                              disabled={!override.band || savingOverride === wr.id}
                              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex-shrink-0"
                            >
                              {savingOverride === wr.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Save size={16} />
                              )}
                              <span>Save</span>
                            </button>
                            {override.editing && (
                              <button
                                onClick={() => setWritingOverrides(prev => ({ ...prev, [wr.id]: undefined }))}
                                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
