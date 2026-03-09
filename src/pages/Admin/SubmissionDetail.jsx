import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import { ArrowLeft, User, Clock, AlertCircle, CheckCircle, XCircle, FileText } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          {['listening', 'reading', 'writing'].map(module => {
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
    </div>
  );
}
