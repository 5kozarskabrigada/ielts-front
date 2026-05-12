// Reading Module Renderer - Matches Preview Mode Format
import React, { useState, useEffect, useRef, useMemo } from "react";

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

const isLetterMatchingStyle = (styleValue) => String(styleValue || 'roman').trim().toLowerCase().startsWith('letter');

const normalizeTriStateAnswer = (value, isYesNoType) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) return '';

  if (normalized === 'not_given' || normalized === 'notgiven' || normalized === 'ng') {
    return 'not_given';
  }

  if (isYesNoType) {
    if (normalized === 'yes' || normalized === 'y' || normalized === 'true' || normalized === 't') return 'yes';
    if (normalized === 'no' || normalized === 'n' || normalized === 'false' || normalized === 'f') return 'no';
    return normalized;
  }

  if (normalized === 'true' || normalized === 't' || normalized === 'yes' || normalized === 'y') return 'true';
  if (normalized === 'false' || normalized === 'f' || normalized === 'no' || normalized === 'n') return 'false';
  return normalized;
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
            // Use index-based numbering to prevent duplicates
            const qNum = globalOffset + group.question_range_start + idx;
            const selectedValue = normalizeTriStateAnswer(answers[q.id], isYesNo);
            return (
              <div key={q.id} data-question-id={q.id} data-question-number={qNum} className="flex items-center gap-4 py-1">
                <span className="font-bold text-gray-700" style={{ minWidth: '35px', display: 'inline-block', fontSize: '15px' }}>{qNum}.</span>
                <div className="flex items-center gap-2 flex-1">
                  <select 
                    value={selectedValue}
                    onChange={e => {
                      const normalizedValue = normalizeTriStateAnswer(e.target.value, isYesNo);
                      setAnswers(prev => ({ ...prev, [q.id]: normalizedValue }));
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
                    <option value={isYesNo ? 'yes' : 'true'}>{isYesNo ? 'YES' : 'TRUE'}</option>
                    <option value={isYesNo ? 'no' : 'false'}>{isYesNo ? 'NO' : 'FALSE'}</option>
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
    const maxSelections = isMultiple ? (group.question_range_end - group.question_range_start + 1) : 1;
    
    return groupQuestions.map((q, idx) => {
      // Use index-based numbering to prevent duplicates
      const qNum = globalOffset + group.question_range_start + idx;
      const selectedCount = isMultiple ? (answers[q.id] || '').length : 0;
      return (
        <div key={q.id} data-question-id={q.id} data-question-number={qNum} className="py-3" style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}>
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
            {isMultiple && <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>(Select {maxSelections})</span>}
          </p>
          <div className="ml-4 space-y-2">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => {
              const text = q[`option_${letter.toLowerCase()}`];
              if (!text) return null;
              const isChecked = isMultiple 
                ? (answers[q.id] || '').includes(letter)
                : answers[q.id] === letter;
              const isDisabled = isMultiple && !isChecked && selectedCount >= maxSelections;
              
              return (
                <label key={letter} className={`flex items-center gap-2 cursor-pointer p-1.5 rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
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
                    disabled={isDisabled}
                    onChange={(e) => {
                      if (isMultiple) {
                        const current = answers[q.id] || '';
                        if (e.target.checked && current.length >= maxSelections) return;
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
    const useLettersForHeadings = isLetterMatchingStyle(group.matching_style);

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
            {groupQuestions.map((q, idx) => {
              // Use index-based numbering to prevent duplicates
              const qNum = globalOffset + group.question_range_start + idx;
              return (
                <div key={q.id} data-question-id={q.id} data-question-number={qNum} className="flex items-center gap-3 py-1">
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
          <div style={{background: 'white', display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {(isPeople ? people : headings).map((item, idx) => (
              <div key={item.id || idx} style={{background: 'white', display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
                <span style={{minWidth: '30px', textAlign: 'left', fontWeight: 'bold', color: '#374151', fontSize: '15px'}}>
                  {isPeople ? String.fromCharCode(65 + idx) : (useLettersForHeadings ? String.fromCharCode(65 + idx) : toRoman(idx + 1))}.
                </span>
                <span style={{flex: 1, color: '#1f2937', fontSize: '15px'}}>{item.value}</span>
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
            // Use index-based numbering to prevent duplicates
            const qNum = globalOffset + group.question_range_start + idx;
            // For matching_headings, label as Paragraph B, C, ...
            // For matching_features, label as Statement 27, 28, ...
            const paraLabel = isPeople
              ? `Statement ${qNum}`
              : `Paragraph ${String.fromCharCode(66 + idx)}`;
            return (
              <div key={q.id} data-question-id={q.id} data-question-number={qNum} className="flex items-center gap-4 py-1">
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
                  {isPeople && q.question_text ? (
                    <span className="text-gray-700" style={{flex: 1, fontSize: '15px'}}>
                      <RenderHtml html={q.question_text} />
                    </span>
                  ) : (
                    <span className="text-gray-700" style={{minWidth: 110}}>{paraLabel}</span>
                  )}
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
      // Use index-based numbering to prevent duplicates
      const qNum = globalOffset + group.question_range_start + idx;
      const template = q.question_template || q.question_text || '';
      const parts = template.split('[BLANK]');
      
      return (
        <div key={q.id} data-question-id={q.id} data-question-number={qNum} className="mb-3">
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
      // Use index-based numbering to prevent duplicates
      const qNum = globalOffset + group.question_range_start + idx;
      return (
        <div key={q.id} data-question-id={q.id} data-question-number={qNum} className="flex items-start gap-3 mb-3">
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
                // Use index-based numbering to prevent duplicates
                const qNum = globalOffset + group.question_range_start + blankCount;
                const qId = question ? question.id : `summary_placeholder_${group.id}_${blankCount}`;
                blankCount++;
                
                return (
                  <span key={idx} data-question-id={qId} data-question-number={qNum}>
                    <BlankInput 
                      questionNumber={qNum}
                      value={answers[qId] || ''}
                      onChange={(e) => {
                        setAnswers(prev => ({ ...prev, [qId]: e.target.value }));
                        if (saveAnswers) saveAnswers();
                      }}
                    />
                  </span>
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

  // Diagram/Map labeling - show image and description
  if (type === 'diagram_labeling') {
    return (
      <div>
        {group.image_url && (
          <div className="mb-4">
            <img 
              src={group.image_url} 
              alt={group.image_description || 'Diagram'} 
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
            />
            {group.image_description && (
              <p className="text-sm text-gray-600 mt-2 italic">{group.image_description}</p>
            )}
          </div>
        )}
        {groupQuestions.map((q, idx) => {
          // Use index-based numbering to prevent duplicates
          const qNum = globalOffset + group.question_range_start + idx;
          return (
            <div key={q.id} data-question-id={q.id} data-question-number={qNum} className="flex items-start gap-3 mb-3">
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
        })}
      </div>
    );
  }

  // Other completion types (table_completion, note_completion, form_completion)
  if (['table_completion', 'note_completion', 'form_completion'].includes(type)) {
    return groupQuestions.map((q, idx) => {
      // Use index-based numbering to prevent duplicates
      const qNum = globalOffset + group.question_range_start + idx;
      return (
        <div key={q.id} data-question-id={q.id} data-question-number={qNum} className="flex items-start gap-3 mb-3">
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

function ReadingRenderer({ section, partNumber, globalOffset, questions, questionGroups, answers, setAnswers, saveAnswers = null, examId = null, userId = null, persistenceEnabled = true }) {
  const [textWidth, setTextWidth] = useState(50); // Percentage width for text side
  const passagePaneRef = useRef(null);
  const passageContentRef = useRef(null);
  const highlightMenuRef = useRef(null);
  const selectionActionRef = useRef(null);
  const pendingSelectionRangeRef = useRef(null);
  const [passageHtml, setPassageHtml] = useState((section?.content || '').replace(/\b([A-Z])\. /g, '<strong>$1.</strong> '));
  const [highlightMenu, setHighlightMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    target: null,
  });
  const [selectionAction, setSelectionAction] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const passageContentMarkup = useMemo(() => ({ __html: passageHtml }), [passageHtml]);

  const closeHighlightMenu = () => {
    setHighlightMenu((prev) => {
      if (!prev.visible && prev.x === 0 && prev.y === 0 && !prev.target) {
        return prev;
      }
      return { visible: false, x: 0, y: 0, target: null };
    });
  };

  const closeSelectionAction = () => {
    pendingSelectionRangeRef.current = null;
    setSelectionAction((prev) => {
      if (!prev.visible && prev.x === 0 && prev.y === 0) {
        return prev;
      }
      return { visible: false, x: 0, y: 0 };
    });
  };

  // Store highlights as overlay data (no DOM wrapping)
  const [highlights, setHighlights] = useState([]);
  const highlightOverlaysRef = useRef(null);

  const resolveElementNode = (node) => {
    if (!node) return null;
    return node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  };

  const isRangeHighlightSafe = (range) => {
    if (!range || range.collapsed) return false;

    const startEl = resolveElementNode(range.startContainer);
    const endEl = resolveElementNode(range.endContainer);
    if (!startEl || !endEl || !passageContentRef.current) return false;

    if (!passageContentRef.current.contains(startEl) || !passageContentRef.current.contains(endEl)) {
      return false;
    }

    // Avoid wrapping complex table structures, but allow normal passage selections.
    const selectionFragment = range.cloneContents();
    if (
      selectionFragment.querySelector &&
      selectionFragment.querySelector('table, thead, tbody, tfoot, tr, td, th, colgroup, col')
    ) {
      return false;
    }

    return true;
  };

  const getPassageStorageKey = () => {
    if (!persistenceEnabled) return null;
    if (!examId || !userId || !section?.id) return null;
    return `reading_highlights_v2_${examId}_${userId}_${section.id}`;
  };

  const getNodeXPath = (node) => {
    if (!node || !passageContentRef.current) return null;
    if (node === passageContentRef.current) return '/';
    
    const parts = [];
    let currentNode = node;
    
    while (currentNode && currentNode !== passageContentRef.current) {
      let index = 0;
      let sibling = currentNode;
      while (sibling = sibling.previousSibling) {
        if (sibling.nodeName === currentNode.nodeName) index++;
      }
      parts.unshift(`${currentNode.nodeName}[${index}]`);
      currentNode = currentNode.parentNode;
    }
    
    return '/' + parts.join('/');
  };

  const getNodeFromXPath = (xpath) => {
    if (!xpath || !passageContentRef.current) return null;
    if (xpath === '/') return passageContentRef.current;
    
    const parts = xpath.split('/').filter(p => p);
    let currentNode = passageContentRef.current;
    
    for (const part of parts) {
      const match = part.match(/^(.+)\[(\d+)\]$/);
      if (!match) return null;
      const [, nodeName, indexStr] = match;
      const index = parseInt(indexStr, 10);
      
      let count = -1;
      let found = null;
      for (const child of currentNode.childNodes) {
        if (child.nodeName === nodeName) {
          count++;
          if (count === index) {
            found = child;
            break;
          }
        }
      }
      
      if (!found) return null;
      currentNode = found;
    }
    
    return currentNode;
  };

  const persistPassageHighlights = (newHighlights) => {
    try {
      const storageKey = getPassageStorageKey();
      if (!storageKey) return;
      localStorage.setItem(storageKey, JSON.stringify(newHighlights || highlights));
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    const baseHtml = (section?.content || '').replace(/\b([A-Z])\. /g, '<strong>$1.</strong> ');
    setPassageHtml(baseHtml);

    if (!persistenceEnabled) {
      setHighlights([]);
      closeHighlightMenu();
      closeSelectionAction();
      return;
    }

    try {
      const storageKey = getPassageStorageKey();
      if (!storageKey) {
        setHighlights([]);
      } else {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            setHighlights(Array.isArray(parsed) ? parsed : []);
          } catch {
            setHighlights([]);
          }
        } else {
          setHighlights([]);
        }
      }
    } catch {
      setHighlights([]);
    }
    closeHighlightMenu();
    closeSelectionAction();
  }, [examId, userId, section?.id, section?.content, persistenceEnabled]);

  useEffect(() => {
    closeHighlightMenu();
    closeSelectionAction();
  }, [section?.id]);

  const handlePassageMouseUp = () => {
    if (!passagePaneRef.current || !passageContentRef.current) {
      closeSelectionAction();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      closeSelectionAction();
      return;
    }

    const range = selection.getRangeAt(0);
    const anchorNode = range.commonAncestorContainer.nodeType === 3
      ? range.commonAncestorContainer.parentNode
      : range.commonAncestorContainer;

    if (!passageContentRef.current.contains(anchorNode)) {
      closeSelectionAction();
      return;
    }

    if (!isRangeHighlightSafe(range)) {
      closeSelectionAction();
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      closeSelectionAction();
      return;
    }

    pendingSelectionRangeRef.current = range.cloneRange();
    const paneRect = passagePaneRef.current.getBoundingClientRect();
    const paneScrollLeft = passagePaneRef.current.scrollLeft;
    const paneScrollTop = passagePaneRef.current.scrollTop;
    const paneInnerWidth = passagePaneRef.current.clientWidth;
    const buttonSize = 40; // 32px button + 8px margin

    let x = rect.right - paneRect.left + paneScrollLeft + 8;
    let y = rect.bottom - paneRect.top + paneScrollTop + 6;

    // Clamp X so the highlight button doesn't overflow the pane's right edge
    if (x + buttonSize > paneScrollLeft + paneInnerWidth) {
      x = rect.left - paneRect.left + paneScrollLeft - buttonSize;
      if (x < paneScrollLeft) x = paneScrollLeft + 4;
    }

    setSelectionAction({
      visible: true,
      x,
      y,
    });
    closeHighlightMenu();
  };

  useEffect(() => {
    if (!passageContentRef.current) return;

    const root = passageContentRef.current;
    root.style.setProperty('user-select', 'text', 'important');
    root.style.setProperty('-webkit-user-select', 'text', 'important');

    const descendants = root.querySelectorAll('*');
    descendants.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.style.setProperty('user-select', 'text', 'important');
      node.style.setProperty('-webkit-user-select', 'text', 'important');
      if (node.getAttribute('draggable') === 'true') {
        node.setAttribute('draggable', 'false');
      }
    });
  }, [passageHtml]);

  // Render highlight overlays (no DOM manipulation)
  useEffect(() => {
    if (!passageContentRef.current || !highlightOverlaysRef.current) return;
    
    // Clear existing overlays
    highlightOverlaysRef.current.innerHTML = '';
    
    highlights.forEach((highlight) => {
      const { startXPath, startOffset, endXPath, endOffset, id } = highlight;
      
      try {
        const startNode = getNodeFromXPath(startXPath);
        const endNode = getNodeFromXPath(endXPath);
        
        if (!startNode || !endNode) return;
        
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        const rects = range.getClientRects();
        const passageRect = passageContentRef.current.getBoundingClientRect();
        
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          const overlay = document.createElement('div');
          overlay.className = 'reading-highlight-overlay';
          overlay.dataset.highlightId = id;
          overlay.style.position = 'absolute';
          overlay.style.left = `${rect.left - passageRect.left + passageContentRef.current.scrollLeft}px`;
          overlay.style.top = `${rect.top - passageRect.top + passageContentRef.current.scrollTop}px`;
          overlay.style.width = `${rect.width}px`;
          overlay.style.height = `${rect.height}px`;
          overlay.style.backgroundColor = '#fff59d';
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '0';
          highlightOverlaysRef.current.appendChild(overlay);
        }
      } catch (err) {
        console.warn('Failed to render highlight:', err);
      }
    });
  }, [highlights, passageHtml]);

  const applyHighlightToSelection = () => {
    if (!passageContentRef.current) return;

    const selection = window.getSelection();
    let range = pendingSelectionRangeRef.current || null;

    if (!range && selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const selectedRange = selection.getRangeAt(0);
      const selectedAnchorNode = selectedRange.commonAncestorContainer.nodeType === 3
        ? selectedRange.commonAncestorContainer.parentNode
        : selectedRange.commonAncestorContainer;

      if (passageContentRef.current.contains(selectedAnchorNode)) {
        range = selectedRange;
      }
    }

    if (!range || range.collapsed) {
      closeSelectionAction();
      return;
    }

    const anchorNode = range.commonAncestorContainer.nodeType === 3
      ? range.commonAncestorContainer.parentNode
      : range.commonAncestorContainer;

    if (!passageContentRef.current.contains(anchorNode)) {
      closeSelectionAction();
      return;
    }

    if (!isRangeHighlightSafe(range)) {
      closeSelectionAction();
      return;
    }

    // Store highlight data without modifying DOM
    const startXPath = getNodeXPath(range.startContainer);
    const endXPath = getNodeXPath(range.endContainer);
    const text = range.toString();
    
    if (!startXPath || !endXPath) {
      closeSelectionAction();
      return;
    }

    const newHighlight = {
      id: Date.now().toString(),
      text,
      startXPath,
      startOffset: range.startOffset,
      endXPath,
      endOffset: range.endOffset,
    };

    const newHighlights = [...highlights, newHighlight];
    setHighlights(newHighlights);
    persistPassageHighlights(newHighlights);

    if (selection) {
      selection.removeAllRanges();
    }

    closeSelectionAction();
  };

  const handlePassageContentClick = (event) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      return;
    }

    if (!passagePaneRef.current || !passageContentRef.current) {
      closeHighlightMenu();
      return;
    }

    // Check if click is on a highlighted area
    const clickX = event.clientX;
    const clickY = event.clientY;
    
    let foundHighlight = null;
    
    for (const highlight of highlights) {
      try {
        const startNode = getNodeFromXPath(highlight.startXPath);
        const endNode = getNodeFromXPath(highlight.endXPath);
        
        if (!startNode || !endNode) continue;
        
        const range = document.createRange();
        range.setStart(startNode, highlight.startOffset);
        range.setEnd(endNode, highlight.endOffset);
        
        const rects = range.getClientRects();
        
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          if (
            clickX >= rect.left && clickX <= rect.right &&
            clickY >= rect.top && clickY <= rect.bottom
          ) {
            foundHighlight = { ...highlight, rect: rects[0] };
            break;
          }
        }
        
        if (foundHighlight) break;
      } catch {
        continue;
      }
    }

    if (!foundHighlight) {
      closeHighlightMenu();
      return;
    }

    closeSelectionAction();
    const paneRect = passagePaneRef.current.getBoundingClientRect();
    setHighlightMenu({
      visible: true,
      x: foundHighlight.rect.left - paneRect.left + passagePaneRef.current.scrollLeft,
      y: foundHighlight.rect.bottom - paneRect.top + passagePaneRef.current.scrollTop + 6,
      target: foundHighlight,
    });
  };

  const removeHighlight = () => {
    const highlightData = highlightMenu.target;
    if (!highlightData || !highlightData.id) {
      closeHighlightMenu();
      return;
    }

    const newHighlights = highlights.filter(h => h.id !== highlightData.id);
    setHighlights(newHighlights);
    persistPassageHighlights(newHighlights);
    closeSelectionAction();
    closeHighlightMenu();
  };
  
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
          className="overflow-y-auto overflow-x-hidden pr-4 min-h-0"
          style={{ 
            width: `${textWidth}%`,
            borderRight: '2px solid rgb(221, 221, 221)',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            position: 'relative'
          }}
        >
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
          
          {/* Content with highlight overlays */}
          <div style={{ position: 'relative' }}>
            {/* Highlight overlays (behind text) */}
            <div 
              ref={highlightOverlaysRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />
            
            {/* Text content (in front of overlays) */}
            <div 
              ref={passageContentRef}
              className="select-text reading-passage-content"
              onClick={handlePassageContentClick}
              onMouseUp={handlePassageMouseUp}
              style={{ 
                fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', 
                fontSize: '16px', 
                color: 'rgb(40, 40, 40)', 
                lineHeight: '1.6',
                marginBottom: '30px',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                position: 'relative',
                zIndex: 1
              }}
              dangerouslySetInnerHTML={passageContentMarkup}
            />
          </div>

          {selectionAction.visible && (
            <div
              ref={selectionActionRef}
              className="absolute z-50"
              style={{ left: selectionAction.x, top: selectionAction.y }}
            >
              <button
                type="button"
                title="Highlight selection"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  applyHighlightToSelection();
                }}
                className="w-8 h-8 flex items-center justify-center text-sm rounded-full border border-yellow-300 bg-yellow-100 text-yellow-800 shadow-sm hover:bg-yellow-200 transition"
              >
                🖍
              </button>
            </div>
          )}

          {highlightMenu.visible && (
            <div
              ref={highlightMenuRef}
              className="absolute z-50"
              style={{ left: highlightMenu.x, top: highlightMenu.y }}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeHighlight();
                }}
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

export default React.memo(ReadingRenderer);
