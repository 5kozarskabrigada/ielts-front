import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { apiListUsers, apiCreateUser, apiUpdateUser, apiDeleteUser } from "../../api";
import { Trash2, Edit2, Plus, Search, Copy, Check } from "lucide-react";

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", role: "student", password: "" });
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createdUser, setCreatedUser] = useState(null);

  const fetchUsers = async (query = "") => {
    setLoading(true);
    try {
      const data = await apiListUsers(token, query);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [token, searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await apiUpdateUser(token, editingId, formData);
        setIsModalOpen(false);
      } else {
        const newUser = await apiCreateUser(token, formData);
        setCreatedUser(newUser);
        setIsModalOpen(false);
      }
      fetchUsers(searchQuery);
      setFormData({ firstName: "", lastName: "", email: "", role: "student", password: "" });
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await apiDeleteUser(token, id);
        fetchUsers(searchQuery);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email || "",
      role: user.role,
      password: "", // Leave empty to keep existing
    });
    setIsModalOpen(true);
    setCreatedUser(null);
  };

  const copyToClipboard = async (user) => {
    const text = `Name: ${user.first_name} ${user.last_name}\nUsername: ${user.username}\nPassword: ${user.temp_password}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied credentials to clipboard!");
    } catch (err) {
      console.error("Clipboard failed", err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert("Copied credentials to clipboard!");
      } catch (err) {
        console.error('Fallback copy failed', err);
        alert("Failed to copy. Please copy manually.");
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ firstName: "", lastName: "", email: "", role: "student", password: "" }); setCreatedUser(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          <span>Add User</span>
        </button>
      </div>

      {/* Created User Success Message */}
      {createdUser && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6 shadow-sm">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center">
              <Check size={20} className="mr-2" /> User Created Successfully!
            </h3>
            <button onClick={() => setCreatedUser(null)} className="text-gray-500 hover:text-gray-700">Dismiss</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 block">Full Name:</span>
              <span className="font-medium">{createdUser.first_name} {createdUser.last_name}</span>
            </div>
            <div>
              <span className="text-gray-600 block">Username:</span>
              <span className="font-mono bg-white px-2 py-1 rounded border">{createdUser.username}</span>
            </div>
            {createdUser.temp_password && (
              <div className="col-span-2 mt-2">
                <span className="text-gray-600 block mb-1">Temporary Password:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lg font-bold bg-white px-3 py-2 rounded border border-green-300 text-green-700">
                    {createdUser.temp_password}
                  </span>
                  <button
                    onClick={() => copyToClipboard(createdUser)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded hover:bg-blue-50"
                  >
                    <Copy size={16} /> <span>Copy Credentials</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share these credentials with the student. They can use their username <b>{createdUser.username}</b> to login.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          placeholder="Search users by name, username, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Username</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Email</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Role</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="p-4 text-gray-600 font-mono text-sm">{user.username}</td>
                  <td className="p-4 text-gray-600 text-sm">{user.email || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 flex space-x-2">
                    <button onClick={() => handleEdit(user)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? "Edit User" : "Create User"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email {formData.role === 'student' ? '(Optional)' : '(Required for Admin)'}</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={formData.role === 'admin'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingId ? "New Password (Optional)" : "Password (Optional)"}
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder={editingId ? "Leave blank to keep existing" : "Leave blank to auto-generate"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingId ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
