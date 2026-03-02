import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { 
  apiListDeletedUsers, 
  apiRestoreUser,
  apiPermanentlyDeleteUser,
  apiListDeletedExams, 
  apiRestoreExam,
  apiPermanentlyDeleteExam,
  apiListDeletedQuestions,
  apiRestoreQuestion,
  apiPermanentlyDeleteQuestion
} from "../../api";
import { RefreshCw, User, FileText, CheckCircle, AlertCircle, Trash2, HelpCircle } from "lucide-react";
import Modal from "../../components/Modal/Modal";

export default function RecycleBin() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'exams', or 'questions'
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [deletedExams, setDeletedExams] = useState([]);
  const [deletedQuestions, setDeletedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToProcess, setItemToProcess] = useState(null); // { type: 'user' | 'exam' | 'question', action: 'restore' | 'delete', data: ... }
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [users, exams, questions] = await Promise.all([
        apiListDeletedUsers(token),
        apiListDeletedExams(token),
        apiListDeletedQuestions(token).catch(() => [])
      ]);
      setDeletedUsers(users || []);
      setDeletedExams(exams || []);
      setDeletedQuestions(questions || []);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load deleted items");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleActionClick = (action, type, item) => {
    setItemToProcess({ type, action, data: item });
    if (action === "restore") {
      setShowRestoreModal(true);
    } else {
      setShowDeleteModal(true);
    }
  };

  const confirmAction = async () => {
    if (!itemToProcess) return;
    const { action, type, data } = itemToProcess;

    try {
      if (action === "restore") {
        if (type === "user") {
          await apiRestoreUser(token, data.id);
          setSuccessMessage(`User ${data.username} restored successfully`);
        } else if (type === "exam") {
          await apiRestoreExam(token, data.id);
          setSuccessMessage(`Exam "${data.title}" restored successfully with a new access code`);
        } else if (type === "question") {
          await apiRestoreQuestion(token, data.id);
          setSuccessMessage(`Question restored successfully`);
        }
        setShowRestoreModal(false);
      } else {
        // Permanent Delete
        if (type === "user") {
          await apiPermanentlyDeleteUser(token, data.id);
          setSuccessMessage(`User ${data.username} permanently deleted`);
        } else if (type === "exam") {
          await apiPermanentlyDeleteExam(token, data.id);
          setSuccessMessage(`Exam "${data.title}" permanently deleted`);
        } else if (type === "question") {
          await apiPermanentlyDeleteQuestion(token, data.id);
          setSuccessMessage(`Question permanently deleted`);
        }
        setShowDeleteModal(false);
      }
      
      setItemToProcess(null);
      fetchData();
      setShowSuccessModal(true);
    } catch (err) {
      setShowRestoreModal(false);
      setShowDeleteModal(false);
      setErrorMessage(err.message || `Failed to ${action} item`);
      setShowErrorModal(true);
    }
  };

  const getItemDisplayName = () => {
    if (!itemToProcess) return "";
    const { type, data } = itemToProcess;
    if (type === "user") return data.username;
    if (type === "exam") return data.title;
    if (type === "question") return data.question_text?.substring(0, 50) + "..." || "Question";
    return "";
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
          <p className="text-gray-500 mt-1">Restore or permanently delete items</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`pb-4 px-6 font-medium text-sm transition-colors relative ${
            activeTab === "users"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("users")}
        >
          <div className="flex items-center space-x-2">
            <User size={18} />
            <span>Users ({deletedUsers.length})</span>
          </div>
        </button>
        <button
          className={`pb-4 px-6 font-medium text-sm transition-colors relative ${
            activeTab === "exams"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("exams")}
        >
          <div className="flex items-center space-x-2">
            <FileText size={18} />
            <span>Exams ({deletedExams.length})</span>
          </div>
        </button>
        <button
          className={`pb-4 px-6 font-medium text-sm transition-colors relative ${
            activeTab === "questions"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("questions")}
        >
          <div className="flex items-center space-x-2">
            <HelpCircle size={18} />
            <span>Questions ({deletedQuestions.length})</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading deleted items...</div>
        ) : (
          <>
            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-semibold border-b">
                    <tr>
                      <th className="p-4">Username</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deletedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">
                          No deleted users found.
                        </td>
                      </tr>
                    ) : (
                      deletedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-medium text-gray-900">{user.username}</td>
                          <td className="p-4">{user.first_name} {user.last_name}</td>
                          <td className="p-4">{user.email || "-"}</td>
                          <td className="p-4 capitalize">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleActionClick("restore", "user", user)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition"
                                title="Restore"
                              >
                                <RefreshCw size={16} />
                              </button>
                              <button
                                onClick={() => handleActionClick("delete", "user", user)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition"
                                title="Delete Permanently"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "exams" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-semibold border-b">
                    <tr>
                      <th className="p-4">Title</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deletedExams.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500">
                          No deleted exams found.
                        </td>
                      </tr>
                    ) : (
                      deletedExams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-medium text-gray-900">{exam.title}</td>
                          <td className="p-4 max-w-xs truncate">{exam.description || "-"}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold border border-red-100">
                              Deleted
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleActionClick("restore", "exam", exam)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition"
                                title="Restore"
                              >
                                <RefreshCw size={16} />
                              </button>
                              <button
                                onClick={() => handleActionClick("delete", "exam", exam)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition"
                                title="Delete Permanently"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "questions" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-semibold border-b">
                    <tr>
                      <th className="p-4">Question</th>
                      <th className="p-4">Exam</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deletedQuestions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500">
                          No deleted questions found.
                        </td>
                      </tr>
                    ) : (
                      deletedQuestions.map((question) => (
                        <tr key={question.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-medium text-gray-900 max-w-xs truncate">
                            {question.question_text?.substring(0, 80) || "No text"}...
                          </td>
                          <td className="p-4">{question.exam?.title || "-"}</td>
                          <td className="p-4 capitalize">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                              {question.question_type || "-"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleActionClick("restore", "question", question)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition"
                                title="Restore"
                              >
                                <RefreshCw size={16} />
                              </button>
                              <button
                                onClick={() => handleActionClick("delete", "question", question)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition"
                                title="Delete Permanently"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Confirm Restore"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to restore <strong>{getItemDisplayName()}</strong>?
          </p>
          {itemToProcess?.type === "exam" && (
            <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
              Note: A new access code will be generated for the restored exam.
            </p>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowRestoreModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Restore Item
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Forever Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Permanently"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle size={24} />
            <p className="font-medium">Warning: This action cannot be undone.</p>
          </div>
          <p className="text-gray-600">
            Are you sure you want to <strong>permanently delete</strong>{" "}
            <strong>{getItemDisplayName()}</strong>? This will remove all associated data forever.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
            >
              Delete Forever
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
