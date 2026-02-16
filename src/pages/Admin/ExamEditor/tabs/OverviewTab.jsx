import React, { useState, useEffect } from "react";
import { useExamEditor } from "../ExamEditorContext";
import { useAuth } from "../../../authContext";
import { supabase } from "../../../supabaseClient"; // Need supabase for fetching classrooms directly or use api
import { apiListClassrooms } from "../../../api"; // We'll add this to api.js

export default function OverviewTab() {
  const { exam, updateExam } = useExamEditor();
  const { token } = useAuth();
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    const fetchClassrooms = async () => {
      // Temporary direct fetch or mock if apiListClassrooms isn't ready
      // Assuming apiListClassrooms exists or we implement it
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

  return (
    <div className="space-y-8">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={exam.status}
              onChange={(e) => updateExam({ status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="review">Ready for Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
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
