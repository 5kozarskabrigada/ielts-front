import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { apiListExams, apiCreateExam, apiDeleteExam, apiUpdateExamStatus, apiRegenerateExamCode } from "../../api";
import { Plus, Clock, FileText, Upload, PenTool, Trash2, AlertCircle, CheckCircle, Play, Pause, Copy, RefreshCw, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal/Modal";

export default function ExamsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Activation Modal
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [examToActivate, setExamToActivate] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

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

  const handleDeleteClick = (e, exam) => {
    e.stopPropagation();
    setExamToDelete(exam);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!examToDelete) return;
    
    try {
      await apiDeleteExam(token, examToDelete.id);
      setShowDeleteModal(false);
      setExamToDelete(null);
      fetchExams();
      setSuccessMessage("Exam moved to recycle bin successfully");
      setShowSuccessModal(true);
    } catch (err) {
      setShowDeleteModal(false);
      setErrorMessage(err.message || "Failed to delete exam");
      setShowErrorModal(true);
    }
  };

  const handleActivateClick = async (e, exam) => {
    e.stopPropagation();
    
    if (exam.status === 'active') {
      // Deactivate
      try {
        await apiUpdateExamStatus(token, exam.id, { status: 'draft' });
        fetchExams();
        setSuccessMessage("Exam deactivated successfully");
        setShowSuccessModal(true);
      } catch (err) {
        setErrorMessage(err.message || "Failed to deactivate exam");
        setShowErrorModal(true);
      }
    } else {
      // Activate - show modal with code
      try {
        const updated = await apiUpdateExamStatus(token, exam.id, { status: 'active' });
        setExamToActivate(updated);
        setShowActivateModal(true);
        setCodeCopied(false);
        fetchExams();
      } catch (err) {
        setErrorMessage(err.message || "Failed to activate exam");
        setShowErrorModal(true);
      }
    }
  };

  const handleRegenerateCode = async () => {
    if (!examToActivate) return;
    try {
      const updated = await apiRegenerateExamCode(token, examToActivate.id);
      setExamToActivate(updated.exam);
      setCodeCopied(false);
      fetchExams();
    } catch (err) {
      setErrorMessage(err.message || "Failed to regenerate code");
      setShowErrorModal(true);
    }
  };

  const copyAccessCode = async () => {
    if (!examToActivate?.access_code) return;
    try {
      await navigator.clipboard.writeText(examToActivate.access_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = examToActivate.access_code;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleShowCode = (e, exam) => {
    e.stopPropagation();
    setExamToActivate(exam);
    setShowActivateModal(true);
    setCodeCopied(false);
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
            <span>Create Exam</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500">Loading exams...</p>
        ) : exams.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No exams found. Create your first exam to get started.</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div 
              key={exam.id} 
              onClick={() => navigate(`/admin/exams/editor/${exam.id}`)}
              className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer group relative"
            >
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => handleActivateClick(e, exam)}
                  className={`p-2 rounded-full transition ${
                    exam.status === 'active' 
                      ? 'text-yellow-600 hover:bg-yellow-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={exam.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {exam.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button 
                  onClick={(e) => handleDeleteClick(e, exam)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex justify-between items-start mb-4 pr-16">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">{exam.title}</h3>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
                  exam.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {exam.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{exam.description || "No description provided."}</p>
              
              {/* Access Code Display for Active Exams */}
              {exam.status === 'active' && exam.access_code && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Key size={14} className="text-green-600" />
                      <span className="text-xs font-medium text-green-700">Access Code:</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-green-800 text-lg tracking-wider">{exam.access_code}</span>
                      <button
                        onClick={(e) => handleShowCode(e, exam)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="View & Copy"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
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

      {/* Activation Modal with Access Code */}
      <Modal
        isOpen={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        title="Exam Activated"
      >
        {examToActivate && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{examToActivate.title}</h3>
              <p className="text-sm text-gray-500">Exam is now active and ready for students</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-center text-sm font-medium text-gray-500 mb-3">Student Access Code</p>
              <div className="flex items-center justify-center space-x-4">
                <span className="font-mono text-4xl font-bold text-gray-900 tracking-[0.3em] select-all">
                  {examToActivate.access_code}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={copyAccessCode}
                className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition ${
                  codeCopied 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {codeCopied ? (
                  <>
                    <CheckCircle size={18} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
              <button
                onClick={handleRegenerateCode}
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center space-x-2"
                title="Generate new code"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <p className="text-xs text-center text-gray-400">
              Share this code with students to allow them to access the exam
            </p>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Exam"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle size={24} />
            <p className="font-medium">Warning: This action will move the exam to the recycle bin.</p>
          </div>
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{examToDelete?.title}</strong>?
            You can restore it later from the Recycle Bin.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
            >
              Delete Exam
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Operation Successful</h3>
          <p className="mt-2 text-sm text-gray-500">{successMessage}</p>
          <div className="mt-6">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Operation Failed</h3>
          <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
          <div className="mt-6">
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
