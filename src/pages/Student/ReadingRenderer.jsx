// Reading Module Renderer - Matches Preview Mode Format
import React, { useState, useEffect, useRef } from "react";

const accentColor = 'rgb(55, 133, 77)'; // Green for reading

// Render HTML safely
const RenderHtml = ({ html }) => {
  return <span dangerouslySetInnerHTML={{ __html: html || '' }} />;
};

// Blank input component for fill-in questions
const BlankInput = ({ questionNumber, value, onChange }) => (
  <span className="inline-flex items-center gap-2 mx-1 my-0.5">
    <span 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        minWidth: '28px',
        minHeight: '28px',
        backgroundColor: accentColor,
        borderRadius: '50%',
        color: 'white',
        fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 600
      }}
    >
      {questionNumber}
    </span>
    <input 
      type="text" 
      value={value || ''}
      onChange={onChange}
      onCopy={(e) => e.stopPropagation()}
      onCut={(e) => e.stopPropagation()}
      onPaste={(e) => e.stopPropagation()}
      style={{ 
        width: '200px',
        height: '32px',
        padding: '0 20px 0 10px',
        border: '1px solid rgb(189, 197, 207)',
        borderRadius: '100px',
        fontSize: '14px',
        fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
        boxShadow: 'rgba(0, 0, 0, 0.075) 0px 1px 1px 0px inset',
        outline: 'none',
        backgroundColor: 'white',
        userSelect: 'text',
        WebkitUserSelect: 'text'
      }}
    />
  </span>
);

// Detect paragraph letters from content
const detectParagraphLetters = (content) => {
  if (!content) return [];
  const textOnly = content.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\r/g, '\n');
  const lines = textOnly.split('\n');
  const letters = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([A-Z])[\.\)]\s+/);
    if (match) {
      letters.push(match[1]);
    }
  }
  
  return [...new Set(letters)].sort();
};

