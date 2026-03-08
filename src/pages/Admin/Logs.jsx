import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { Activity, User, AlertTriangle, CheckCircle, Clock, Eye, Filter, Calendar } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const EVENT_TYPES = {
  joined: { label: "Joined", icon: User, color: "blue" },
  exam_started: { label: "Exam Started", icon: CheckCircle, color: "green" },
  module_completed: { label: "Module Completed", icon: CheckCircle, color: "green" },
  fullscreen_exit: { label: "Fullscreen Exit", icon: AlertTriangle, color: "red" },
  tab_switch: { label: "Tab Switch", icon: AlertTriangle, color: "red" },
  exam_submitted: { label: "Exam Submitted", icon: CheckCircle, color: "purple" }
};

export default function LogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState("all");
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      // Fetch all logs
      const logsResponse = await fetch(`${API_URL}/monitoring/logs/all`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!logsResponse.ok) {
        throw new Error(`Failed to fetch logs: ${logsResponse.status}`);
      }
      
      const logsData = await logsResponse.json();

      // Fetch exams for filter
      const examsResponse = await fetch(`${API_URL}/exams`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const examsData = await examsResponse.json();

      setLogs(Array.isArray(logsData) ? logsData : []);
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      alert("Failed to load logs. Please ensure database tables are created. See DATABASE_MIGRATION_INSTRUCTIONS.md");
      setLogs([]);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by exam
    if (selectedExam !== "all") {
      filtered = filtered.filter(log => log.exam_id === selectedExam);
    }

    // Filter by event type
    if (selectedEventType !== "all") {
      filtered = filtered.filter(log => log.event_type === selectedEventType);
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        if (dateFilter === "today") {
          return logDate.toDateString() === now.toDateString();
        } else if (dateFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return logDate > weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return logDate > monthAgo;
        }
        return true;
      });
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const filteredLogs = filterLogs();

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventConfig = (eventType) => {
    return EVENT_TYPES[eventType] || { label: eventType, icon: Activity, color: "gray" };
  };

  const getEventColor = (eventType) => {
    const config = getEventConfig(eventType);
    const colors = {
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      green: "bg-green-100 text-green-700 border-green-200",
      red: "bg-red-100 text-red-700 border-red-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      gray: "bg-gray-100 text-gray-700 border-gray-200"
    };
    return colors[config.color] || colors.gray;
  };

  const violationCount = logs.filter(log => 
    log.event_type === "fullscreen_exit" || log.event_type === "tab_switch"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Activity Logs</h1>
          <p className="text-gray-600 mt-1">Monitor student exam activities and violations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{logs.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Violations</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{violationCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {logs.filter(log => log.event_type === "exam_started").length -
                 logs.filter(log => log.event_type === "exam_submitted").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Activity</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {logs.filter(log => {
                  const logDate = new Date(log.timestamp);
                  const today = new Date();
                  return logDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Exams</option>
              {Array.isArray(exams) && exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Events</option>
              {Object.entries(EVENT_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Exam</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Event</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const eventConfig = getEventConfig(log.event_type);
                  const EventIcon = eventConfig.icon;
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-900">
                          <Clock size={16} className="text-gray-400" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{log.user_name || "Unknown"}</p>
                            <p className="text-xs text-gray-500">{log.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{log.exam_title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${getEventColor(log.event_type)}`}>
                          <EventIcon size={14} />
                          <span>{eventConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.metadata && (
                          <p className="text-sm text-gray-600">
                            {log.metadata.module && <span className="capitalize">{log.metadata.module}</span>}
                            {log.metadata.time_spent && <span> • {Math.floor(log.metadata.time_spent / 60)}m</span>}
                            {log.metadata.auto_submit && <span> • Auto-submit</span>}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
