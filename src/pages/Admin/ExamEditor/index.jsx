import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExamEditorProvider, useExamEditor } from "./ExamEditorContext";
import OverviewTab from "./tabs/OverviewTab";
import ListeningTab from "./tabs/ListeningTab";
import ReadingTab from "./tabs/ReadingTab";
import { useAuth } from "../../../authContext";
import { apiSaveExamStructure, apiCreateExam } from "../../../api";
import { Layout, Headphones, BookOpen, PenTool, Save, Upload, AlertTriangle, CheckCircle } from "lucide-react";
import Modal from "../../../components/Modal/Modal";

function ExamEditorContent() {
  const { exam, sections, questions, validate, validationErrors, isSaving, updateExam } = useExamEditor();
  const [activeTab, setActiveTab] = useState("overview");
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: "", content: "", type: "default" });

  const showModal = (title, content, type = "default") => {
    setModalConfig({ title, content, type });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // If no ID (creating new from scratch via editor), we need to create first
    let examId = id;
    let isNew = false;

    if (!examId) {
      try {
        const newExam = await apiCreateExam(token, {
          title: exam.title || "Untitled Exam",
          description: exam.description || "",
          duration_minutes: 180, // Default full duration
          modules_config: exam.modules_config
        });
        examId = newExam.id;
        isNew = true;
        // Update context to have ID? Or just navigate
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
      await apiSaveExamStructure(token, examId, { exam, sections, questions });
      showModal("Success", "Exam saved successfully!", "success");
      if (isNew) {
        navigate(`/admin/exams/editor/${examId}`);
      }
    } catch (err) {
      showModal("Save Failed", "Failed to save exam structure: " + err.message, "danger");
    }
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

      {/* Editor Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="font-bold text-gray-900">Exam Editor</h2>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full uppercase font-bold">
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
        {/* Top Bar */}
        <div className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-bold text-gray-800 truncate">{exam.title || "Untitled Exam"}</h1>
          <div className="flex items-center space-x-3">
            <button className="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-sm font-medium">Preview</button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={16} /> <span>{isSaving ? "Saving..." : "Save Draft"}</span>
            </button>
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
