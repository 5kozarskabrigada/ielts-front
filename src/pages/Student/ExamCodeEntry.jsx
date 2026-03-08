import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import { Key, AlertCircle, Loader } from "lucide-react";

export default function ExamCodeEntry() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleJoinExam = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!code.trim()) {
      setError("Please enter an exam code");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/exams/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.toUpperCase().trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify exam code");
      }

      // Navigate to exam player
      navigate(`/student/exam/${data.examId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Join Exam</h1>
            <p className="text-blue-100 text-sm">Enter your exam access code to begin</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleJoinExam} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Exam Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-2xl font-mono font-bold tracking-wider uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  maxLength={12}
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the code provided by your instructor
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Join Exam</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-amber-900 font-medium mb-2">Before you start:</p>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• Ensure stable internet connection</li>
                  <li>• Find a quiet environment</li>
                  <li>• Disable notifications</li>
                  <li>• Do not switch tabs during exam</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/student/dashboard")}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
