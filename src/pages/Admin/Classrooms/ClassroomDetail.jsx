import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../authContext";
import { 
  ArrowLeft, 
  Users, 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  X, 
  Save, 
  GraduationCap,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import { 
  apiGetClassroom, 
  apiUpdateClassroom, 
  apiDeleteClassroom,
  apiListUsers, 
  apiAddStudentToClassroom, 
  apiRemoveStudentFromClassroom 
} from "../../../api";

export default function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  // Add student
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState("");
  const [addStudentSearch, setAddStudentSearch] = useState("");

  // Search students in classroom
  const [searchQuery, setSearchQuery] = useState("");

  // Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Remove student modal
  const [isRemoveStudentModalOpen, setIsRemoveStudentModalOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);

  // Feedback modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchClassroom = async () => {
    try {
      const data = await apiGetClassroom(token, id);
      setClassroom(data);
      setStudents(data.students || []);
      setEditForm({ name: data.name, description: data.description || "" });
    } catch (err) {
      console.error("Failed to fetch classroom:", err);
      setErrorMessage("Failed to load classroom details");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const data = await apiListUsers(token);
      setAllStudents(data.filter(u => u.role === 'student'));
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  };

  useEffect(() => {
    fetchClassroom();
    fetchAllStudents();
  }, [token, id]);

  // Filter students in classroom by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s => 
      s.first_name?.toLowerCase().includes(query) ||
      s.last_name?.toLowerCase().includes(query) ||
      s.username?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Filter available students (not in classroom) by search
  const availableStudents = useMemo(() => {
    const enrolledIds = new Set(students.map(s => s.id));
    let available = allStudents.filter(s => !enrolledIds.has(s.id));
    
    if (addStudentSearch) {
      const query = addStudentSearch.toLowerCase();
      available = available.filter(s =>
        s.first_name?.toLowerCase().includes(query) ||
        s.last_name?.toLowerCase().includes(query) ||
        s.username?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query)
      );
    }
    return available;
  }, [allStudents, students, addStudentSearch]);

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      setErrorMessage("Classroom name is required");
      setShowErrorModal(true);
      return;
    }

    try {
      await apiUpdateClassroom(token, id, editForm);
      setClassroom({ ...classroom, ...editForm });
      setIsEditing(false);
      setSuccessMessage("Classroom updated successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to update classroom");
      setShowErrorModal(true);
    }
  };

  const handleDeleteClassroom = async () => {
    setIsDeleting(true);
    try {
      await apiDeleteClassroom(token, id);
      navigate("/admin/classrooms", { replace: true });
    } catch (err) {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setErrorMessage(err.message || "Failed to delete classroom");
      setShowErrorModal(true);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentToAdd) return;
    
    try {
      await apiAddStudentToClassroom(token, id, selectedStudentToAdd);
      fetchClassroom();
      setSelectedStudentToAdd("");
      setAddStudentSearch("");
      setIsAddModalOpen(false);
      setSuccessMessage("Student added to classroom!");
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to add student");
      setShowErrorModal(true);
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    
    try {
      await apiRemoveStudentFromClassroom(token, id, studentToRemove.id);
      setStudents(students.filter(s => s.id !== studentToRemove.id));
      setIsRemoveStudentModalOpen(false);
      setStudentToRemove(null);
      setSuccessMessage("Student removed from classroom");
      setShowSuccessModal(true);
    } catch (err) {
      setIsRemoveStudentModalOpen(false);
      setStudentToRemove(null);
      setErrorMessage(err.message || "Failed to remove student");
      setShowErrorModal(true);
    }
  };

  const openRemoveStudentModal = (student) => {
    setStudentToRemove(student);
    setIsRemoveStudentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Classroom not found</p>
          <button 
            onClick={() => navigate("/admin/classrooms")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Classrooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate("/admin/classrooms")}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-4 transition"
        >
          <ArrowLeft size={18} className="mr-1" />
          Back to Classrooms
        </button>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3 max-w-lg">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-2xl font-bold w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Classroom name"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
                  placeholder="Description (optional)"
                  rows={2}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveEdit}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
                  >
                    <Save size={16} />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({ name: classroom.name, description: classroom.description || "" });
                    }}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <GraduationCap size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
                    <p className="text-gray-500 mt-1">{classroom.description || "No description"}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition"
              >
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-100 transition"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4 flex items-center space-x-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            <p className="text-sm text-gray-500">Students Enrolled</p>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Students</h2>
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Add Student Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition text-sm"
            >
              <Plus size={16} />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchQuery 
                  ? "No students match your search" 
                  : "No students enrolled yet. Click 'Add Student' to get started."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </div>
                        <span className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.username}</td>
                    <td className="px-6 py-4 text-gray-600">{student.email}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openRemoveStudentModal(student)}
                        className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition"
                        title="Remove from class"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedStudentToAdd("");
          setAddStudentSearch("");
        }}
        title="Add Student to Classroom"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={addStudentSearch}
                onChange={(e) => setAddStudentSearch(e.target.value)}
                placeholder="Search by name, username, or email..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
            <select
              className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedStudentToAdd}
              onChange={(e) => setSelectedStudentToAdd(e.target.value)}
            >
              <option value="">Select a student...</option>
              {availableStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} ({s.username}) - {s.email}
                </option>
              ))}
            </select>
            {availableStudents.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {addStudentSearch 
                  ? "No matching students found" 
                  : "All students are already enrolled in this class"}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setSelectedStudentToAdd("");
                setAddStudentSearch("");
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStudent}
              disabled={!selectedStudentToAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <Plus size={16} />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Classroom"
      >
        <div className="py-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
          <p className="text-center text-gray-700 mb-2">
            Are you sure you want to delete <strong>{classroom.name}</strong>?
          </p>
          <p className="text-center text-sm text-gray-500 mb-6">
            This will remove all {students.length} students from this classroom. This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteClassroom}
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
                  <span>Delete Classroom</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Student Confirmation Modal */}
      <Modal
        isOpen={isRemoveStudentModalOpen}
        onClose={() => {
          setIsRemoveStudentModalOpen(false);
          setStudentToRemove(null);
        }}
        title="Remove Student"
      >
        <div className="py-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Users size={24} className="text-red-600" />
            </div>
          </div>
          <p className="text-center text-gray-700 mb-2">
            Remove <strong>{studentToRemove?.first_name} {studentToRemove?.last_name}</strong> from this class?
          </p>
          <p className="text-center text-sm text-gray-500 mb-6">
            The student will no longer have access to this classroom's assignments and materials.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => {
                setIsRemoveStudentModalOpen(false);
                setStudentToRemove(null);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveStudent}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center space-x-2"
            >
              <X size={16} />
              <span>Remove Student</span>
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
          <p className="text-gray-600">{successMessage}</p>
          <div className="mt-6">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              OK
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
          <p className="text-gray-600">{errorMessage}</p>
          <div className="mt-6">
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
