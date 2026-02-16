import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { apiListUsers, apiCreateUser, apiUpdateUser, apiDeleteUser } from "../../api";
import { Trash2, Edit2, Plus, Search, Copy, Check, AlertTriangle } from "lucide-react";
import Modal from "../../components/Modal/Modal";

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", role: "student", password: "" });
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
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
        setIsFormModalOpen(false);
        fetchUsers(searchQuery);
        setFormData({ firstName: "", lastName: "", email: "", role: "student", password: "" });
        setEditingId(null);
      } else {
        const newUser = await apiCreateUser(token, formData);
        setCreatedUser(newUser);
        setIsFormModalOpen(false);
        setIsSuccessModalOpen(true); // Show success modal
        fetchUsers(searchQuery);
        setFormData({ firstName: "", lastName: "", email: "", role: "student", password: "" });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiDeleteUser(token, deletingId);
      fetchUsers(searchQuery);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (err) {
      setError(err.message);
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
    setIsFormModalOpen(true);
    setCreatedUser(null);
  };

  const copyToClipboard = async (user) => {
    const text = `Name: ${user.first_name} ${user.last_name}\nUsername: ${user.username}\nPassword: ${user.temp_password}`;
    try {
      await navigator.clipboard.writeText(text);
      // alert("Copied credentials to clipboard!"); // Replaced with inline feedback if needed, or just silent
    } catch (err) {
      console.error("Clipboard failed", err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={() => { setIsFormModalOpen(true); setEditingId(null); setFormData({ firstName: "", lastName: "", email: "", role: "student", password: "" }); setCreatedUser(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          <span>Add User</span>
        </button>
      </div>

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
                    <button onClick={() => confirmDelete(user.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingId ? "Edit User" : "Create User"}
      >
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
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
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
      </Modal>

      {/* Success Modal (Compact) */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="User Created"
        type="success"
        actions={
          <button onClick={() => setIsSuccessModalOpen(false)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Done
          </button>
        }
      >
        {createdUser && (
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium">{createdUser.first_name} {createdUser.last_name}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Username:</span>
              <span className="font-mono bg-gray-50 px-2 rounded">{createdUser.username}</span>
            </div>
            {createdUser.temp_password && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500">Password:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-green-700">{createdUser.temp_password}</span>
                  <button onClick={() => copyToClipboard(createdUser)} className="text-blue-600 hover:text-blue-800" title="Copy">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}
            {createdUser.email && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Email:</span>
                <span>{createdUser.email}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
        type="danger"
        actions={
          <>
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              Cancel
            </button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this user? This action moves the user to the Recycle Bin.</p>
      </Modal>
    </div>
  );
}
