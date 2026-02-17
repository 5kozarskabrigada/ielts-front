import React, { useState, useEffect } from "react";
import { useAuth } from "../../../authContext";
import { Trash2, Edit2, Plus, Search, Users, GraduationCap, AlertCircle, CheckCircle, X } from "lucide-react";
import Modal from "../../../components/Modal/Modal";
import { 
  apiListClassrooms, 
  apiCreateClassroom, 
  apiGetClassroom, 
  apiListUsers, 
  apiAddStudentToClassroom, 
  apiRemoveStudentFromClassroom 
} from "../../../api";

export default function ClassroomsPage() {
  const { token } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Manage Students Modal
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classroomStudents, setClassroomStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState("");

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const fetchClassroomDetails = async (id) => {
    try {
      const data = await apiGetClassroom(token, id);
      setSelectedClassroom(data);
      setClassroomStudents(data.students || []);
    } catch (err) {
      console.error("Failed to fetch classroom details", err);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const data = await apiListUsers(token); // Should filter by role='student' if API supports or client side
      setAllStudents(data.filter(u => u.role === 'student'));
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  useEffect(() => {
    fetchClassrooms();
    fetchAllStudents();
  }, [token]);

  const handleManageStudents = (cls) => {
    setSelectedClassroom(cls);
    setClassroomStudents(cls.students || []); // Optimistic or partial
    fetchClassroomDetails(cls.id); // Fetch full details
    setIsManageModalOpen(true);
    setSelectedStudentToAdd("");
  };

  const handleAddStudent = async () => {
    if (!selectedStudentToAdd || !selectedClassroom) return;
    try {
      await apiAddStudentToClassroom(token, selectedClassroom.id, selectedStudentToAdd);
      fetchClassroomDetails(selectedClassroom.id);
      fetchClassrooms(); // Update list count
      setSelectedStudentToAdd("");
    } catch (err) {
      alert("Failed to add student: " + err.message);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Remove student from class?")) return;
    try {
      await apiRemoveStudentFromClassroom(token, selectedClassroom.id, studentId);
      fetchClassroomDetails(selectedClassroom.id);
      fetchClassrooms(); // Update list count
    } catch (err) {
      alert("Failed to remove student");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCreateClassroom(token, formData);
      setIsModalOpen(false);
      setFormData({ name: "", description: "" });
      fetchClassrooms();
      
      setSuccessMessage("Classroom created successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create classroom");
      setShowErrorModal(true);
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
                <button 
                  onClick={() => handleManageStudents(cls)}
                  className="flex-1 bg-gray-50 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-100 transition"
                >
                  Manage Students
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manage Students Modal */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title={selectedClassroom ? `Manage: ${selectedClassroom.name}` : "Manage Students"}
      >
        <div className="space-y-6">
          {/* Add Student Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Student to Class</label>
            <div className="flex space-x-2">
              <select
                className="flex-1 p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStudentToAdd}
                onChange={(e) => setSelectedStudentToAdd(e.target.value)}
              >
                <option value="">Select a student...</option>
                {allStudents
                  .filter(s => !classroomStudents.some(cs => cs.id === s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.username})
                    </option>
                  ))
                }
              </select>
              <button
                onClick={handleAddStudent}
                disabled={!selectedStudentToAdd}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Student List */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
              <span>Enrolled Students</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{classroomStudents.length}</span>
            </h3>
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              {classroomStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No students enrolled in this class.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 font-medium text-gray-600">Name</th>
                      <th className="p-3 font-medium text-gray-600">Username</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classroomStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{student.first_name} {student.last_name}</td>
                        <td className="p-3 text-gray-500">{student.username}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveStudent(student.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                            title="Remove from class"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsManageModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
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
