import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const ExamEditorContext = createContext();

export const useExamEditor = () => useContext(ExamEditorContext);

// Generate internal code: 6 character alphanumeric (letters + numbers)
const generateInternalCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Get or create a stable code for new exams (survives re-renders but not page refresh)
const getStableCode = () => {
  // Check sessionStorage for a temp code for unsaved exams
  const storedCode = sessionStorage.getItem('newExamCode');
  if (storedCode) return storedCode;
  
  const newCode = generateInternalCode();
  sessionStorage.setItem('newExamCode', newCode);
  return newCode;
};

export const ExamEditorProvider = ({ children, initialData = null }) => {
  // For existing exams (has id), use the code from the database
  // For new exams, use a stable code from sessionStorage
  const getInitialCode = () => {
    // If we have initialData with an id, this is an existing exam - use its code
    if (initialData?.id) {
      return initialData.code || initialData.access_code || '';
    }
    // New exam - use stable code from sessionStorage
    return getStableCode();
  };
  
  const initialCode = getInitialCode();
  
  const [exam, setExam] = useState(initialData ? {
    ...initialData,
    code: initialCode,
    access_code: initialCode
  } : {
    title: "",
    description: "",
    type: "academic", // 'academic' | 'general'
    code: initialCode,
    access_code: initialCode,
    status: "draft",
    modules_config: {
      listening: { enabled: true, duration: 30 },
      reading: { enabled: true, duration: 60 },
      writing: { enabled: true, duration: 60 },
      autoSubmit: true,
      fullscreen: false,
      autosaveInterval: 300
    },
    security_settings: {
      visibility_scope: "all", // 'all' | 'classroom'
      assigned_classrooms: [],
      security_mode: "log_only", // 'log_only' | 'disqualify'
      max_violations: 3
    }
  });
  
  // Clear the temp code from sessionStorage when exam is successfully saved (has an ID)
  const clearTempCode = () => {
    sessionStorage.removeItem('newExamCode');
  };

  // Listening: Fixed 4 sections
  // Reading: Fixed 3 passages
  // Writing: Fixed 2 tasks
  const [sections, setSections] = useState(initialData?.sections || []);
  const [questions, setQuestions] = useState(initialData?.questions || []);
  const [questionGroups, setQuestionGroups] = useState(initialData?.questionGroups || []);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]); // Track deleted question IDs for soft delete
  const [deletedGroupIds, setDeletedGroupIds] = useState([]); // Track deleted group IDs
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize structure if empty (for new exams only)
  useEffect(() => {
    if (sections.length === 0) {
      const task1Config = JSON.stringify({
        type: "graph",
        prompt: "",
        instructions: "",
        imageUrl: "",
        wordMinimum: 150,
        wordMaximum: null,
        duration: 20,
        modelAnswer: "",
        scoringCriteria: {
          taskResponse: { weight: 25, description: "How well the response addresses all parts of the task" },
          coherenceCohesion: { weight: 25, description: "Organization, paragraphing, and use of cohesive devices" },
          lexicalResource: { weight: 25, description: "Range and accuracy of vocabulary" },
          grammaticalRange: { weight: 25, description: "Range and accuracy of grammar" }
        }
      });

      const task2Config = JSON.stringify({
        type: "opinion",
        prompt: "",
        instructions: "",
        imageUrl: "",
        wordMinimum: 250,
        wordMaximum: null,
        duration: 40,
        modelAnswer: "",
        scoringCriteria: {
          taskResponse: { weight: 25, description: "How well the response addresses all parts of the task" },
          coherenceCohesion: { weight: 25, description: "Organization, paragraphing, and use of cohesive devices" },
          lexicalResource: { weight: 25, description: "Range and accuracy of vocabulary" },
          grammaticalRange: { weight: 25, description: "Range and accuracy of grammar" }
        }
      });

      const initialSections = [
        // Listening (Fixed 4)
        { id: 'l1', module_type: 'listening', section_order: 1, title: 'Listening Section 1', content: '', audio_url: '' },
        { id: 'l2', module_type: 'listening', section_order: 2, title: 'Listening Section 2', content: '', audio_url: '' },
        { id: 'l3', module_type: 'listening', section_order: 3, title: 'Listening Section 3', content: '', audio_url: '' },
        { id: 'l4', module_type: 'listening', section_order: 4, title: 'Listening Section 4', content: '', audio_url: '' },
        // Reading (Fixed 3)
        { id: 'r1', module_type: 'reading', section_order: 1, title: 'Reading Passage 1', content: '' },
        { id: 'r2', module_type: 'reading', section_order: 2, title: 'Reading Passage 2', content: '' },
        { id: 'r3', module_type: 'reading', section_order: 3, title: 'Reading Passage 3', content: '' },
        // Writing (Fixed 2) - with IELTS-style task configs
        { id: 'w1', module_type: 'writing', section_order: 1, title: 'Writing Task 1', content: '', task_config: task1Config },
        { id: 'w2', module_type: 'writing', section_order: 2, title: 'Writing Task 2', content: '', task_config: task2Config },
      ];
      setSections(initialSections);
    }
  }, []);

  const updateExam = (updates) => setExam(prev => ({ ...prev, ...updates }));
  
  const updateSection = (id, updates) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addQuestion = (sectionId, questionData) => {
    setQuestions(prev => [
      ...prev,
      { id: `temp_${Date.now()}`, section_id: sectionId, ...questionData }
    ]);
  };

  const updateQuestion = (id, updates) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id) => {
    // If it's a persisted question (UUID format), track it for soft delete
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      setDeletedQuestionIds(prev => [...prev, id]);
    }
    // Remove from local state either way
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const clearDeletedQuestionIds = () => {
    setDeletedQuestionIds([]);
  };

  // Question Group management for Listening
  const addQuestionGroup = (sectionId, groupData) => {
    setQuestionGroups(prev => [
      ...prev,
      { 
        id: `temp_group_${Date.now()}`, 
        section_id: sectionId,
        group_order: (prev.filter(g => g.section_id === sectionId).length || 0) + 1,
        ...groupData 
      }
    ]);
  };

  const updateQuestionGroup = (id, updates) => {
    setQuestionGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteQuestionGroup = (id) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      setDeletedGroupIds(prev => [...prev, id]);
    }
    setQuestionGroups(prev => prev.filter(g => g.id !== id));
  };

  const clearDeletedGroupIds = () => {
    setDeletedGroupIds([]);
  };

  const reorderQuestionGroups = (sectionId, newOrder) => {
    setQuestionGroups(prev => {
      const sectionGroups = prev.filter(g => g.section_id === sectionId);
      const otherGroups = prev.filter(g => g.section_id !== sectionId);
      const reordered = newOrder.map((groupId, idx) => {
        const group = sectionGroups.find(g => g.id === groupId);
        return group ? { ...group, group_order: idx + 1 } : null;
      }).filter(Boolean);
      return [...otherGroups, ...reordered];
    });
  };

  const updateIds = (mapping) => {
    if (!mapping) return;
    
    // We need to do this carefully.
    setSections(prevSections => {
      const newSections = prevSections.map(s => {
        const newId = mapping.sections && mapping.sections[s.id];
        return newId ? { ...s, id: newId } : s;
      });
      return newSections;
    });

    setQuestions(prevQuestions => {
      // First update section_ids based on section mapping
      let newQuestions = prevQuestions.map(q => {
        const newSectionId = mapping.sections && mapping.sections[q.section_id];
        return newSectionId ? { ...q, section_id: newSectionId } : q;
      });

      // Then update question IDs based on question mapping
      newQuestions = newQuestions.map(q => {
        const newId = mapping.questions && mapping.questions[q.id];
        return newId ? { ...q, id: newId } : q;
      });
      
      return newQuestions;
    });

    // Update question groups
    setQuestionGroups(prevGroups => {
      let newGroups = prevGroups.map(g => {
        const newSectionId = mapping.sections && mapping.sections[g.section_id];
        return newSectionId ? { ...g, section_id: newSectionId } : g;
      });

      newGroups = newGroups.map(g => {
        const newId = mapping.groups && mapping.groups[g.id];
        return newId ? { ...g, id: newId } : g;
      });

      return newGroups;
    });
  };

  // mode: 'strict' (for publishing) or 'draft' (for saving work in progress)
  const validate = (mode = 'draft') => {
    const errors = [];
    if (!exam.title) errors.push("Exam title is required");
    
    // Listening Validation
    const listeningSections = sections.filter(s => s.module_type === 'listening');
    listeningSections.forEach(s => {
      const sQuestions = questions.filter(q => q.section_id === s.id);
      
      // Strict checks
      if (mode === 'strict') {
        if (sQuestions.length !== 10) {
          errors.push(`${s.title} must have exactly 10 questions (Current: ${sQuestions.length})`);
        }
        if (!s.audio_url) errors.push(`${s.title} missing audio file`);
        if (!s.content) errors.push(`${s.title} missing transcript`);
      }
    });

    // Reading Validation
    const readingSections = sections.filter(s => s.module_type === 'reading');
    readingSections.forEach(s => {
      // Strict checks
      if (mode === 'strict') {
        if (!s.content || s.content.length < 50) errors.push(`${s.title} passage content is too short or missing`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  return (
    <ExamEditorContext.Provider value={{
      exam, updateExam,
      sections, updateSection,
      questions, addQuestion, updateQuestion, deleteQuestion,
      questionGroups, addQuestionGroup, updateQuestionGroup, deleteQuestionGroup, reorderQuestionGroups,
      deletedQuestionIds, clearDeletedQuestionIds,
      deletedGroupIds, clearDeletedGroupIds,
      validationErrors, validate, isSaving, updateIds, clearTempCode
    }}>
      {children}
    </ExamEditorContext.Provider>
  );
};
