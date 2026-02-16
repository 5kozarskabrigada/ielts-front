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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Exams</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">No active exams available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{exam.title}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2 h-10">{exam.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1.5" />
                      <span>{exam.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1.5" />
                      <span>{new Date(exam.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/student/exam/${exam.id}`)}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <PlayCircle size={18} />
                    <span>Start Exam</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
