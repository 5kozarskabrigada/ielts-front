import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { FileText, User, Clock, CheckCircle, AlertCircle, Eye, Download, Filter } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function SubmissionsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState("all");

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      // Fetch all submissions
      const subsResponse = await fetch(`${API_URL}/monitoring/submissions/all`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!subsResponse.ok) {
        const errorText = await subsResponse.text();
        console.error("Submissions API error:", subsResponse.status, errorText);
        throw new Error(`API returned ${subsResponse.status}: ${errorText}`);
      }
      
      const subsData = await subsResponse.json();

      // Fetch exams for filter
      const examsResponse = await fetch(`${API_URL}/exams`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const examsData = await examsResponse.json();

      setSubmissions(subsData.submissions || subsData || []);
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      // Show detailed error for debugging
      const errorMsg = `Failed to load submissions: ${err.message}\n\nPossible causes:\n1. Database tables not created (run APPLY_MONITORING_TABLES.sql)\n2. RLS policies blocking access (run FIX_MONITORING_RLS_POLICIES.sql)\n3. Backend server not responding\n\nCheck browser console for details.`;
      alert(errorMsg);
      setSubmissions([]);
      setExams([]);
    } finally {
      setLoading(false);
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
                  ? (submissions.reduce((sum, s) => sum + (s.band_score || 0), 0) / submissions.length).toFixed(1)
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
            {Array.isArray(exams) && exams.map(exam => (
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
                      <p className="font-medium text-gray-900">{submission.exam_title || 'Unknown Exam'}</p>
                      <p className="text-sm text-gray-500">Mock Test</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{formatDate(submission.submitted_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBandColor(submission.band_score)}`}>
                        {submission.band_score?.toFixed(1) || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {Object.keys(submission.answers || {}).length} answers
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {submission.status || "Submitted"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => navigate(`/admin/submissions/${submission.id}`)}
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
    </div>
  );
}
