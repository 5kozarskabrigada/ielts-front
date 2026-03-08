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
      {submission.scores_by_module && Object.keys(submission.scores_by_module).length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Module-Wise Band Scores</h3>
          <div className="grid grid-cols-3 gap-4">
            {['listening', 'reading', 'writing'].map(module => {
              const score = submission.scores_by_module[module];
              if (score === undefined) return null;
              return (
                <div key={module} className={`rounded-xl border-2 p-6 text-center ${getBandColor(score)}`}>
                  <p className="text-sm font-semibold uppercase tracking-wide mb-2">{module}</p>
                  <p className="text-5xl font-bold">{score.toFixed(1)}</p>
                  {submission.answers_by_module?.[module] && (
                    <p className="text-sm mt-2">
                      {submission.answers_by_module[module].correct} / 
                      {submission.answers_by_module[module].correct + submission.answers_by_module[module].wrong} correct
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Violations */}
      {submission.violations && submission.violations.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle size={24} className="text-red-600" />
            <h3 className="text-xl font-bold text-red-900">
              Violations ({submission.violations.length})
            </h3>
          </div>
          <div className="space-y-3">
            {submission.violations.map((violation, idx) => (
              <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 capitalize mb-1">
                      {violation.violation_type?.replace(/_/g, ' ')}
                    </p>
                    {violation.metadata && typeof violation.metadata === 'object' && Object.keys(violation.metadata).length > 0 && (
                      <div className="text-sm text-red-700 mt-1">
                        {Object.entries(violation.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 ml-4 whitespace-nowrap">
                    {new Date(violation.occurred_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Answers by Module */}
      {submission.answers_by_module && (
        <div className="space-y-6">
          {['listening', 'reading', 'writing'].map(module => {
            const moduleData = submission.answers_by_module[module];
            if (!moduleData || moduleData.answers.length === 0) return null;

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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Q#</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Section</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Your Answer</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Correct Answer</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {moduleData.answers.map((ans, idx) => (
                        <tr 
                          key={idx} 
                          className={ans.is_correct ? 'bg-green-50/30' : !ans.user_answer ? 'bg-gray-50' : 'bg-red-50/30'}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{ans.question_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{ans.section_title}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {ans.user_answer ? (
                              ans.user_answer
                            ) : (
                              <span className="text-gray-400 italic">Skipped</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{ans.correct_answer}</td>
                          <td className="px-6 py-4 text-center">
                            {!ans.user_answer ? (
                              <span className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                                Skipped
                              </span>
                            ) : ans.is_correct ? (
                              <span className="inline-flex items-center px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                                <CheckCircle size={14} className="mr-1" />
                                Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs font-semibold">
                                <XCircle size={14} className="mr-1" />
                                Wrong
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
