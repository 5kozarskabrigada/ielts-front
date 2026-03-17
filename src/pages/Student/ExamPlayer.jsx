import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import { 
  Clock, AlertTriangle, CheckCircle, ArrowRight, ChevronRight, 
  Maximize2, Volume2, FileText, Edit3, Send 
} from "lucide-react";
import ListeningRenderer from "./ListeningRenderer";
import ReadingRenderer from "./ReadingRenderer";
import ErrorBoundary from "../../components/ErrorBoundary";
import NotificationModal from "../../components/NotificationModal/NotificationModal";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function ExamPlayer() {
  const { id: examId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Exam data
  const [exam, setExam] = useState(null);
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Exam state
  const [currentModule, setCurrentModule] = useState("listening"); // listening, reading, writing
  const [currentPart, setCurrentPart] = useState(1); // Track which part of listening/reading is shown
  const [currentWritingTask, setCurrentWritingTask] = useState(1); // 1 = Task 1, 2 = Task 2
  const [answers, setAnswers] = useState({});
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Notification modal state
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'OK',
    showCancel: false
  });

  // Timer state
  const [moduleTimeRemaining, setModuleTimeRemaining] = useState({
    listening: 30 * 60,
    reading: 60 * 60,
    writing_task1: 20 * 60, // Task 1: 20 minutes
    writing_task2: 40 * 60  // Task 2: 40 minutes
  });
  const [timeSpent, setTimeSpent] = useState({
    listening: 0,
    reading: 0,
    writing_task1: 0,
    writing_task2: 0
  });

  // Fullscreen & violation state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState([]);
  const violationTimeoutRef = useRef(null);

  // Auto-save state
  const autoSaveTimeoutRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const lastSaveRef = useRef({});
  const answersRef = useRef({});
  const hasStartedRef = useRef(false);
  const examSubmittedRef = useRef(false);
  const currentModuleRef = useRef("listening");
  const currentPartRef = useRef(1);
  const currentWritingTaskRef = useRef(1);
  const timeSpentRef = useRef(timeSpent);

  // Module order
  const MODULE_ORDER = ["listening", "reading", "writing"];
  const MODULE_DURATIONS = { listening: 30, reading: 60, writing: 60 };

  // ============================================
  // FETCH EXAM DATA & CHECK STATUS
  // ============================================
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        // First, check if exam was already submitted or has autosave data
        const statusResponse = await fetch(`${API_URL}/exams/${examId}/status`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          
          // If already submitted, redirect to dashboard
          if (statusData.submitted) {
            setNotification({
              isOpen: true,
              type: 'warning',
              title: 'Exam Already Submitted',
              message: 'You have already submitted this exam. You cannot retake it.',
              confirmText: 'Go to Dashboard',
              onConfirm: () => navigate("/student/dashboard")
            });
            return;
          }

          // If there's autosave data, restore it
          if (statusData.has_autosave && statusData.autosave) {
            const autosave = statusData.autosave;
            console.log('[ExamPlayer] Restoring from autosave:', autosave);
            
            // Restore answers
            if (autosave.answers_data) {
              setAnswers(autosave.answers_data);
              lastSaveRef.current = autosave.answers_data;
            }

            // Restore module position
            if (autosave.current_module) {
              setCurrentModule(autosave.current_module);
            }

            // Restore part and writing task
            if (autosave.current_part) {
              setCurrentPart(autosave.current_part);
            }
            if (autosave.current_writing_task) {
              setCurrentWritingTask(autosave.current_writing_task);
            }

            // Restore time spent
            if (autosave.time_spent && typeof autosave.time_spent === 'object') {
              setTimeSpent(autosave.time_spent);
            }

            // Automatically start the exam (user is resuming)
            setHasStarted(true);
            await enterFullscreen().catch(err => console.warn('Fullscreen failed:', err));
          }
        }

        // Fetch exam data
        const response = await fetch(`${API_URL}/exams/${examId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Failed to load exam");
        }

        const data = await response.json();
        console.log('[ExamPlayer] Loaded exam data:', {
          sections: data.sections?.length || 0,
          questions: data.questions?.length || 0,
          questionGroups: data.questionGroups?.length || 0,
          summaryQuestions: data.questions?.filter(q => q.question_type === 'summary_completion').length || 0,
          summaryGroups: data.questionGroups?.filter(g => g.question_type === 'summary_completion').length || 0
        });
        console.log('[ExamPlayer] Summary completion questions:', data.questions?.filter(q => q.question_type === 'summary_completion'));
        setExam(data);
        setSections(data.sections || []);
        setQuestions(data.questions || []);
        setQuestionGroups(data.questionGroups || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token && examId) {
      fetchExamData();
    }
  }, [token, examId, navigate]);

  // ============================================
  // FULLSCREEN ENFORCEMENT
  // ============================================
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  const handleFullscreenChange = useCallback(() => {
    const isNowFullscreen = !!document.fullscreenElement;
    setIsFullscreen(isNowFullscreen);

    if (!isNowFullscreen && hasStarted && !examSubmitted) {
      // User exited fullscreen during exam - log violation
      logViolation("fullscreen_exit");
    }
  }, [hasStarted, examSubmitted]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [handleFullscreenChange]);

  // ============================================
  // VIOLATION LOGGING
  // ============================================
  const logViolation = useCallback(async (type) => {
    if (!hasStarted || examSubmitted) return;

    const violation = {
      type,
      timestamp: new Date().toISOString(),
      module: currentModule
    };

    setViolations(prev => [...prev, violation]);

    try {
      await fetch(`${API_URL}/exams/${examId}/violations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type, metadata: { module: currentModule } })
      });
    } catch (err) {
      console.error("Failed to log violation:", err);
    }

    // Show warning
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }
    violationTimeoutRef.current = setTimeout(() => {
      if (!document.fullscreenElement && hasStarted && !examSubmitted) {
        enterFullscreen();
      }
    }, 5000);
  }, [hasStarted, examSubmitted, currentModule, examId, token, enterFullscreen]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted && !examSubmitted) {
        logViolation("tab_switch");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hasStarted, examSubmitted, logViolation]);

  // ============================================
  // MODULE TIMER
  // ============================================
  useEffect(() => {
    if (!hasStarted || examSubmitted) return;

    const interval = setInterval(() => {
      // Determine the timer key based on current module and task
      const timerKey = currentModule === 'writing' 
        ? `writing_task${currentWritingTask}` 
        : currentModule;

      setModuleTimeRemaining(prev => {
        const newTime = Math.max(0, prev[timerKey] - 1);
        
        // Auto-redirect when time runs out
        if (newTime === 0) {
          // If in writing Task 1, move to Task 2
          if (currentModule === 'writing' && currentWritingTask === 1) {
            setCurrentWritingTask(2);
          } else {
            // Move to next module or finish
            const currentIndex = MODULE_ORDER.indexOf(currentModule);
            if (currentIndex < MODULE_ORDER.length - 1) {
              handleModuleSubmit(true); // Auto-submit and move to next
            } else {
              handleFinalSubmit(true, true); // Time's up on last module
            }
          }
        }

        return { ...prev, [timerKey]: newTime };
      });

      setTimeSpent(prev => ({
        ...prev,
        [timerKey]: prev[timerKey] + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, currentModule, currentWritingTask, examSubmitted]);

  // ============================================
  // AUTO-SAVE
  // ============================================
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  useEffect(() => {
    examSubmittedRef.current = examSubmitted;
  }, [examSubmitted]);

  useEffect(() => {
    currentModuleRef.current = currentModule;
  }, [currentModule]);

  useEffect(() => {
    currentPartRef.current = currentPart;
  }, [currentPart]);

  useEffect(() => {
    currentWritingTaskRef.current = currentWritingTask;
  }, [currentWritingTask]);

  useEffect(() => {
    timeSpentRef.current = timeSpent;
  }, [timeSpent]);

  const saveAnswers = useCallback((answerData) => {
    if (!hasStartedRef.current || examSubmittedRef.current) return Promise.resolve();

    const payloadAnswers = answerData ?? answersRef.current;
    const payloadAnswersSnapshot = payloadAnswers && typeof payloadAnswers === 'object'
      ? { ...payloadAnswers }
      : {};
    const payloadModuleSnapshot = currentModuleRef.current;
    const payloadPartSnapshot = currentPartRef.current;
    const payloadWritingTaskSnapshot = currentWritingTaskRef.current;
    const payloadTimeSpentSnapshot = timeSpentRef.current && typeof timeSpentRef.current === 'object'
      ? { ...timeSpentRef.current }
      : {};
    const saveTimestamp = new Date().toISOString();

    const saveTask = async () => {
      const response = await fetch(`${API_URL}/exams/${examId}/autosave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: payloadAnswersSnapshot,
          module: payloadModuleSnapshot,
          currentPart: payloadPartSnapshot,
          currentWritingTask: payloadWritingTaskSnapshot,
          timeSpent: payloadTimeSpentSnapshot,
          timestamp: saveTimestamp
        })
      });

      if (!response.ok) {
        let errorMessage = "Auto-save request failed";
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // ignore parse failure and use fallback message
        }
        throw new Error(errorMessage);
      }

      lastSaveRef.current = payloadAnswersSnapshot;
    };

    const queuedSave = saveQueueRef.current
      .catch(() => {})
      .then(saveTask);

    saveQueueRef.current = queuedSave.catch(() => {});
    return queuedSave;
  }, [examId, token]);

  const flushPendingAutosave = useCallback(async (answerData) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    await saveAnswers(answerData ?? answersRef.current);
  }, [saveAnswers]);

  const setAnswersWithAutosave = useCallback((updater) => {
    setAnswers((previousAnswers) => {
      const nextAnswers = typeof updater === 'function' ? updater(previousAnswers) : updater;
      answersRef.current = nextAnswers;
      return nextAnswers;
    });
  }, []);

  // ============================================
  // AUTO-SAVE
  // ============================================
  // Auto-save on answer change - immediate save
  useEffect(() => {
    if (!hasStarted || examSubmitted) return;
    if (JSON.stringify(answers) === JSON.stringify(lastSaveRef.current)) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Save shortly after answer changes to avoid request spam while typing
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveAnswers(answersRef.current).catch((err) => {
        console.error("Debounced auto-save failed:", err);
      });
    }, 300);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [answers, hasStarted, examSubmitted, saveAnswers]);

  // Auto-save on module/part/task change
  useEffect(() => {
    if (!hasStarted || examSubmitted) return;
    
    // Save immediately when navigation changes
    saveAnswers(answersRef.current).catch((err) => {
      console.error("Navigation auto-save failed:", err);
    });
  }, [hasStarted, examSubmitted, currentModule, currentPart, currentWritingTask, saveAnswers]);

  // Periodic auto-save (every 15 seconds) to ensure time spent is saved
  useEffect(() => {
    if (!hasStarted || examSubmitted) return;

    const periodicSave = setInterval(() => {
      saveAnswers(answersRef.current).catch((err) => {
        console.error("Periodic auto-save failed:", err);
      });
    }, 15000); // Save every 15 seconds

    return () => clearInterval(periodicSave);
  }, [hasStarted, examSubmitted, saveAnswers]);

  // ============================================
  // START EXAM
  // ============================================
  const handleStartExam = async () => {
    await enterFullscreen();
    setHasStarted(true);

    // Log exam start
    try {
      await fetch(`${API_URL}/exams/${examId}/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          event_type: "exam_started",
          metadata: { module: "listening" }
        })
      });
    } catch (err) {
      console.error("Failed to log exam start:", err);
    }
  };

  const confirmMoveToTask2 = useCallback((message = 'Do you want to move to Task 2?') => {
    const shouldMove = window.confirm(message);
    if (shouldMove) {
      setCurrentWritingTask(2);
    }
    return shouldMove;
  }, []);

  // ============================================
  // MODULE SUBMISSION
  // ============================================
  const handleModuleSubmit = async (autoSubmit = false, bypassConfirmation = false) => {
    if (isSubmitting) return;

    if (!autoSubmit && !bypassConfirmation && (currentModule === 'listening' || currentModule === 'reading')) {
      const moduleLabel = currentModule.charAt(0).toUpperCase() + currentModule.slice(1);

      setNotification({
        isOpen: true,
        type: 'warning',
        title: `Submit ${moduleLabel}?`,
        message: `Are you sure you want to submit ${moduleLabel}? Once submitted, you cannot return to this module or change its answers.`,
        confirmText: 'Sure',
        showCancel: true,
        onConfirm: () => {
          setTimeout(() => {
            setNotification({
              isOpen: true,
              type: 'warning',
              title: `Final Confirmation`,
              message: `This action is final for ${moduleLabel}. Click Submit Module to continue to the next module.`,
              confirmText: 'Submit Module',
              showCancel: true,
              onConfirm: () => handleModuleSubmit(false, true)
            });
          }, 0);
        }
      });
      return;
    }

    // If in writing module Task 1, warn and move to Task 2 instead  
    if (currentModule === 'writing' && currentWritingTask === 1) {
      confirmMoveToTask2('You are still on Task 1. Do you want to move to Task 2?');
      return;
    }

    // Save answers before moving to next module
    try {
      await flushPendingAutosave(answersRef.current);
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: `Could not save your latest answers before module submission: ${err.message}`,
        confirmText: 'OK'
      });
      return;
    }

    const currentIndex = MODULE_ORDER.indexOf(currentModule);
    if (currentIndex < MODULE_ORDER.length - 1) {
      const nextModule = MODULE_ORDER[currentIndex + 1];
      setCurrentModule(nextModule);
      setCurrentPart(1); // Reset to part 1 for new module
      setCurrentWritingTask(1); // Reset to task 1 for writing

      // Log module completion
      try {
        await fetch(`${API_URL}/exams/${examId}/log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            event_type: "module_completed",
            metadata: { 
              module: currentModule, 
              auto_submit: autoSubmit,
              time_spent_writing_task1: timeSpent.writing_task1 || 0,
              time_spent_writing_task2: timeSpent.writing_task2 || 0,
              time_spent: currentModule === 'writing' 
                ? (timeSpent.writing_task1 || 0) + (timeSpent.writing_task2 || 0)
                : timeSpent[currentModule]
            }
          })
        });
      } catch (err) {
        console.error("Failed to log module completion:", err);
      }
    }
  };

  // ============================================
  // FINAL SUBMISSION
  // ============================================
  const handleFinalSubmit = async (bypassConfirmation = false, autoSubmit = false) => {
    if (isSubmitting || examSubmitted) return;

    if (!bypassConfirmation && !autoSubmit) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Submit Final Exam?',
        message: 'Are you sure you want to submit your final exam? Once submitted, you cannot return to previous modules or edit any answers.',
        confirmText: 'Sure',
        showCancel: true,
        onConfirm: () => {
          setTimeout(() => {
            setNotification({
              isOpen: true,
              type: 'warning',
              title: 'Final Confirmation',
              message: 'This action is final. Click Submit Final to lock and submit all answers now.',
              confirmText: 'Submit Final',
              showCancel: true,
              onConfirm: () => handleFinalSubmit(true, false)
            });
          }, 0);
        }
      });
      return;
    }

    setIsSubmitting(true);
    const latestAnswers = answersRef.current;

    const completeSubmissionUI = async (successMessage) => {
      setExamSubmitted(true);

      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (fullscreenErr) {
          console.warn("Failed to exit fullscreen after submission:", fullscreenErr);
        }
      }

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Exam Submitted Successfully!',
        message: successMessage,
        confirmText: 'Continue'
      });
    };
    
    // Final save before submission
    try {
      await flushPendingAutosave(latestAnswers);
    } catch (saveErr) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: `Could not save your latest answers before final submission: ${saveErr.message}`,
        confirmText: 'OK'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Aggregate writing task times into total writing time
      const submissionTimeSpent = {
        listening: timeSpent.listening,
        reading: timeSpent.reading,
        writing: (timeSpent.writing_task1 || 0) + (timeSpent.writing_task2 || 0)
      };

      const response = await fetch(`${API_URL}/exams/${examId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: latestAnswers,
          time_spent_by_module: submissionTimeSpent,
          violations: violations.length
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Submission failed");
      }

      await completeSubmissionUI('Your exam has been submitted. You will now be redirected to the results page.');
    } catch (err) {
      try {
        const statusResponse = await fetch(`${API_URL}/exams/${examId}/status`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.submitted) {
            await completeSubmissionUI('Your exam submission was confirmed. You will now be redirected to the results page.');
            return;
          }
        }
      } catch (statusErr) {
        console.error("Failed to verify submission status after submit error:", statusErr);
      }

      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Submission Failed',
        message: `Failed to submit your exam: ${err.message}\n\nPlease try again or contact support if the issue persists.`,
        confirmText: 'OK'
      });
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get all sections for current module
  const allModuleSections = useMemo(
    () => sections.filter(s => s.module_type === currentModule).sort((a, b) => a.section_order - b.section_order),
    [sections, currentModule]
  );

  const currentSection = useMemo(() => {
    if (currentModule === "listening" || currentModule === "reading") {
      return allModuleSections[currentPart - 1] || null;
    }
    return null;
  }, [currentModule, allModuleSections, currentPart]);

  const currentSections = useMemo(
    () => (currentModule === "writing" ? allModuleSections : (currentSection ? [currentSection] : [])),
    [currentModule, allModuleSections, currentSection]
  );

  const currentQuestions = useMemo(() => {
    return questions.filter(q => {
      const qSection = sections.find(s => s.id === q.section_id);
      if (currentModule === "listening" || currentModule === "reading") {
        return qSection?.id === currentSection?.id;
      }
      return qSection?.module_type === currentModule;
    });
  }, [questions, sections, currentModule, currentSection?.id]);

  const currentSectionQuestionGroups = useMemo(() => {
    if (!currentSection) return [];
    return questionGroups.filter(g => g.section_id === currentSection.id);
  }, [questionGroups, currentSection?.id]);

  const currentGlobalOffset = useMemo(() => {
    return allModuleSections.slice(0, currentPart - 1).reduce((sum, s) => {
      const dbCount = questions.filter(q => q.section_id === s.id).length;
      const sGroups = questionGroups.filter(g => g.section_id === s.id);
      const maxEnd = sGroups.reduce((m, g) => Math.max(m, g.question_range_end || 0), 0);
      return sum + Math.max(dbCount, maxEnd);
    }, 0);
  }, [allModuleSections, currentPart, questions, questionGroups]);

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Exam</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // SUBMISSION COMPLETE
  // ============================================
  if (examSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Exam Submitted!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your exam has been successfully submitted. Your instructor will review your responses and provide results.
          </p>
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-800 mb-4">Exam Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Listening</p>
                <p className="font-bold text-gray-900">{Math.floor(timeSpent.listening / 60)} min</p>
              </div>
              <div>
                <p className="text-gray-500">Reading</p>
                <p className="font-bold text-gray-900">{Math.floor(timeSpent.reading / 60)} min</p>
              </div>
              <div>
                <p className="text-gray-500">Writing</p>
                <p className="font-bold text-gray-900">{Math.floor(timeSpent.writing / 60)} min</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // START SCREEN
  // ============================================
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{exam?.title || "IELTS Exam"}</h1>
            <p className="text-blue-100">{exam?.description}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Modules Info */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Exam Structure</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <Volume2 size={24} className="text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Listening</p>
                        <p className="text-sm text-gray-600">4 sections, 40 questions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{MODULE_DURATIONS.listening} min</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <FileText size={24} className="text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Reading</p>
                        <p className="text-sm text-gray-600">3 passages, 40 questions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{MODULE_DURATIONS.reading} min</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <Edit3 size={24} className="text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Writing</p>
                        <p className="text-sm text-gray-600">2 tasks</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{MODULE_DURATIONS.writing} min</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h4 className="font-bold text-amber-900 mb-3 flex items-center">
                  <AlertTriangle size={20} className="mr-2" />
                  Important Instructions
                </h4>
                <ul className="space-y-2 text-sm text-amber-900">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>The exam will enter fullscreen mode. Do not exit or switch tabs.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Each module has a time limit. You'll be automatically moved to the next module when time expires.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Your answers are automatically saved. You cannot return to previous modules.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Violations (tab switches, exiting fullscreen) will be logged.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Start Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleStartExam}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg"
              >
                <Maximize2 size={24} />
                <span>Start Exam (Fullscreen)</span>
                <ArrowRight size={24} />
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                By starting, you agree to follow exam rules and regulations
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN EXAM INTERFACE
  // ============================================
  const timerKey = currentModule === 'writing' ? `writing_task${currentWritingTask}` : currentModule;
  const timeColor = moduleTimeRemaining[timerKey] < 300 ? "text-red-600" : "text-gray-700";
  const isLastModule = currentModule === MODULE_ORDER[MODULE_ORDER.length - 1] && 
                       (currentModule !== 'writing' || currentWritingTask === 2);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-bold">{exam?.title}</h2>
          <div className="flex items-center space-x-4 text-sm">
            <span className="px-3 py-1 bg-white/10 rounded-full capitalize">{currentModule}</span>
            {violations.length > 0 && (
              <span className="px-3 py-1 bg-red-500/20 text-red-200 rounded-full flex items-center space-x-1">
                <AlertTriangle size={14} />
                <span>{violations.length} violations</span>
              </span>
            )}
            {/* Audio Player in Header - Listening Only */}
            {currentModule === "listening" && (currentSection?.audio_url || exam?.modules_config?.listening?.global_audio_url) && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full">
                <Volume2 size={16} className="text-blue-300" />
                <span className="text-xs">Audio Playing</span>
                <audio 
                  autoPlay
                  loop={false}
                  controlsList="nodownload nofullscreen noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  src={currentSection.audio_url || exam?.modules_config?.listening?.global_audio_url}
                  style={{ display: 'none' }}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className={`flex items-center space-x-2 font-bold text-lg text-white`}>
            <Clock size={20} />
            <span>{formatTime(moduleTimeRemaining[timerKey])}</span>
            {currentModule === 'writing' && (
              <span className="text-sm font-normal ml-2">Task {currentWritingTask}</span>
            )}
          </div>
          
          <button
            onClick={isLastModule ? () => handleFinalSubmit(false, false) : () => handleModuleSubmit(false)}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center space-x-2 transition disabled:opacity-50"
          >
            <span>{isLastModule ? "Submit Exam" : `Submit ${currentModule}`}</span>
            {isLastModule ? <Send size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      {/* Module Content */}
      <div className="flex-1 overflow-hidden">
        {/* Listening Module */}
        {currentModule === "listening" && currentSection && (
          <div className="h-full flex flex-col p-6">
            {!currentSection.audio_url && !exam?.modules_config?.listening?.global_audio_url && (
              <div className="bg-yellow-50 rounded-xl border-2 border-yellow-200 p-4 mb-6">
                <p className="text-yellow-800 text-sm">⚠️ No audio file attached for this section</p>
              </div>
            )}

            {/* Questions - Full height */}
            <div className="flex-1 overflow-y-auto">
              <ErrorBoundary>
                <ListeningRenderer 
                  sections={[currentSection]}
                  questions={currentQuestions}
                  questionGroups={currentSectionQuestionGroups}
                  answers={answers}
                  setAnswers={setAnswersWithAutosave}
                  partNumber={currentPart}
                  globalOffset={currentGlobalOffset}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Reading Module */}
        {currentModule === "reading" && currentSection && (
          <div className="h-full min-h-0 flex flex-col p-6 overflow-hidden">
            <div className="max-w-7xl mx-auto w-full h-full min-h-0">
              <ErrorBoundary>
                <ReadingRenderer 
                  section={currentSection}
                  partNumber={currentPart}
                  globalOffset={currentGlobalOffset}
                  questions={currentQuestions}
                  questionGroups={currentSectionQuestionGroups}
                  answers={answers}
                  setAnswers={setAnswersWithAutosave}
                  examId={examId}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Writing Module */}
        {currentModule === "writing" && (
          <div className="h-full flex flex-col p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900" style={{color: 'rgb(41, 69, 99)', fontFamily: 'Montserrat, Helvetica, Arial, sans-serif'}}>
                  Writing Module - Task {currentWritingTask}
                </h3>
                <div className="text-sm text-gray-600">
                  {currentWritingTask === 1 ? '20 minutes' : '40 minutes'}
                </div>
              </div>
            
            <div className="flex-1">
              {currentSections
                .filter((_, idx) => idx + 1 === currentWritingTask) // Show only current task
                .map((section, idx) => {
                  let taskConfig;
                  try {
                    taskConfig = section.task_config ? JSON.parse(section.task_config) : {};
                  } catch {
                    taskConfig = {};
                  }
                  const actualTaskNumber = currentWritingTask;
                  const taskKey = `writing_task_${actualTaskNumber}`;
                  return (
                    <div key={section.id} className="bg-white rounded-xl border-2 border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-xl text-gray-900" style={{fontFamily: 'Montserrat, Helvetica, Arial, sans-serif'}}>
                            Task {actualTaskNumber}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {actualTaskNumber === 1 ? 'Minimum 150 words' : 'Minimum 250 words'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-600">
                          Word count: {(answers[taskKey] || '').split(/\s+/).filter(Boolean).length}
                        </div>
                      </div>

                      {/* Task Prompt */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div 
                          className="prose prose-sm max-w-none"
                          style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
                          dangerouslySetInnerHTML={{ __html: taskConfig.prompt || section.content }}
                        />
                      </div>

                      {/* Task 1 Image (graph/chart/map/process) */}
                      {taskConfig.imageUrl && (
                        <div className="mb-4 flex justify-center">
                          <img 
                            src={taskConfig.imageUrl} 
                            alt="Task visual" 
                            className="max-w-full rounded-lg border border-gray-200"
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                          />
                        </div>
                      )}

                      {/* Response Area */}
                      <textarea
                        className="w-full min-h-[250px] p-4 border-2 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 outline-none"
                        style={{ 
                          fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                          userSelect: 'text',
                          WebkitUserSelect: 'text'
                        }}
                        placeholder={`Write your response for Task ${actualTaskNumber} here...`}
                        value={answers[taskKey] || ""}
                        onCopy={(e) => e.stopPropagation()}
                        onCut={(e) => e.stopPropagation()}
                        onPaste={(e) => e.stopPropagation()}
                        onChange={(e) => setAnswersWithAutosave(prev => ({ ...prev, [taskKey]: e.target.value }))}
                      />
                      
                      {/* Task 1 -> Task 2 Navigation */}
                      {currentWritingTask === 1 && (
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={() => confirmMoveToTask2('Do you want to move to Task 2?')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-2 transition"
                          >
                            <span>Continue to Task 2</span>
                            <ArrowRight size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center gap-x-4 gap-y-2 flex-wrap">
          {(currentModule === "listening" || currentModule === "reading") && (() => {
            let cumulativeOffset = 0;
            const accentBg = currentModule === "listening" ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';
            const accentHover = currentModule === "listening" ? 'hover:text-blue-600 hover:bg-gray-100' : 'hover:text-emerald-600 hover:bg-gray-100';
            return allModuleSections.map((section, partIdx) => {
              const partNumber = partIdx + 1;
              const globalOffset = cumulativeOffset;
              const sectionGroups = questionGroups.filter(g => g.section_id === section.id).sort((a, b) => (a.question_range_start || 0) - (b.question_range_start || 0));
              const partQuestions = questions.filter(q => q.section_id === section.id).sort((a, b) => a.question_number - b.question_number);
              const isCurrentPart = partNumber === currentPart;
              
              const maxGroupEnd = sectionGroups.reduce((max, g) => Math.max(max, g.question_range_end || 0), 0);
              cumulativeOffset += Math.max(partQuestions.length, maxGroupEnd);

              // Build footer items: individual buttons for most questions, range for multiple_choice_multiple groups
              const items = [];
              const mcmGroupIds = new Set();
              sectionGroups.forEach(group => {
                if (group.question_type === 'multiple_choice_multiple') {
                  mcmGroupIds.add(group.id);
                  const groupQs = partQuestions.filter(q => q.question_number >= group.question_range_start && q.question_number <= group.question_range_end);
                  const start = globalOffset + group.question_range_start;
                  const end = globalOffset + group.question_range_end;
                  const isAnyAnswered = groupQs.some(q => answers[q.id] !== undefined && answers[q.id] !== '');
                  const firstQ = groupQs[0];
                  items.push({ type: 'range', start, end, isAnyAnswered, firstQ, groupId: group.id, sortKey: group.question_range_start });
                }
              });

              // Add individual question buttons (skip questions that belong to mcm groups)
              partQuestions.forEach(q => {
                const belongsToMcm = sectionGroups.some(g => mcmGroupIds.has(g.id) && q.question_number >= g.question_range_start && q.question_number <= g.question_range_end);
                if (!belongsToMcm) {
                  items.push({ type: 'single', question: q, sortKey: q.question_number });
                }
              });

              // Add synthetic entries for summary_completion blanks not in partQuestions
              sectionGroups.forEach(group => {
                if (group.question_type === 'summary_completion' && group.summary_data?.text) {
                  const blankCount = (group.summary_data.text.match(/\[BLANK\]/g) || []).length;
                  for (let i = 0; i < blankCount; i++) {
                    const qNum = group.question_range_start + i;
                    if (!partQuestions.find(q => q.question_number === qNum)) {
                      const syntheticId = `summary_placeholder_${group.id}_${i}`;
                      items.push({ type: 'single', question: { id: syntheticId, question_number: qNum }, sortKey: qNum });
                    }
                  }
                }
              });

              items.sort((a, b) => a.sortKey - b.sortKey);

              return (
                <div key={section.id} className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPart(partNumber)}
                    className={`text-sm font-semibold transition cursor-pointer px-3 py-1.5 rounded-lg ${
                      isCurrentPart ? accentBg : `text-gray-700 ${accentHover}`
                    }`}
                  >
                    Part {partNumber}
                  </button>
                  <div className="flex space-x-1">
                    {items.map((item) => {
                      if (item.type === 'single') {
                        const q = item.question;
                        const globalNum = globalOffset + q.question_number;
                        const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setCurrentPart(partNumber);
                              setTimeout(() => {
                                const el = document.querySelector(`[data-question-id="${q.id}"]`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition hover:scale-110 ${
                              isAnswered ? 'bg-green-400 text-white hover:bg-green-500' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                            title={`Question ${globalNum}${isAnswered ? ' - Answered' : ''}`}
                          >
                            {globalNum}
                          </button>
                        );
                      } else {
                        const rangeText = `${item.start}-${item.end}`;
                        return (
                          <button
                            key={`group-${item.groupId}`}
                            onClick={() => {
                              setCurrentPart(partNumber);
                              setTimeout(() => {
                                const el = item.firstQ && document.querySelector(`[data-question-id="${item.firstQ.id}"]`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className={`h-7 px-2 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition hover:scale-110 ${
                              item.isAnyAnswered ? 'bg-green-400 text-white hover:bg-green-500' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                            title={`Questions ${rangeText}${item.isAnyAnswered ? ' - Answered' : ''}`}
                          >
                            {rangeText}
                          </button>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            });
          })()}

          {currentModule === "writing" && currentSections.map((section, idx) => {
            const taskNumber = idx + 1;
            const taskKey = `writing_task_${taskNumber}`;
            const isAnswered = (answers[taskKey] || '').trim().length > 0;
            const isCurrentTask = taskNumber === currentWritingTask;
            
            return (
              <button 
                key={section.id} 
                onClick={() => setCurrentWritingTask(taskNumber)}
                className={`flex items-center space-x-3 cursor-pointer transition ${
                  isCurrentTask ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <span className={`text-sm font-semibold min-w-[60px] ${
                  isCurrentTask ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  Task {taskNumber}
                </span>
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isAnswered ? 'bg-green-100 border-green-400' : isCurrentTask ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-300'
                  }`}
                >
                  {isAnswered && <span className="text-green-600 text-xs">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Exit Warning */}
      {!isFullscreen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md text-center">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Fullscreen Required</h2>
            <p className="text-gray-600 mb-6">
              You must remain in fullscreen mode during the exam. This violation has been logged.
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm}
        confirmText={notification.confirmText}
        showCancel={notification.showCancel || false}
      />
    </div>
  );
}
