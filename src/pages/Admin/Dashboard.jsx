import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../authContext";
import { apiGetDashboardStats } from "../../api";
import { 
  Users, BookOpen, BarChart2, LogOut, Settings, CheckCircle, Clock, GraduationCap 
} from "lucide-react";

// Layout Component
export default function AdminDashboardLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/admin/dashboard", label: "Overview", icon: BarChart2 },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/classrooms", label: "Classrooms", icon: GraduationCap },
    { path: "/admin/exams", label: "Exams", icon: BookOpen },
    { path: "/admin/results", label: "Results", icon: CheckCircle },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">IELTS Admin</h1>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Control Panel</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={18} className={`transition-colors ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center space-x-2 w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-lg transition-all text-sm font-medium shadow-sm"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </div>
    </div>
  );
}

// Dashboard Overview Component (Rendered at /admin/dashboard)
export function DashboardOverview() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiGetDashboardStats(token);
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <div className="p-8 text-gray-500">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers} 
          icon={Users} 
          color="blue" 
        />
        <StatCard 
          title="Active Exams" 
          value={stats?.activeExams} 
          icon={BookOpen} 
          color="green" 
        />
        <StatCard 
          title="Completed Sessions" 
          value={stats?.completedExams} 
          icon={CheckCircle} 
          color="purple" 
        />
        <StatCard 
          title="Pending Grading" 
          value={stats?.pendingGrading} 
          icon={Clock} 
          color="orange" 
        />
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">System Health</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="font-semibold text-sm">API Operational</span>
          </div>
          <div className="flex items-center space-x-2.5 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="font-semibold text-sm">Database Connected</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-gray-400 text-sm text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No recent activity logs available.
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const styles = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    green: { bg: "bg-green-50", text: "text-green-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-600" },
  };

  const style = styles[color];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
      <div className={`p-3.5 rounded-xl ${style.bg} ${style.text}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-0.5">{title}</p>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
