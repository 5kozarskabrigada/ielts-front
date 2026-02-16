import React, { useState, useEffect } from "react";
import { useAuth } from "../../../authContext";
import { Trash2, Edit2, Plus, Search, Users, GraduationCap } from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import { apiListClassrooms, apiCreateClassroom } from "../../../api";

export default function ClassroomsPage() {
  const { token } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const data = await apiListClassrooms(token);
      setClassrooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCreateClassroom(token, formData);
      setIsModalOpen(false);
      setFormData({ name: "", description: "" });
      fetchClassrooms();
    } catch (err) {
      alert("Failed to create classroom");
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classrooms</h1>
          <p className="text-gray-500 mt-1">Manage student groups and enrollments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          <span>Create Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500">Loading classrooms...</p>
        ) : classrooms.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No classrooms found. Create your first class to get started.</p>
          </div>
        ) : (
          classrooms.map((cls) => (
            <div key={cls.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cls.description || "No description"}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <GraduationCap size={20} />
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-4 pt-4 border-t">
                <Users size={16} className="mr-2" />
                <span>{cls.students?.[0]?.count || 0} Students Enrolled</span>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-gray-50 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-100">
                  Manage Students
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Classroom"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. IELTS Prep Group A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create Class
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
