import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../authContext";
import { apiGetPerStudentUsage, apiGetUsageSummary } from "../../api";
import {
  DollarSign, Users, Clock, Calendar, TrendingUp, Server,
  Database, ArrowUpDown, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";

const HETZNER_MONTHLY = 11.57;

export default function UsagePage() {
  const { token } = useAuth();
  const [perStudent, setPerStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [neonMonthly, setNeonMonthly] = useState(4.20);
  const [sortField, setSortField] = useState("total_response_ms");
  const [sortDir, setSortDir] = useState("desc");
  const [tab, setTab] = useState("students");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [from, setFrom] = useState(startOfMonth.toISOString().slice(0, 10));
  const [to, setTo] = useState(now.toISOString().slice(0, 10));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentData, summaryData] = await Promise.all([
        apiGetPerStudentUsage(token, from, to),
        apiGetUsageSummary(token, from, to),
      ]);
      setPerStudent(studentData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const daysInPeriod = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectionMultiplier = daysInMonth / daysInPeriod;

  const totalMonthly = HETZNER_MONTHLY + neonMonthly;
  const userCount = perStudent?.totals?.user_count || 0;
  const studentCount = perStudent?.totals?.student_count || 0;
  const adminCount = perStudent?.totals?.admin_count || 0;
  const totalMs = perStudent?.totals?.total_response_ms || 0;
  const studentMs = perStudent?.totals?.student_response_ms || 0;
  const adminMs = perStudent?.totals?.admin_response_ms || 0;

  // Cost allocation based on actual usage (not equal split)
  const studentPct = totalMs > 0 ? studentMs / totalMs : 0;
  const adminPct = totalMs > 0 ? adminMs / totalMs : 0;

  const studentNeonCost = neonMonthly * studentPct;
  const adminNeonCost = neonMonthly * adminPct;

  // Hetzner is fixed - split proportionally by usage
  const studentHetznerCost = HETZNER_MONTHLY * studentPct;
  const adminHetznerCost = HETZNER_MONTHLY * adminPct;

  const totalStudentCost = studentNeonCost + studentHetznerCost;
  const totalAdminCost = adminNeonCost + adminHetznerCost;

  const avgPerStudent = studentCount > 0 ? totalStudentCost / studentCount : 0;
  const avgPerAdmin = adminCount > 0 ? totalAdminCost / adminCount : 0;

  const sortedUsers = useMemo(() => {
    if (!perStudent?.users) return [];
    return [...perStudent.users].sort((a, b) => {
      const aVal = Number(a[sortField]) || 0;
      const bVal = Number(b[sortField]) || 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [perStudent, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortDir === "desc"
      ? <ChevronDown size={12} className="text-blue-600" />
      : <ChevronUp size={12} className="text-blue-600" />;
  };

  if (loading) return <div className="p-8 text-gray-500">Loading usage data...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage & Cost Tracking</h1>
          <p className="text-gray-500 mt-1">Per-student infrastructure cost attribution</p>
        </div>
        <button onClick={fetchData} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm">
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CostCard title="Hetzner (fixed)" value={`$${HETZNER_MONTHLY.toFixed(2)}`} subtitle="Server + IP / month" icon={Server} color="blue" />
        <CostCard
          title="Neon (usage-based)"
          value={
            <input
              type="number" step="0.01" min="0"
              value={neonMonthly}
              onChange={e => setNeonMonthly(parseFloat(e.target.value) || 0)}
              className="w-24 text-2xl font-bold bg-transparent border-b border-dashed border-green-300 focus:outline-none focus:border-green-500 text-gray-900"
            />
          }
          subtitle="Enter monthly Neon bill"
          icon={Database}
          color="green"
        />
        <CostCard title="Total Monthly" value={`$${totalMonthly.toFixed(2)}`} subtitle={`${userCount} tracked users`} icon={DollarSign} color="purple" />
        <CostCard title="Cost Allocation" value={`${(studentPct * 100).toFixed(0)}% / ${(adminPct * 100).toFixed(0)}%`} subtitle="Student / Admin" icon={TrendingUp} color="orange" />
      </div>

      {/* Admin vs Student Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <CostCard title="Students" value={`$${totalStudentCost.toFixed(2)}`} subtitle={`${studentCount} users · $${avgPerStudent.toFixed(3)}/user`} icon={Users} color="blue" />
        <CostCard title="Admins" value={`$${totalAdminCost.toFixed(2)}`} subtitle={`${adminCount} users · $${avgPerAdmin.toFixed(3)}/user`} icon={Users} color="purple" />
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex items-center space-x-4 flex-wrap gap-y-2">
        <Calendar size={16} className="text-gray-400" />
        <label className="text-sm text-gray-600 font-medium">From</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
        <label className="text-sm text-gray-600 font-medium">To</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
        <button onClick={fetchData} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Apply</button>
        <span className="text-xs text-gray-400">{daysInPeriod} days selected · ×{projectionMultiplier.toFixed(1)} to project full month</span>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: "students", label: "Per User" },
          { key: "summary", label: "Summary" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "students" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Per-User Usage</h2>
            <span className="text-xs text-gray-400">{perStudent?.totals?.total_requests || 0} total requests tracked</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => handleSort("total_requests")}>
                    <span className="inline-flex items-center space-x-1"><span>Requests</span><SortIcon field="total_requests" /></span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => handleSort("total_response_ms")}>
                    <span className="inline-flex items-center space-x-1"><span>Response Time</span><SortIcon field="total_response_ms" /></span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => handleSort("active_days")}>
                    <span className="inline-flex items-center space-x-1"><span>Active Days</span><SortIcon field="active_days" /></span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => handleSort("exam_requests")}>
                    <span className="inline-flex items-center space-x-1"><span>Exam Reqs</span><SortIcon field="exam_requests" /></span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => handleSort("pct_of_total_time")}>
                    <span className="inline-flex items-center space-x-1"><span>% Share</span><SortIcon field="pct_of_total_time" /></span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedUsers.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No usage data yet. Data will appear after users use the platform.</td></tr>
                ) : sortedUsers.map((u, i) => {
                  const estNeon = neonMonthly * (u.pct_of_total_time / 100);
                  const estHetzner = HETZNER_MONTHLY * (u.pct_of_total_time / 100);
                  const estTotal = estNeon + estHetzner;
                  return (
                    <tr key={u.user_id} className={`hover:bg-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-gray-400">{u.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.user_role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.user_role}
                        </span>
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-gray-700">{u.total_requests}</td>
                      <td className="text-right px-4 py-3 font-mono text-gray-700">{u.total_response_sec}s</td>
                      <td className="text-right px-4 py-3 font-mono text-gray-700">{u.active_days}</td>
                      <td className="text-right px-4 py-3 font-mono text-gray-700">{u.exam_requests}</td>
                      <td className="text-right px-4 py-3">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className={`${u.user_role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'} h-1.5 rounded-full`} style={{ width: `${Math.min(u.pct_of_total_time, 100)}%` }} />
                          </div>
                          <span className="font-mono text-gray-700 w-14 text-right">{u.pct_of_total_time}%</span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3 font-mono font-semibold text-green-700">${estTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "summary" && summary && (
        <div className="space-y-6">
          {/* By Role */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Usage by Role</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-right px-4 py-3 font-semibold">Requests</th>
                  <th className="text-right px-4 py-3 font-semibold">Total Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(summary.by_role || []).map(r => (
                  <tr key={r.user_role} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 capitalize">{r.user_role || "anonymous"}</td>
                    <td className="text-right px-4 py-3 font-mono text-gray-700">{r.requests}</td>
                    <td className="text-right px-4 py-3 font-mono text-gray-700">{(Number(r.total_ms) / 1000).toFixed(2)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Endpoints */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Top Endpoints</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Path</th>
                  <th className="text-right px-4 py-3 font-semibold">Requests</th>
                  <th className="text-right px-4 py-3 font-semibold">Total Time</th>
                  <th className="text-right px-4 py-3 font-semibold">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(summary.top_endpoints || []).map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{e.path}</td>
                    <td className="text-right px-4 py-3 font-mono text-gray-700">{e.requests}</td>
                    <td className="text-right px-4 py-3 font-mono text-gray-700">{(Number(e.total_ms) / 1000).toFixed(2)}s</td>
                    <td className="text-right px-4 py-3 font-mono text-gray-700">{e.avg_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* By Day */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Daily Activity</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-right px-4 py-3 font-semibold">Unique Users</th>
                  <th className="text-right px-4 py-3 font-semibold">Requests</th>
                  <th className="text-right px-4 py-3 font-semibold">Total Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(summary.by_day || []).map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{new Date(d.day).toLocaleDateString()}</td>
                    <td className="text-right px-4 py-3 font-mono text-gray-700">{d.unique_users}</td>
                    <td className="text-right px-4 py-3 font-mono text-gray-700">{d.requests}</td>
                    <td className="text-right px-4 py-3 font-mono text-gray-700">{(Number(d.total_ms) / 1000).toFixed(2)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CostCard({ title, value, subtitle, icon: Icon, color }) {
  const styles = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    green: { bg: "bg-green-50", text: "text-green-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-600" },
  };
  const s = styles[color];

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2.5 rounded-lg ${s.bg} ${s.text}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <span className="text-sm text-gray-500 font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {typeof value === "string" ? value : value}
      </div>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}