// Render question group based on type
const renderQuestionGroup = (group, groupQuestions, globalOffset, answers, setAnswers, paragraphLetters, saveAnswers = null) => {
  const type = group.question_type;

  // True/False/Not Given
  if (type === 'true_false_not_given' || type === 'yes_no_not_given') {
    const isYesNo = type === 'yes_no_not_given';
    return (
      <div>
        <div style={{ border: '1px solid rgb(221, 221, 221)', borderRadius: '10px', padding: '10px', marginBottom: '20px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              <tr style={{ backgroundColor: 'rgb(245, 245, 245)' }}>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', width: '148.5px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <strong>{isYesNo ? 'YES.' : 'TRUE.'}</strong>
                </td>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', verticalAlign: 'top' }}>
                  if the statement agrees with the information
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <strong>{isYesNo ? 'NO.' : 'FALSE.'}</strong>
                </td>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', verticalAlign: 'top' }}>
                  if the statement contradicts the information
                </td>
              </tr>
              <tr style={{ backgroundColor: 'rgb(245, 245, 245)' }}>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <strong>NOT GIVEN.</strong>
                </td>
                <td style={{ padding: '12px 15px', borderTop: '1px solid rgb(221, 221, 221)', borderBottom: '1px solid rgb(221, 221, 221)', verticalAlign: 'top' }}>
                  if there is no information on this
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          {groupQuestions.map((q, idx) => {
            const qNum = globalOffset + q.question_number;
            return (
              <div key={q.id} className="flex items-center gap-4 py-1">
                <span className="font-bold text-gray-700" style={{ minWidth: '35px', display: 'inline-block', fontSize: '15px' }}>{qNum}.</span>
                <div className="flex items-center gap-2 flex-1">
                  <select 
                    value={answers[q.id] || ''}
                    onChange={e => {
                      setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                      if (saveAnswers) saveAnswers();
                    }}
                    style={{
                      width: '100px', 
                      height: '32px', 
                      padding: '0 20px 0 10px', 
                      border: '1px solid rgb(189, 197, 207)', 
                      borderRadius: '100px', 
                      fontSize: '14px', 
                      fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif'
                    }}
                  >
                    <option value=""></option>
                    <option value="true">{isYesNo ? 'YES' : 'TRUE'}</option>
                    <option value="false">{isYesNo ? 'NO' : 'FALSE'}</option>
                    <option value="not_given">NOT GIVEN</option>
                  </select>
                  <p className="flex-1"><RenderHtml html={q.question_text || ''} /></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Multiple Choice
  if (type === 'multiple_choice_single' || type === 'multiple_choice_multiple') {
    const isMultiple = type === 'multiple_choice_multiple';
    
    return groupQuestions.map((q, idx) => {
      const qNum = globalOffset + q.question_number;
      return (
        <div key={q.id} className="py-3" style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}>
          <p style={{
            color: 'rgb(40, 40, 40)',
            fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '17px',
            fontWeight: isMultiple ? 400 : 700,
            lineHeight: '26px',
            marginTop: '12px',
            marginBottom: '12px'
          }}>
            {!isMultiple && `${qNum}. `}<RenderHtml html={q.question_text || ''} />
          </p>
          <div className="ml-4 space-y-2">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => {
              const text = q[`option_${letter.toLowerCase()}`];
              if (!text) return null;
              const isChecked = isMultiple 
                ? (answers[q.id] || '').includes(letter)
                : answers[q.id] === letter;
              
              return (
                <label key={letter} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-50 rounded-lg">
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgb(223, 223, 223)',
                    color: 'rgb(41, 69, 99)',
                    fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginRight: '8px'
                  }}>
                    {letter}
                  </span>
                  <input 
                    type={isMultiple ? "checkbox" : "radio"} 
                    name={isMultiple ? undefined : `q${q.id}`}
                    checked={isChecked}
                    onChange={(e) => {
                      if (isMultiple) {
                        const current = answers[q.id] || '';
                        const newValue = e.target.checked
                          ? current + letter
                          : current.replace(letter, '');
                        setAnswers(prev => ({ ...prev, [q.id]: newValue }));
                      } else {
                        setAnswers(prev => ({ ...prev, [q.id]: letter }));
                      }
                      if (saveAnswers) saveAnswers();
                    }}
                    className="w-4 h-4"
                  />
                  <span style={{ marginLeft: '4px' }}><RenderHtml html={text} /></span>
                </label>
              );
            })}
          </div>
        </div>
      );
    });
  }

  // Matching Headings and similar types
  if (type === 'matching_headings' || type === 'matching_information' || type === 'matching_features' || type === 'matching_sentence_endings') {
    // Headings/People list and example
    const toRoman = n => ['','i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv'][n] || n;
    const normalizeOptionItems = (optionList = []) => optionList
      .map((item) => (typeof item === 'string' ? { value: item } : item))
      .filter(item => item && String(item.value || '').trim() !== '');

    const headings = normalizeOptionItems(group.headings_list || []);
    const people = normalizeOptionItems(group.people_list || []);
    const example = group.example || { paragraph: '', answer: '' };

    // Determine numbering style for headings
    const useLettersForHeadings = String(group.matching_style || 'roman').toLowerCase() === 'letters';

    // Determine if this is a people-matching type
    const isPeople = type === 'matching_features';

    const passageLetterOptions = paragraphLetters && paragraphLetters.length > 0
      ? paragraphLetters
      : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    // Letters mode for matching_headings: no headings list, just pick passage letter + statement text
    if (type === 'matching_headings' && useLettersForHeadings) {
      return (
        <div className="mb-6">
          <div className="space-y-3">
            {groupQuestions.map((q) => {
              const qNum = globalOffset + q.question_number;
              return (
                <div key={q.id} className="flex items-center gap-3 py-1">
                  <span className="font-bold text-gray-700" style={{ minWidth: '35px', fontSize: '15px' }}>{qNum}.</span>
                  <select
                    value={answers[q.id] || ''}
                    onChange={e => {
                      setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                      if (saveAnswers) saveAnswers();
                    }}
                    onCopy={(e) => e.stopPropagation()}
                    onCut={(e) => e.stopPropagation()}
                    onPaste={(e) => e.stopPropagation()}
                    style={{
                      width: '100px',
                      height: '32px',
                      padding: '0 20px 0 10px',
                      border: '1px solid rgb(189, 197, 207)',
                      borderRadius: '100px',
                      fontSize: '15px',
                      fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                      userSelect: 'text',
                      WebkitUserSelect: 'text'
                    }}
                  >
                    <option value=""></option>
                    {passageLetterOptions.map((letter) => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>
                  <div className="flex-1 text-gray-800" style={{ fontSize: '15px' }}>
                    <RenderHtml html={q.question_text || ''} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        {/* Headings/People List */}
        <div className="mb-4">
          <div className="font-semibold text-gray-700 mb-1" style={{fontSize: '16px'}}>{isPeople ? 'List of People' : 'List of Headings'}</div>
          <div className="border rounded-lg overflow-hidden">
            {(isPeople ? people : headings).map((item, idx) => (
              <div key={item.id || idx} style={{background: idx % 2 === 0 ? '#f5f5f5' : 'white'}} className="flex items-center px-3 py-2">
                <span className="w-10 text-center font-bold text-gray-700">
                  {isPeople ? String.fromCharCode(65 + idx) : (useLettersForHeadings ? String.fromCharCode(65 + idx) : toRoman(idx + 1))}.
                </span>
                <span className="flex-1 text-gray-800" style={{fontSize: '15px'}}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Example */}
        {example.paragraph && example.answer && (
          <div className="mb-4 text-sm text-gray-600"><b>Example:</b> {example.paragraph}; Answer: {example.answer}</div>
        )}
        {/* Questions */}
        <div className="space-y-4">
          {groupQuestions.map((q, idx) => {
            const qNum = globalOffset + q.question_number;
            // For matching_headings, label as Paragraph B, C, ...
            // For matching_features, label as Statement 27, 28, ...
            const paraLabel = isPeople
              ? `Statement ${qNum}`
              : `Paragraph ${String.fromCharCode(66 + idx)}`;
            return (
              <div key={q.id} className="flex items-center gap-4 py-1">
                <span className="font-bold text-gray-700" style={{ minWidth: '35px', fontSize: '15px' }}>{qNum}.</span>
                <div className="flex-1 flex items-center gap-3">
                  <select
                    value={answers[q.id] || ''}
                    onChange={e => {
                      setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                      if (saveAnswers) saveAnswers();
                    }}
                    onCopy={(e) => e.stopPropagation()}
                    onCut={(e) => e.stopPropagation()}
                    onPaste={(e) => e.stopPropagation()}
                    style={{
                      width: '100px',
                      height: '32px',
                      padding: '0 20px 0 10px',
                      border: '1px solid rgb(189, 197, 207)',
                      borderRadius: '100px',
                      fontSize: '15px',
                      fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                      userSelect: 'text',
                      WebkitUserSelect: 'text'
                    }}
                  >
                    <option value=""></option>
                    {(isPeople ? people : headings).map((item, idx2) => {
                      const optionValue = isPeople 
                        ? String.fromCharCode(65 + idx2) 
                        : (useLettersForHeadings ? String.fromCharCode(65 + idx2) : toRoman(idx2 + 1));
                      const displayValue = isPeople 
                        ? String.fromCharCode(65 + idx2) 
                        : (useLettersForHeadings ? String.fromCharCode(65 + idx2) : toRoman(idx2 + 1));
                      return (
                        <option key={idx2} value={optionValue}>
                          {displayValue}
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-gray-700" style={{minWidth: 110}}>{paraLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Sentence Completion - NO number, just template
  if (type === 'sentence_completion') {
    return groupQuestions.map((q, idx) => {
      const qNum = globalOffset + q.question_number;
      const template = q.question_template || q.question_text || '';
      const parts = template.split('[BLANK]');
      
      return (
        <div key={q.id} className="mb-3">
          <div style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', fontSize: '14px' }}>
            <RenderHtml html={parts[0]} />
            {parts.length > 1 && (
              <>
                <BlankInput 
                  questionNumber={qNum}
                  value={answers[q.id]}
                  onChange={(e) => {
                    setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                    if (saveAnswers) saveAnswers();
                  }}
                />
                <RenderHtml html={parts[1]} />
              </>
            )}
          </div>
        </div>
      );
    });
  }

  // Short Answer
  if (type === 'short_answer') {
    return groupQuestions.map((q, idx) => {
      const qNum = globalOffset + q.question_number;
      return (
        <div key={q.id} className="flex items-start gap-3 mb-3">
          <span className="font-bold text-gray-700">{qNum}.</span>
          <input 
            type="text"
            value={answers[q.id] || ''}
            onChange={(e) => {
              setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
              if (saveAnswers) saveAnswers();
            }}
            onCopy={(e) => e.stopPropagation()}
            onCut={(e) => e.stopPropagation()}
            onPaste={(e) => e.stopPropagation()}
            className="flex-1 px-3 py-2 border rounded-lg"
            style={{ 
              fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
              userSelect: 'text',
              WebkitUserSelect: 'text'
            }}
          />
        </div>
      );
    });
  }

  // Summary Completion - render summary text with inline blanks
  if (type === 'summary_completion') {
    const summaryData = group.summary_data || {};
    const text = summaryData.text || '';
    
    if (text) {
      const parts = text.split(/(\[BLANK\])/);
      let blankCount = 0;

      return (
        <div style={{ 
          border: '1px solid rgb(221, 221, 221)', 
          borderRadius: '10px', 
          padding: '16px',
          fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '24px',
          color: 'rgb(40, 40, 40)'
        }}>
          {group.summary_title && (
            <div 
              style={{
                color: 'rgb(41, 69, 99)',
                fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '12px'
              }}
              dangerouslySetInnerHTML={{ __html: group.summary_title }}
            />
          )}
          <div className="leading-relaxed">
            {parts.map((part, idx) => {
              if (part === '[BLANK]') {
                const question = groupQuestions[blankCount];
                const qNum = question ? (globalOffset + question.question_number) : (globalOffset + group.question_range_start + blankCount);
                const qId = question ? question.id : `summary_placeholder_${group.id}_${blankCount}`;
                blankCount++;
                
                return (
                  <BlankInput 
                    key={idx}
                    questionNumber={qNum}
                    value={answers[qId] || ''}
                    onChange={(e) => {
                      setAnswers(prev => ({ ...prev, [qId]: e.target.value }));
                      if (saveAnswers) saveAnswers();
                    }}
                  />
                );
              }
              return part.split('\n').map((line, lineIdx, arr) => (
                <span key={`${idx}-${lineIdx}`}>
                  {line}
                  {lineIdx < arr.length - 1 && <br />}
                </span>
              ));
            })}
          </div>
        </div>
      );
    }
  }

  // Other completion types (table_completion, diagram_labeling, note_completion, form_completion)
  if (['table_completion', 'diagram_labeling', 'note_completion', 'form_completion'].includes(type)) {
    return groupQuestions.map((q, idx) => {
      const qNum = globalOffset + q.question_number;
      return (
        <div key={q.id} className="flex items-start gap-3 mb-3">
          <span className="font-bold text-gray-700">{qNum}.</span>
          <input 
            type="text"
            value={answers[q.id] || ''}
            onChange={(e) => {
              setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
              if (saveAnswers) saveAnswers();
            }}
            onCopy={(e) => e.stopPropagation()}
            onCut={(e) => e.stopPropagation()}
            onPaste={(e) => e.stopPropagation()}
            className="flex-1 px-3 py-2 border rounded-lg"
            style={{ 
              fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
              userSelect: 'text',
              WebkitUserSelect: 'text'
            }}
          />
        </div>
      );
    });
  }

  return null;
};

export default function ReadingRenderer({ section, partNumber, globalOffset, questions, questionGroups, answers, setAnswers, saveAnswers = null, examId = null }) {
  const [textWidth, setTextWidth] = useState(50); // Percentage width for text side
  const passagePaneRef = useRef(null);
  const passageContentRef = useRef(null);
  const highlightMenuRef = useRef(null);
  const [passageHtml, setPassageHtml] = useState((section?.content || '').replace(/\b([A-Z])\. /g, '<strong>$1.</strong> '));
  const [highlightMenu, setHighlightMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    target: null,
  });

  const closeHighlightMenu = () => {
    setHighlightMenu({ visible: false, x: 0, y: 0, target: null });
  };

  const getPassageStorageKey = () => `reading_highlights_${examId || 'anonymous'}_${section?.id || 'unknown'}`;

  const persistPassageHighlights = () => {
    if (!passageContentRef.current) return;
    const html = passageContentRef.current.innerHTML;
    setPassageHtml(html);
    try {
      localStorage.setItem(getPassageStorageKey(), html);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    const baseHtml = (section?.content || '').replace(/\b([A-Z])\. /g, '<strong>$1.</strong> ');
    try {
      const savedHtml = localStorage.getItem(getPassageStorageKey());
      setPassageHtml(savedHtml || baseHtml);
    } catch {
      setPassageHtml(baseHtml);
    }
    closeHighlightMenu();
  }, [examId, section?.id, section?.content]);

  const applyHighlightToSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !passageContentRef.current) return;

    const range = selection.getRangeAt(0);
    const anchorNode = range.commonAncestorContainer.nodeType === 3
      ? range.commonAncestorContainer.parentNode
      : range.commonAncestorContainer;

    if (!passageContentRef.current.contains(anchorNode)) return;

    const highlightSpan = document.createElement('span');
    highlightSpan.className = 'reading-user-highlight';
    highlightSpan.style.backgroundColor = '#fff59d';
    highlightSpan.style.cursor = 'pointer';
    highlightSpan.style.padding = '0 1px';

    try {
      range.surroundContents(highlightSpan);
    } catch {
      const extracted = range.extractContents();
      highlightSpan.appendChild(extracted);
      range.insertNode(highlightSpan);
    }

    selection.removeAllRanges();
    persistPassageHighlights();
  };

  const handlePassageContentClick = (event) => {
    const highlightedNode = event.target.closest('.reading-user-highlight');
    if (!highlightedNode || !passagePaneRef.current) {
      closeHighlightMenu();
      return;
    }

    const paneRect = passagePaneRef.current.getBoundingClientRect();
    const nodeRect = highlightedNode.getBoundingClientRect();
    setHighlightMenu({
      visible: true,
      x: nodeRect.left - paneRect.left + passagePaneRef.current.scrollLeft,
      y: nodeRect.bottom - paneRect.top + passagePaneRef.current.scrollTop + 6,
      target: highlightedNode,
    });
  };

  const removeHighlight = () => {
    const highlightNode = highlightMenu.target;
    if (!highlightNode || !highlightNode.parentNode) {
      closeHighlightMenu();
      return;
    }

    const parent = highlightNode.parentNode;
    while (highlightNode.firstChild) {
      parent.insertBefore(highlightNode.firstChild, highlightNode);
    }
    parent.removeChild(highlightNode);
    parent.normalize();
    persistPassageHighlights();
    closeHighlightMenu();
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!highlightMenu.visible) return;

      const clickedHighlight = event.target.closest && event.target.closest('.reading-user-highlight');
      const clickedMenu = highlightMenuRef.current && highlightMenuRef.current.contains(event.target);
      if (!clickedHighlight && !clickedMenu) {
        closeHighlightMenu();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [highlightMenu.visible]);
  
  if (!section) return null;

  const sectionGroups = questionGroups
    .filter(g => g.section_id === section.id)
    .sort((a, b) => a.group_order - b.group_order);
  
  const paragraphLetters = detectParagraphLetters(section.content);

  return (
    <div className="h-full min-h-0 flex flex-col select-text">
      {/* IELTS-style headers */}
      <div className="mb-4">
        <h1 style={{ 
          fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
          fontSize: '24px', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          color: 'rgb(41, 69, 99)', 
          margin: '0 0 5px 0', 
          padding: 0, 
          lineHeight: '28.8px' 
        }}>
          PART {partNumber}
        </h1>
        <h2 style={{ 
          fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
          fontSize: '18px', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          color: 'rgb(41, 69, 99)', 
          margin: '0 0 10px 0', 
          padding: 0, 
          lineHeight: '21.6px' 
        }}>
          READING PASSAGE {partNumber}
        </h2>
      </div>

      {/* Side-by-side layout */}
      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
        {/* LEFT SIDE: Passage */}
        <div 
          ref={passagePaneRef}
          className="overflow-y-auto pr-4 min-h-0"
          style={{ 
            width: `${textWidth}%`,
            borderRight: '2px solid rgb(221, 221, 221)',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            position: 'relative'
          }}
        >
          <div className="flex justify-end mb-3 sticky top-0 z-10 bg-white/95 py-1">
            <button
              type="button"
              onClick={applyHighlightToSelection}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-yellow-300 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition"
            >
              Highlight selection
            </button>
          </div>

          {/* Instruction */}
          {section.instruction && (
            <div 
              style={{ 
                fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', 
                fontSize: '14px', 
                fontStyle: 'italic',
                color: 'rgb(40, 40, 40)', 
                marginBottom: '5px', 
                lineHeight: '21px'
              }}
              dangerouslySetInnerHTML={{ __html: section.instruction }}
            />
          )}
          
          {/* Image */}
          {section.image_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={section.image_url} 
                alt={section.image_description || 'Passage image'} 
                style={{ 
                  maxWidth: '100%', 
                  width: 'auto',
                  height: 'auto',
                  display: 'block'
                }} 
              />
            </div>
          )}
          
          {/* Title */}
          <h3 style={{ 
            fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
            fontSize: '26px', 
            fontWeight: 700, 
            textTransform: 'uppercase',
            color: 'rgb(41, 69, 99)', 
            marginBottom: '10px', 
            lineHeight: '31.2px',
            textAlign: 'center'
          }}>
            {section.title || `Passage ${partNumber}`}
          </h3>
          
          {/* Content */}
          <div 
            ref={passageContentRef}
            onClick={handlePassageContentClick}
            style={{ 
              fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', 
              fontSize: '16px', 
              color: 'rgb(40, 40, 40)', 
              lineHeight: '1.6',
              marginBottom: '30px'
            }}
            dangerouslySetInnerHTML={{ __html: passageHtml }}
          />

          {highlightMenu.visible && (
            <div
              ref={highlightMenuRef}
              className="absolute z-20"
              style={{ left: highlightMenu.x, top: highlightMenu.y }}
            >
              <button
                type="button"
                onClick={removeHighlight}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition"
              >
                Remove highlight
              </button>
            </div>
          )}
        </div>

        {/* Resizer */}
        <div 
          className="cursor-col-resize w-1 bg-gray-300 hover:bg-blue-500 transition"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = textWidth;
            const container = e.currentTarget.parentElement;
            const containerWidth = container.offsetWidth;

            const handleMouseMove = (e) => {
              const deltaX = e.clientX - startX;
              const deltaPercent = (deltaX / containerWidth) * 100;
              const newWidth = Math.max(30, Math.min(70, startWidth + deltaPercent));
              setTextWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* RIGHT SIDE: Questions */}
        <div 
          className="overflow-y-auto pl-4 min-h-0"
          style={{ 
            width: `${100 - textWidth}%`,
            userSelect: 'text',
            WebkitUserSelect: 'text'
          }}
        >
          {sectionGroups.map(group => {
            const groupQuestions = questions
              .filter(q => q.section_id === section.id && q.question_number >= group.question_range_start && q.question_number <= group.question_range_end)
              .sort((a, b) => a.question_number - b.question_number);
            
            const groupStartNum = globalOffset + group.question_range_start;
            const groupEndNum = globalOffset + group.question_range_end;
            const questionRangeText = groupStartNum === groupEndNum ? `Question ${groupStartNum}` : `Questions ${groupStartNum}–${groupEndNum}`;

            return (
              <div key={group.id} className="mb-12">
                <h3 style={{ 
                  fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
                  fontSize: '22px', 
                  fontWeight: 700, 
                  color: accentColor, 
                  marginTop: '24px', 
                  marginBottom: '32px', 
                  lineHeight: '28px' 
                }}>
                  {questionRangeText}
                </h3>
                {group.instruction_text && (
                  <div 
                    style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', fontSize: '17px', color: 'rgb(40, 40, 40)', marginBottom: '20px', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: group.instruction_text }} 
                  />
                )}
                {group.image_url && (
                  <div className="mb-4 flex justify-center">
                    <img 
                      src={group.image_url} 
                      alt={group.image_description || 'Diagram'} 
                      style={{ maxWidth: '100%', width: 'auto', height: 'auto', display: 'block', border: '1px solid rgb(221, 221, 221)' }} 
                    />
                  </div>
                )}
                <div>                {renderQuestionGroup(group, groupQuestions, globalOffset, answers, setAnswers, paragraphLetters, saveAnswers)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
