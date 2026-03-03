import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../authContext";
import { Trash2, Edit2, Plus, Search, Users, GraduationCap, AlertCircle, CheckCircle, X } from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import { 
  apiListClassrooms, 
  apiCreateClassroom,
  apiUpdateClassroom,
  apiDeleteClassroom
} from "../../../api";

export default function ClassroomsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  // Edit Modal  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingClassroom, setDeletingClassroom] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  // Filter classrooms by search
  const filteredClassrooms = classrooms.filter(cls => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return cls.name?.toLowerCase().includes(query) || 
           cls.description?.toLowerCase().includes(query);
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setErrorMessage("Classroom name is required");
      setShowErrorModal(true);
      return;
    }
    
    try {
      await apiCreateClassroom(token, createForm);
      setIsCreateModalOpen(false);
      setCreateForm({ name: "", description: "" });
      fetchClassrooms();
      setSuccessMessage("Classroom created successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create classroom");
      setShowErrorModal(true);
    }
  };

  const handleEditClick = (e, cls) => {
    e.stopPropagation();
    setEditingClassroom(cls);
    setEditForm({ name: cls.name, description: cls.description || "" });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setErrorMessage("Classroom name is required");
      setShowErrorModal(true);
      return;
    }
    
    try {
      await apiUpdateClassroom(token, editingClassroom.id, editForm);
      setIsEditModalOpen(false);
      setEditingClassroom(null);
      fetchClassrooms();
      setSuccessMessage("Classroom updated successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to update classroom");
      setShowErrorModal(true);
    }
  };

  const handleDeleteClick = (e, cls) => {
    e.stopPropagation();
    setDeletingClassroom(cls);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClassroom) return;
    
    setIsDeleting(true);
    try {
      await apiDeleteClassroom(token, deletingClassroom.id);
      setIsDeleteModalOpen(false);
      setDeletingClassroom(null);
      fetchClassrooms();
      setSuccessMessage("Classroom deleted successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete classroom");
      setShowErrorModal(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStudentCount = (cls) => {
    // Handle different possible shapes of student count data
    if (cls.students && Array.isArray(cls.students) && cls.students[0]?.count !== undefined) {
      return cls.students[0].count;
    }
    if (typeof cls.student_count === 'number') {
      return cls.student_count;
    }
    return 0;
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classrooms</h1>
          <p className="text-gray-500 mt-1">Manage student groups and enrollments</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          <span>Create Class</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classrooms..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </>
        ) : filteredClassrooms.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchQuery 
                ? "No classrooms match your search" 
                : "No classrooms found. Create your first class to get started."}
            </p>
          </div>
        ) : (
          filteredClassrooms.map((cls) => (
            <div 
              key={cls.id} 
              onClick={() => navigate(`/admin/classrooms/${cls.id}`)}
              className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {cls.description || "No description"}
                  </p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 flex-shrink-0 ml-3">
                  <GraduationCap size={20} />
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mt-4 pt-4 border-t">
                <Users size={16} className="mr-2" />
                <span className="font-medium">{getStudentCount(cls)}</span>
                <span className="ml-1">Students</span>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={(e) => handleEditClick(e, cls)}
                  className="flex-1 bg-gray-50 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center space-x-1"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={(e) => handleDeleteClick(e, cls)}
                  className="flex-1 bg-red-50 text-red-600 py-2 rounded text-sm font-medium hover:bg-red-100 transition flex items-center justify-center space-x-1"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Classroom"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
              placeholder="e.g. IELTS Prep Group A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingClassroom(null);
        }}
        title="Edit Classroom"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
              placeholder="e.g. IELTS Prep Group A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingClassroom(null);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingClassroom(null);
        }}
        title="Delete Classroom"
      >
        <div className="py-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
          <p className="text-center text-gray-700 mb-2">
            Are you sure you want to delete <strong>{deletingClassroom?.name}</strong>?
          </p>
          <p className="text-center text-sm text-gray-500 mb-6">
            This will remove all students from this classroom. This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingClassroom(null);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Operation Successful</h3>
          <p className="mt-2 text-sm text-gray-500">{successMessage}</p>
          <div className="mt-6">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Operation Failed</h3>
          <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
          <div className="mt-6">
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
