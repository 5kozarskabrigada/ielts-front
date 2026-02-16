import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { apiListExams, apiCreateExam, apiDeleteExam } from "../../api";
import { Plus, Clock, FileText, Upload, PenTool, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ExamsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await apiListExams(token);
      setExams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [token]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      try {
        await apiDeleteExam(token, id);
        fetchExams();
      } catch (err) {
        alert("Failed to delete exam: " + err.message);
      }
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-500 mt-1">Manage and create IELTS exams</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/admin/exams/editor")}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition shadow-sm"
          >
            <PenTool size={18} />
            <span>Open Exam Editor</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500">Loading exams...</p>
        ) : (
          exams.map((exam) => (
            <div 
              key={exam.id} 
              onClick={() => navigate(`/admin/exams/editor/${exam.id}`)}
              className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer group relative"
            >
              <button 
                onClick={(e) => handleDelete(e, exam.id)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex justify-between items-start mb-4 pr-8">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">{exam.title}</h3>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
                  exam.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {exam.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-6 line-clamp-2 h-10">{exam.description || "No description provided."}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                <div className="flex items-center space-x-1.5">
                  <Clock size={16} className="text-gray-400" />
                  <span className="font-medium">{exam.duration_minutes}m</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded border ${
                    exam.security_level === 'strict' 
                      ? 'bg-red-50 text-red-700 border-red-100' 
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {exam.security_level || 'standard'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
