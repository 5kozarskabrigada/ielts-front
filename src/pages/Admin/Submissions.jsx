import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { FileText, User, Clock, CheckCircle, AlertCircle, Eye, Download, Filter } from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function SubmissionsPage() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      // Fetch all submissions
      const subsResponse = await fetch(`${API_URL}/monitoring/submissions/all`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const subsData = await subsResponse.json();

      // Fetch exams for filter
      const examsResponse = await fetch(`${API_URL}/exams`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const examsData = await examsResponse.json();

      setSubmissions(subsData.submissions || subsData);
      setExams(examsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const viewSubmissionDetails = async (submission) => {
    try {
      const response = await fetch(`${API_URL}/monitoring/submissions/${submission.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      setSelectedSubmission(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Failed to fetch submission details:", err);
    }
  };

  const filteredSubmissions = selectedExam === "all" 
    ? submissions 
    : submissions.filter(s => s.exam_id === selectedExam);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getBandColor = (band) => {
    if (band >= 7) return "text-green-600 bg-green-50";
    if (band >= 5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Submissions</h1>
          <p className="text-gray-600 mt-1">View and manage student exam submissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={18} />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{submissions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Band Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {submissions.length > 0 
                  ? (submissions.reduce((sum, s) => sum + (s.overall_band_score || 0), 0) / submissions.length).toFixed(1)
                  : "0.0"}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {submissions.filter(s => {
                  const date = new Date(s.submitted_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return date > weekAgo;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Exams</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {exams.filter(e => e.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-600" />
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Exams</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>{exam.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Exam</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Submitted</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Band Score</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Correct / Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No submissions found
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{submission.user_name || "Unknown"}</p>
                          <p className="text-sm text-gray-500">{submission.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{submission.exam_title}</p>
                      <p className="text-sm text-gray-500">{submission.exam_type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{formatDate(submission.submitted_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBandColor(submission.overall_band_score)}`}>
                        {submission.overall_band_score?.toFixed(1) || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {submission.total_correct} / {submission.total_questions}
                      </p>
                      <p className="text-xs text-gray-500">
                        {((submission.total_correct / submission.total_questions) * 100).toFixed(0)}%
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {submission.status || "Submitted"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => viewSubmissionDetails(submission)}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Submission Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{selectedSubmission.user_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedSubmission.user_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Submitted</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedSubmission.submitted_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Band Score</p>
                      <p className="font-bold text-xl text-blue-600">{selectedSubmission.overall_band_score?.toFixed(1)}</p>
                    </div>
                  </div>
                </div>

                {/* Time Spent */}
                {selectedSubmission.time_spent_by_module && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Time Spent by Module</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(selectedSubmission.time_spent_by_module).map(([module, seconds]) => (
                        <div key={module} className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-gray-600 text-sm capitalize">{module}</p>
                          <p className="font-bold text-2xl text-gray-900 mt-1">
                            {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answers Preview */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Answers Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      {selectedSubmission.total_correct} correct out of {selectedSubmission.total_questions} questions 
                      ({((selectedSubmission.total_correct / selectedSubmission.total_questions) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
