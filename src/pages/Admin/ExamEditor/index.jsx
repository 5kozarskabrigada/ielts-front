import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExamEditorProvider, useExamEditor } from "./ExamEditorContext";
import OverviewTab from "./tabs/OverviewTab";
import ListeningTab from "./tabs/ListeningTab";
import ReadingTab from "./tabs/ReadingTab";
import { useAuth } from "../../../authContext";
import { apiSaveExamStructure, apiCreateExam, apiUpdateExamStatus, apiDeleteExam, apiRegenerateExamCode, apiUpdateAccessCode, apiGetExamStats } from "../../../api";
import { Layout, Headphones, BookOpen, PenTool, Save, Trash2, AlertTriangle, CheckCircle, Play, Pause, Eye, Copy, RefreshCw, Edit2, Users, UserCheck, X, Key, Shield, ShieldAlert, Clock } from "lucide-react";
import Modal from "../../../components/Modal/Modal";

function ExamEditorContent() {
  const { exam, sections, questions, validate, validationErrors, isSaving, updateExam, updateIds, deletedQuestionIds, clearDeletedQuestionIds } = useExamEditor();
  const [activeTab, setActiveTab] = useState("overview");
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: "", content: "", type: "default" });
  const [codeCopied, setCodeCopied] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editedCode, setEditedCode] = useState("");
  const [examStats, setExamStats] = useState({ active_participants: 0, total_participants: 0, completed_count: 0 });
  const [isActivating, setIsActivating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchExamStats = useCallback(async () => {
    if (!id) return;
    try {
      const stats = await apiGetExamStats(token, id);
      setExamStats(stats);
    } catch (err) {
      console.error("Failed to fetch exam stats:", err);
    }
  }, [id, token]);

  useEffect(() => {
    fetchExamStats();
    // Refresh stats every 30 seconds when exam is active
    if (exam.status === 'active') {
      const interval = setInterval(fetchExamStats, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchExamStats, exam.status]);

  const showModal = (title, content, type = "default") => {
    setModalConfig({ title, content, type });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    let examId = id;
    let isNew = false;

    if (!examId) {
      try {
        const newExam = await apiCreateExam(token, {
          title: exam.title || "Untitled Exam",
          description: exam.description || "",
          duration_minutes: 180,
          modules_config: exam.modules_config
        });
        examId = newExam.id;
        isNew = true;
      } catch (err) {
        showModal("Creation Failed", "Failed to initialize exam record: " + err.message, "danger");
        return;
      }
    }
    
    const isValid = validate();
    if (!isValid) {
      if (!window.confirm("Exam has structural validation errors. Save as draft anyway?")) return;
    }

    try {
      const response = await apiSaveExamStructure(token, examId, { 
        exam, 
        sections, 
        questions,
        deletedQuestionIds
      });
      
      if (response.idMapping) {
        updateIds(response.idMapping);
      }
      
      clearDeletedQuestionIds();
      showModal("Success", "Exam saved successfully!", "success");
      if (isNew) {
        navigate(`/admin/exams/editor/${examId}`);
      }
    } catch (err) {
      showModal("Save Failed", "Failed to save exam structure: " + err.message, "danger");
    }
  };

  const handleActivate = async () => {
    if (!id) {
      showModal("Save First", "Please save the exam first before activating", "warning");
      return;
    }
    setIsActivating(true);
    try {
      const newStatus = exam.status === 'active' ? 'draft' : 'active';
      const updated = await apiUpdateExamStatus(token, id, { status: newStatus });
      updateExam({ status: updated.status, access_code: updated.access_code });
      fetchExamStats();
    } catch (err) {
      showModal("Error", "Failed to update status: " + err.message, "danger");
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await apiDeleteExam(token, id);
      navigate("/admin/exams");
    } catch (err) {
      showModal("Error", "Failed to delete exam: " + err.message, "danger");
    }
  };

  const handleRegenerateCode = async () => {
    if (!id) return;
    try {
      const result = await apiRegenerateExamCode(token, id);
      updateExam({ access_code: result.exam.access_code });
    } catch (err) {
      showModal("Error", "Failed to regenerate code: " + err.message, "danger");
    }
  };

  const handleSaveCode = async () => {
    if (!id || !editedCode) return;
    try {
      const result = await apiUpdateAccessCode(token, id, editedCode);
      updateExam({ access_code: result.exam.access_code });
      setIsEditingCode(false);
      setEditedCode("");
    } catch (err) {
      showModal("Error", err.message, "danger");
    }
  };

  const copyAccessCode = async () => {
    const code = exam.access_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = code;
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

  const handlePreviewAsStudent = () => {
    if (!id) {
      showModal("Save First", "Please save the exam first to preview", "warning");
      return;
    }
    // Open in new tab with admin preview mode
    window.open(`/student/exam/${id}?preview=admin`, '_blank');
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab />;
      case "listening": return <ListeningTab />;
      case "reading": return <ReadingTab />;
      case "writing": return <div className="p-8 text-center text-gray-500">Writing Editor (Coming Soon)</div>;
      default: return <OverviewTab />;
    }
  };

  const getStatusColor = () => {
    switch (exam.status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalConfig.title}
        type={modalConfig.type}
        actions={
          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 text-sm font-medium">
            Close
          </button>
        }
      >
        {modalConfig.content}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        title="Delete Exam"
        type="danger"
        actions={
          <div className="flex space-x-2">
            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 text-sm font-medium">
              Cancel
            </button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white text-sm font-medium">
              Delete
            </button>
          </div>
        }
      >
        Are you sure you want to delete this exam? It will be moved to the recycle bin.
      </Modal>

      {/* Editor Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="font-bold text-gray-900">Exam Creator</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold border ${getStatusColor()}`}>
            {exam.status}
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Layout size={18} /> <span>Overview</span>
          </button>
          <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Modules</div>
          <button
            onClick={() => setActiveTab("listening")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'listening' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Headphones size={18} /> <span>Listening</span>
          </button>
          <button
            onClick={() => setActiveTab("reading")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'reading' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BookOpen size={18} /> <span>Reading</span>
          </button>
          <button
            onClick={() => setActiveTab("writing")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'writing' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <PenTool size={18} /> <span>Writing</span>
          </button>
        </nav>

        {/* Validation Summary */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Integrity Check</span>
            {validationErrors.length === 0 ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <AlertTriangle size={16} className="text-red-500" />
            )}
          </div>
          <div className="text-xs text-gray-600">
            {validationErrors.length === 0 ? "Ready to publish" : `${validationErrors.length} issues found`}
          </div>
          {validationErrors.length > 0 && (
            <button onClick={validate} className="mt-2 text-xs text-blue-600 hover:underline">View Issues</button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Exam Name and Controls */}
        <div className="bg-white border-b shrink-0">
          <div className="h-16 flex items-center justify-between px-6">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <input
                type="text"
                value={exam.title || ""}
                onChange={(e) => updateExam({ title: e.target.value })}
                placeholder="Enter exam name..."
                className="text-lg font-bold text-gray-800 bg-transparent border-none outline-none flex-1 min-w-0 focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              />
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <button
                onClick={handlePreviewAsStudent}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                title="Preview as Student"
              >
                <Eye size={16} />
                <span>Preview</span>
              </button>
              <button
                onClick={() => id && setDeleteModalOpen(true)}
                disabled={!id}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Exam"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save size={16} /> <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>

          {/* Exam Control Panel */}
          <div className="px-6 pb-4">
            <div className={`p-4 rounded-xl border-2 ${
              exam.status === 'active' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex flex-wrap items-center gap-4">
                {/* Status & Activation */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleActivate}
                    disabled={isActivating || !id}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition ${
                      exam.status === 'active'
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {exam.status === 'active' ? (
                      <>
                        <Pause size={16} />
                        <span>{isActivating ? 'Ending...' : 'End Exam'}</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        <span>{isActivating ? 'Starting...' : 'Start Exam'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-300" />

                {/* Security Type */}
                <div className="flex items-center space-x-2 text-sm">
                  {exam.security_settings?.security_mode === 'disqualify' ? (
                    <>
                      <ShieldAlert size={16} className="text-red-600" />
                      <span className="text-gray-700">Auto-Disqualify</span>
                    </>
                  ) : (
                    <>
                      <Shield size={16} className="text-blue-600" />
                      <span className="text-gray-700">Log Only</span>
                    </>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-300" />

                {/* Participants */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-green-600">
                      <Users size={16} />
                      <span className="font-bold">{examStats.active_participants}</span>
                    </div>
                    <span className="text-gray-500">in exam</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-blue-600">
                      <UserCheck size={16} />
                      <span className="font-bold">{examStats.total_participants}</span>
                    </div>
                    <span className="text-gray-500">total joined</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-300" />

                {/* Access Code */}
                <div className="flex items-center space-x-2">
                  <Key size={16} className={exam.status === 'active' ? 'text-green-600' : 'text-gray-400'} />
                  {isEditingCode ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={editedCode}
                        onChange={(e) => setEditedCode(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        className="w-24 px-2 py-1 text-sm font-mono uppercase border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        maxLength={12}
                        autoFocus
                      />
                      <button onClick={handleSaveCode} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => { setIsEditingCode(false); setEditedCode(""); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`font-mono text-lg font-bold tracking-wider ${exam.status === 'active' ? 'text-green-700' : 'text-gray-400'}`}>
                        {exam.access_code || '------'}
                      </span>
                      {id && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={copyAccessCode}
                            className={`p-1 rounded transition ${
                              codeCopied 
                                ? 'bg-green-100 text-green-600' 
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title="Copy code"
                          >
                            {codeCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => { setIsEditingCode(true); setEditedCode(exam.access_code || ""); }}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            title="Edit code"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={handleRegenerateCode}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            title="Regenerate code"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {!id && (
                <p className="mt-3 text-sm text-yellow-600 bg-yellow-50 p-2 rounded-lg flex items-center space-x-2">
                  <AlertTriangle size={14} />
                  <span>Save the exam first to enable controls</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamEditor() {
  return (
    <ExamEditorProvider>
      <ExamEditorContent />
    </ExamEditorProvider>
  );
}
