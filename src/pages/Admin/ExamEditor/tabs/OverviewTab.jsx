import React, { useState, useEffect } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { useAuth } from "../../../../authContext";
import { useParams } from "react-router-dom";
import { apiListClassrooms, apiUpdateExamStatus, apiRegenerateExamCode } from "../../../../api";
import { Play, Pause, Copy, RefreshCw, CheckCircle, Key, AlertCircle } from "lucide-react";

export default function OverviewTab() {
  const { exam, updateExam } = useExamEditor();
  const { token } = useAuth();
  const { id: examId } = useParams();
  const [classrooms, setClassrooms] = useState([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/classrooms", {
           headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) {
           const data = await res.json();
           setClassrooms(data);
        }
      } catch (err) {
        console.error("Failed to fetch classrooms", err);
      }
    };
    fetchClassrooms();
  }, [token]);

  // Helper to handle nested state updates
  const updateSecurity = (updates) => {
    updateExam({
      security_settings: {
        ...exam.security_settings,
        ...updates
      }
    });
  };

  const toggleClassroom = (classId) => {
    const current = exam.security_settings?.assigned_classrooms || [];
    let updated;
    if (current.includes(classId)) {
      updated = current.filter(id => id !== classId);
    } else {
      updated = [...current, classId];
    }
    updateSecurity({ assigned_classrooms: updated });
  };

  const handleActivateExam = async () => {
    if (!examId) {
      alert("Please save the exam first before activating");
      return;
    }
    setIsActivating(true);
    try {
      const newStatus = exam.status === 'active' ? 'draft' : 'active';
      const updated = await apiUpdateExamStatus(token, examId, { status: newStatus });
      updateExam({ status: updated.status, access_code: updated.access_code });
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setIsActivating(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!examId) return;
    try {
      const updated = await apiRegenerateExamCode(token, examId);
      updateExam({ access_code: updated.exam.access_code });
    } catch (err) {
      alert("Failed to regenerate code: " + err.message);
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

  return (
    <div className="space-y-8">
      {/* Activation Panel */}
      <div className={`p-6 rounded-xl border-2 ${
        exam.status === 'active' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              exam.status === 'active' ? 'bg-green-100' : 'bg-gray-200'
            }`}>
              {exam.status === 'active' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {exam.status === 'active' ? 'Exam is Active' : 'Exam is Not Active'}
              </h3>
              <p className="text-sm text-gray-500">
                {exam.status === 'active' 
                  ? 'Students can now access this exam with the code below' 
                  : 'Activate this exam to allow students to take it'}
              </p>
            </div>
          </div>
          <button
            onClick={handleActivateExam}
            disabled={isActivating || !examId}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition ${
              exam.status === 'active'
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {exam.status === 'active' ? (
              <>
                <Pause size={18} />
                <span>{isActivating ? 'Deactivating...' : 'Deactivate'}</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>{isActivating ? 'Activating...' : 'Activate Exam'}</span>
              </>
            )}
          </button>
        </div>

        {/* Access Code Display */}
        {exam.status === 'active' && exam.access_code && (
          <div className="mt-6 pt-6 border-t border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Key className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Student Access Code</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-mono text-3xl font-bold text-green-800 tracking-[0.2em] select-all">
                  {exam.access_code}
                </span>
                <button
                  onClick={copyAccessCode}
                  className={`p-2 rounded-lg transition ${
                    codeCopied 
                      ? 'bg-green-200 text-green-700' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                  title="Copy code"
                >
                  {codeCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
                </button>
                <button
                  onClick={handleRegenerateCode}
                  className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition"
                  title="Regenerate code"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {!examId && (
          <p className="mt-4 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            Save the exam first to enable activation
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Exam Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
            <input
              type="text"
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={exam.title}
              onChange={(e) => updateExam({ title: e.target.value })}
              placeholder="e.g. IELTS Academic Mock Test 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Code</label>
            <input
              type="text"
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={exam.code}
              onChange={(e) => updateExam({ code: e.target.value })}
              placeholder="e.g. IELTS-AC-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
            <select
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={exam.type}
              onChange={(e) => updateExam({ type: e.target.value })}
            >
              <option value="academic">Academic</option>
              <option value="general">General Training</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              value={exam.description || ""}
              onChange={(e) => updateExam({ description: e.target.value })}
              placeholder="Brief description of the exam..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Access Control & Security</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility Scope</label>
            <select
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={exam.security_settings?.visibility_scope || 'all'}
              onChange={(e) => updateSecurity({ visibility_scope: e.target.value })}
            >
              <option value="all">All Students</option>
              <option value="classroom">Specific Classrooms</option>
            </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Violation Policy</label>
             <select
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={exam.security_settings?.security_mode || 'log_only'}
              onChange={(e) => updateSecurity({ security_mode: e.target.value })}
            >
              <option value="log_only">Log Only (No Action)</option>
              <option value="disqualify">Auto-Disqualify</option>
            </select>
          </div>
        </div>

        {exam.security_settings?.visibility_scope === 'classroom' && (
          <div className="bg-gray-50 p-4 rounded border">
            <h4 className="text-sm font-bold text-gray-700 mb-2">Assign Classrooms</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {classrooms.length === 0 ? (
                 <p className="text-sm text-gray-500">No classrooms found. Create one in Classrooms page.</p>
              ) : (
                classrooms.map(cls => (
                  <label key={cls.id} className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      checked={(exam.security_settings?.assigned_classrooms || []).includes(cls.id)}
                      onChange={() => toggleClassroom(cls.id)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{cls.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Module Settings</h3>
        <div className="space-y-4">
          {['listening', 'reading', 'writing'].map(module => (
            <div key={module} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exam.modules_config[module].enabled}
                  onChange={(e) => {
                    const newConfig = { ...exam.modules_config };
                    newConfig[module].enabled = e.target.checked;
                    updateExam({ modules_config: newConfig });
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="capitalize font-medium text-gray-900">{module} Module</span>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-500">Duration (min):</label>
                <input
                  type="number"
                  className="w-20 p-1 border rounded text-center"
                  value={exam.modules_config[module].duration}
                  onChange={(e) => {
                    const newConfig = { ...exam.modules_config };
                    newConfig[module].duration = parseInt(e.target.value);
                    updateExam({ modules_config: newConfig });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
