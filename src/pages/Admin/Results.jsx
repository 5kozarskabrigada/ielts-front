import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { apiListExams } from "../../api"; // Reuse list exams or create specific results endpoint
import { Search, Download, Eye, RotateCcw } from "lucide-react";

export default function ResultsPage() {
  const { token } = useAuth();
  const [results, setResults] = useState([]); // Placeholder for now
  const [loading, setLoading] = useState(false);

  // This would ideally fetch from a dedicated /admin/results endpoint
  // For now, we'll just show a placeholder UI as the endpoint needs to be built in backend first
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
        <div className="flex space-x-2">
          <button className="bg-white border text-gray-700 px-4 py-2 rounded flex items-center space-x-2 hover:bg-gray-50">
            <Download size={16} /> <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex space-x-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input 
            className="w-full pl-10 pr-4 py-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by student name or email..."
          />
        </div>
        <select className="border rounded px-4 py-2 bg-white">
          <option>All Exams</option>
          <option>Academic IELTS Mock 1</option>
        </select>
        <select className="border rounded px-4 py-2 bg-white">
          <option>All Statuses</option>
          <option>Completed</option>
          <option>Pending Grading</option>
        </select>
      </div>

      {/* Results Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Student</th>
              <th className="p-4 font-medium text-gray-600">Exam</th>
              <th className="p-4 font-medium text-gray-600">Date</th>
              <th className="p-4 font-medium text-gray-600">Overall Band</th>
              <th className="p-4 font-medium text-gray-600">L / R / W</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td colSpan="7" className="p-12 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <Search size={24} className="text-gray-400" />
                  </div>
                  <p>No results found matching your criteria.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
