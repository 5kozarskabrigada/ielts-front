import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { apiListExams } from "../../api";
import { PlayCircle, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await apiListExams(token);
        setExams(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">IELTS Practice Platform</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.first_name}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Dashboard</h2>
          <p className="text-gray-600">Enter your exam code to begin your test</p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center shadow-xl">
            <h3 className="text-2xl font-bold mb-4">Ready to Start Your Exam?</h3>
            <p className="text-blue-100 mb-6">Click below to enter your exam access code</p>
            <button
              onClick={() => navigate("/student/join")}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center space-x-2"
            >
              <PlayCircle size={20} />
              <span>Enter Exam Code</span>
            </button>
          </div>

          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border">
            <h4 className="font-semibold text-gray-800 mb-4">Exam Instructions:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span>Ensure you have a stable internet connection</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span>Find a quiet place to take your exam</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span>The exam will be in fullscreen mode - do not exit during the test</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span>Your answers will be automatically saved</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3"></span>
                <span>You cannot go back to previous modules after submission</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
