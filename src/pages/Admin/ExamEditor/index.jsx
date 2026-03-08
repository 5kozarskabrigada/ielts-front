import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExamEditorProvider, useExamEditor } from "./ExamEditorContext";
import OverviewTab from "./tabs/OverviewTab";
import ListeningTab from "./tabs/ListeningTab";
import ReadingTab from "./tabs/ReadingTab";
import WritingTab from "./tabs/WritingTab";
import { useAuth } from "../../../authContext";
import { apiSaveExamStructure, apiCreateExam, apiUpdateExamStatus, apiDeleteExam, apiGetExamStats, apiGetExam } from "../../../api";
import { Layout, Headphones, BookOpen, PenTool, Save, Trash2, AlertTriangle, CheckCircle, Play, Pause, Eye, Copy, RefreshCw, Edit2, Users, UserCheck, X, Key, Shield, ShieldAlert, ArrowLeft } from "lucide-react";
import Modal from "../../../components/Modal/Modal";

// Generate 6 character alphanumeric code
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

function ExamEditorContent() {
  const { exam, sections, questions, questionGroups, validate, validationErrors, isSaving, updateExam, updateIds, deletedQuestionIds, clearDeletedQuestionIds, deletedGroupIds, clearDeletedGroupIds, clearTempCode, setQuestions } = useExamEditor();
  const [activeTab, setActiveTab] = useState("overview");
  const [fullScreenModule, setFullScreenModule] = useState(null);
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
  const [justSaved, setJustSaved] = useState(false);

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
      // Generate questions from table_data groups (TableBuilder format)
      const allQuestions = [...questions];
      let questionsAdded = false;
      
      (questionGroups || []).forEach(group => {
        if (group.question_type === 'form_completion' && group.table_data?.answers) {
          const startNum = group.question_range_start || 1;
          Object.entries(group.table_data.answers).forEach(([blankIdx, answer]) => {
            const questionNumber = startNum + parseInt(blankIdx);
            // Split answer by / to separate main answer from alternatives
            const answerParts = answer ? answer.split('/').map(a => a.trim()).filter(Boolean) : [];
            const correctAnswer = answerParts[0] || '';
            const alternatives = answerParts.length > 1 ? answerParts.slice(1).join('/') : '';
            
            // Check if question already exists
            const existingIdx = allQuestions.findIndex(q => 
              q.section_id === group.section_id && q.question_number === questionNumber
            );
            const questionData = {
              section_id: group.section_id,
              question_number: questionNumber,
              question_type: 'form_completion',
              correct_answer: correctAnswer,
              answer_alternatives: alternatives || '',
              points: 1
            };
            if (existingIdx >= 0) {
              allQuestions[existingIdx] = { ...allQuestions[existingIdx], ...questionData };
            } else {
              allQuestions.push({ id: `temp_tableq_${Date.now()}_${questionNumber}_${Math.random().toString(36).substr(2, 9)}`, ...questionData });
              questionsAdded = true;
            }
          });
        }
      });

      // FIX: Ensure each question has correct section_id from its parent group
      // Use group_id if available, otherwise fall back to matching by question_type + range
      const listeningGroups = (questionGroups || []).filter(g => g.question_type);
      
      const correctedQuestions = allQuestions.map(q => {
        // First try: use group_id to find parent group (most reliable)
        if (q.group_id) {
          const parentGroup = listeningGroups.find(g => g.id === q.group_id);
          if (parentGroup) {
            return { ...q, section_id: parentGroup.section_id };
          }
        }
        
        // Second try: match by question_type and question_number range within groups
        // that have the same question_type
        const matchingGroups = listeningGroups.filter(g => 
          g.question_type === q.question_type &&
          q.question_number >= g.question_range_start && 
          q.question_number <= g.question_range_end
        );
        
        // If only one group matches, use it
        if (matchingGroups.length === 1) {
          return { ...q, section_id: matchingGroups[0].section_id };
        }
        
        // If multiple groups match (same type, same range in different sections),
        // prefer the one that matches current section_id
        if (matchingGroups.length > 1) {
          const sameSection = matchingGroups.find(g => g.section_id === q.section_id);
          if (sameSection) {
            return q; // Keep current section_id
          }
          // Otherwise just use the first match (last resort)
          return { ...q, section_id: matchingGroups[0].section_id };
        }
        
        return q;
      });

      // Update context with corrected questions
      setQuestions(correctedQuestions);
      
      const response = await apiSaveExamStructure(token, examId, { 
        exam: { ...exam, access_code: exam.code },
        sections, 
        questions: correctedQuestions,
        questionGroups,
        deletedQuestionIds,
        deletedGroupIds
      });
      
      if (response.idMapping) {
        updateIds(response.idMapping);
      }
      
      clearDeletedQuestionIds();
      clearDeletedGroupIds();
      clearTempCode(); // Clear temporary code from sessionStorage after successful save
      // Show "Saved" feedback on button
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
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
      updateExam({ status: updated.status, access_code: updated.access_code, code: updated.access_code || exam.code });
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

  const handleRegenerateCode = () => {
    const newCode = generateCode();
    updateExam({ code: newCode, access_code: newCode });
  };

  const handleSaveCode = () => {
    if (!editedCode || editedCode.length < 4) {
      showModal("Error", "Code must be at least 4 characters", "danger");
      return;
    }
    updateExam({ code: editedCode.toUpperCase(), access_code: editedCode.toUpperCase() });
    setIsEditingCode(false);
    setEditedCode("");
  };

  const copyAccessCode = async () => {
    const code = exam.code;
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

  const openModuleFullScreen = (module) => {
    setFullScreenModule(module);
  };

  const closeFullScreenModule = () => {
    setFullScreenModule(null);
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

  // Full Screen Module View
  if (fullScreenModule) {
    const moduleConfig = {
      listening: { title: "Listening Module", icon: Headphones, component: <ListeningTab /> },
      reading: { title: "Reading Module", icon: BookOpen, component: <ReadingTab /> },
      writing: { title: "Writing Module", icon: PenTool, component: <WritingTab /> }
    };
    
    const config = moduleConfig[fullScreenModule];
    const IconComponent = config.icon;

    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Full Screen Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={closeFullScreenModule}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Exam</span>
            </button>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center space-x-2">
              <IconComponent size={20} className="text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">{exam.title || "Untitled Exam"}</span>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving || justSaved}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors ${
              justSaved 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            }`}
          >
            {justSaved ? <CheckCircle size={16} /> : <Save size={16} />}
            <span>{isSaving ? "Saving..." : justSaved ? "Saved!" : "Save"}</span>
          </button>
        </div>

        {/* Full Screen Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {config.component}
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="font-bold text-gray-900">Create Exam</h2>
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
            onClick={() => openModuleFullScreen("listening")}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Headphones size={18} /> <span>Listening</span>
          </button>
          <button
            onClick={() => openModuleFullScreen("reading")}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <BookOpen size={18} /> <span>Reading</span>
          </button>
          <button
            onClick={() => openModuleFullScreen("writing")}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
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
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <span className="text-lg font-bold text-gray-800 truncate">
                {exam.title || "Untitled Exam"}
              </span>
              <button
                onClick={() => {
                  const newTitle = prompt("Enter exam name:", exam.title || "");
                  if (newTitle !== null) updateExam({ title: newTitle });
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Rename exam"
              >
                <Edit2 size={16} />
              </button>
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
                disabled={isSaving || justSaved}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors ${
                  justSaved 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {justSaved ? <CheckCircle size={16} /> : <Save size={16} />}
                <span>{isSaving ? "Saving..." : justSaved ? "Saved!" : "Save"}</span>
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
                  <span className="text-xs text-gray-500 uppercase">Code:</span>
                  {isEditingCode ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={editedCode}
                        onChange={(e) => setEditedCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                        placeholder="ABC123"
                        className="w-20 px-2 py-1 text-sm font-mono uppercase border rounded focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-wider"
                        maxLength={6}
                        autoFocus
                      />
                      <button onClick={handleSaveCode} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Save">
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => { setIsEditingCode(false); setEditedCode(""); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`font-mono text-lg font-bold tracking-[0.2em] ${exam.status === 'active' ? 'text-green-700' : 'text-gray-600'}`}>
                        {exam.code || '------'}
                      </span>
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
                          onClick={() => { setIsEditingCode(true); setEditedCode(exam.code || ""); }}
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
            <OverviewTab />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamEditor() {
  const { id } = useParams();
  const { token } = useAuth();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(!!id); // Only show loading if we have an ID to fetch
  const [loadError, setLoadError] = useState(null);
  
  // Load exam data when editing existing exam
  useEffect(() => {
    if (id && token) {
      setLoading(true);
      apiGetExam(token, id)
        .then(data => {
          setInitialData(data);
          // Clear the temp code since we're loading an existing exam
          sessionStorage.removeItem('newExamCode');
        })
        .catch(err => {
          console.error("Failed to load exam:", err);
          setLoadError(err.message);
        })
        .finally(() => setLoading(false));
    } else if (id && !token) {
      // Wait for auth - token might not be ready yet
      // Don't set loading to false, keep waiting
    } else if (!id) {
      // New exam - no need to load
      setLoading(false);
    }
  }, [id, token]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }
  
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <div className="text-red-500 mb-4">
            <AlertTriangle size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Exam</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <a href="/admin/exams" className="text-blue-600 hover:underline">Back to Exams</a>
        </div>
      </div>
    );
  }
  
  return (
    <ExamEditorProvider initialData={initialData}>
      <ExamEditorContent />
    </ExamEditorProvider>
  );
}
