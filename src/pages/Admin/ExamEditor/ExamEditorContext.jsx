import React, { createContext, useContext, useState, useEffect } from "react";

const ExamEditorContext = createContext();

export const useExamEditor = () => useContext(ExamEditorContext);

export const ExamEditorProvider = ({ children, initialData = null }) => {
  const [exam, setExam] = useState(initialData || {
    title: "",
    type: "academic", // 'academic' | 'general'
    code: "",
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

  // Listening: Fixed 4 sections
  // Reading: Fixed 3 passages
  // Writing: Fixed 2 tasks
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]); // Track deleted question IDs for soft delete
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize structure if empty
  useEffect(() => {
    if (sections.length === 0) {
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
        // Writing (Fixed 2)
        { id: 'w1', module_type: 'writing', section_order: 1, title: 'Writing Task 1', content: '' },
        { id: 'w2', module_type: 'writing', section_order: 2, title: 'Writing Task 2', content: '' },
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

  const updateIds = (mapping) => {
    if (!mapping) return;
    
    // Update sections
    if (mapping.sections) {
      setSections(prev => prev.map(s => {
        const newId = mapping.sections[s.id];
        return newId ? { ...s, id: newId } : s;
      }));
      
      // Also update section_id in questions if the section ID changed
      // But wait, if we update section ID, we must update question's section_id too
      // The questions state relies on section_id to filter.
      
      // Actually, let's do questions first or handle it carefully.
      // If we update section ID 'l1' -> 'uuid-1', all questions with section_id 'l1' must now have 'uuid-1'.
    }

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
      deletedQuestionIds, clearDeletedQuestionIds,
      validationErrors, validate, isSaving, updateIds
    }}>
      {children}
    </ExamEditorContext.Provider>
  );
};
