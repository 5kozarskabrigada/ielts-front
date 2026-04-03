// Listening Module Renderer - Matches Preview Mode Format
import React from "react";

const accentColor = 'rgb(50, 180, 200)';

// Render HTML safely
const RenderHtml = ({ html }) => {
  return <span dangerouslySetInnerHTML={{ __html: html || '' }} />;
};

// Blank input component for fill-in questions
const BlankInput = ({ questionNumber, questionId, value, onChange }) => (
  <span 
    id={`question-${questionNumber}`} 
    data-question-id={questionId}
    className="scroll-mt-20"
    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', margin: '2px 4px', verticalAlign: 'middle' }}
  >    <span 
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
        width: '150px',
        height: '32px',
        padding: '0 12px 0 8px',
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

// Render question group based on type
const renderQuestionGroup = (group, groupQuestions, globalOffset, answers, setAnswers, saveAnswers = null) => {
  const type = group.question_type;

  // Multiple Choice (Single + Multiple)
  if (type === 'multiple_choice' || type === 'multiple_choice_multiple') {
    const isMultiple = type === 'multiple_choice_multiple';
    return groupQuestions.map((q, idx) => {
      const globalNum = globalOffset + q.question_number;
      return (
        <div 
          key={q.id} 
          id={`question-${globalNum}`} 
          data-question-id={q.id}
          className="py-4 scroll-mt-20"
          style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif' }}
        >
          <p style={{
            color: 'rgb(40, 40, 40)',
            fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '17px',
            fontWeight: isMultiple ? 400 : 700,
            lineHeight: '24px',
            marginTop: '10px',
            marginBottom: '10px'
          }}>
            {!isMultiple && `${globalNum}. `}<RenderHtml html={q.question_text || ''} />
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
                    type={isMultiple ? 'checkbox' : 'radio'}
                    name={isMultiple ? undefined : `q${q.id}`}
                    className="w-4 h-4"
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

  // Form/Table Completion
  if (type === 'form_completion') {
    const tableData = group.table_data || {};
    const cells = tableData.cells || [];
    const headers = tableData.headers || [];
    const hasHeaders = tableData.hasHeaders || false;
    const merges = tableData.merges || [];

    const isCellHidden = (rowIdx, colIdx) => {
      return merges.some(m => {
        if (m.startRow === rowIdx && m.startCol === colIdx) return false;
        return rowIdx >= m.startRow && 
               rowIdx < m.startRow + (m.rowSpan || 1) &&
               colIdx >= m.startCol && 
               colIdx < m.startCol + (m.colSpan || 1);
      });
    };

    const getMergeAt = (rowIdx, colIdx) => {
      return merges.find(m => m.startRow === rowIdx && m.startCol === colIdx);
    };

    const renderCellContent = (cellContent, startBlankNum) => {
      if (!cellContent) return null;
      const parts = cellContent.split(/(\[BLANK\])/);
      let blankCount = 0;

      return parts.map((part, idx) => {
        if (part === '[BLANK]') {
          const question = groupQuestions[startBlankNum + blankCount];
          const qNum = question ? (globalOffset + question.question_number) : (globalOffset + group.question_range_start + startBlankNum + blankCount);
          blankCount++;
          
          if (!question) {
            console.warn(`Table completion: Question not found for blank ${blankCount}`, {
              groupId: group.id,
              sectionId: group.section_id,
              blankIndex: startBlankNum + blankCount - 1,
              totalGroupQuestions: groupQuestions.length,
            });
            // Render a usable input with a synthetic ID so the student can still answer
            const syntheticId = `table_${group.id}_blank_${startBlankNum + blankCount - 1}`;
            return (
              <BlankInput 
                key={idx}
                questionNumber={qNum}
                questionId={syntheticId}
                value={answers[syntheticId] || ''}
                onChange={(e) => {
                  try {
                    setAnswers(prev => ({ ...prev, [syntheticId]: e.target.value }));
                    if (saveAnswers) saveAnswers();
                  } catch (error) {
                    console.error('Error updating answer:', error);
                  }
                }}
              />
            );
          }
          
          return (
            <BlankInput 
              key={idx}
              questionNumber={qNum}
              questionId={question.id}
              value={answers[question.id]}
              onChange={(e) => {
                try {
                  setAnswers(prev => ({ ...prev, [question.id]: e.target.value }));
                  if (saveAnswers) saveAnswers();
                } catch (error) {
                  console.error('Error updating answer:', error);
                }
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
      });
    };

    let globalBlankIndex = 0;

    return (
      <div style={{ border: '1px solid rgb(221, 221, 221)', borderRadius: '10px', padding: '16px' }}>
        {group.table_title && (
          <div 
            style={{
              color: 'rgb(41, 69, 99)',
              fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '16px'
            }}
            dangerouslySetInnerHTML={{ __html: group.table_title }}
          />
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgb(221, 221, 221)' }}>
          {hasHeaders && headers.some(h => h) && (
            <thead>
              <tr>
                {headers.map((header, idx) => (
                  <th 
                    key={idx}
                    style={{
                      backgroundColor: 'rgb(221, 221, 221)',
                      border: '1px solid rgb(221, 221, 221)',
                      padding: '8px',
                      textAlign: 'center',
                      fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  >
                    {header || `Col ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {cells.map((row, rowIdx) => {
              return (
                <tr key={rowIdx}>
                  {row.map((cell, colIdx) => {
                    if (isCellHidden(rowIdx, colIdx)) return null;
                    
                    const merge = getMergeAt(rowIdx, colIdx);
                    let blanksBeforeThis = 0;
                    for (let r = 0; r < rowIdx; r++) {
                      cells[r].forEach(c => {
                        blanksBeforeThis += (c.match(/\[BLANK\]/g) || []).length;
                      });
                    }
                    for (let c = 0; c < colIdx; c++) {
                      blanksBeforeThis += (row[c].match(/\[BLANK\]/g) || []).length;
                    }
                    
                    return (
                      <td 
                        key={colIdx}
                        rowSpan={merge?.rowSpan || 1}
                        colSpan={merge?.colSpan || 1}
                        style={{
                          border: '1px solid rgb(221, 221, 221)',
                          padding: '10px 12px',
                          verticalAlign: 'middle',
                          fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                          fontSize: '14px'
                        }}
                      >
                        {renderCellContent(cell, blanksBeforeThis)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Summary Completion
  if (type === 'summary_completion') {
    const summaryData = group.summary_data || {};
    const text = summaryData.text || '';
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
                  questionId={qId}
                  value={answers[qId] || ''}
                  onChange={(e) => {
                    try {
                      setAnswers(prev => ({ ...prev, [qId]: e.target.value }));
                    } catch (error) {
                      console.error('Error updating summary answer:', error);
                    }
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

  // Sentence Completion
  if (type === 'sentence_completion') {
    return groupQuestions.map((q, idx) => {
      const globalNum = globalOffset + q.question_number;
      const template = q.question_template || '';
      const parts = template.split('[BLANK]');
      
      return (
        <div key={q.id} className="py-2">
          <span style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', fontSize: '14px', display: 'inline' }}>
            <RenderHtml html={parts[0]} />
            {parts.length > 1 && (
              <>
                <BlankInput 
                  questionNumber={globalNum}
                  value={answers[q.id] || ''}
                  onChange={(e) => {
                    try {
                      setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                    } catch (error) {
                      console.error('Error updating sentence answer:', error);
                    }
                  }}
                />
                <RenderHtml html={parts[1]} />
              </>
            )}
          </span>
        </div>
      );
    });
  }

  // Note Completion
  if (type === 'note_completion') {
    return groupQuestions.map((q, idx) => {
      const globalNum = globalOffset + q.question_number;
      const template = q.question_template || '';
      const parts = template.split('[BLANK]');
      
      return (
        <div key={q.id} className="py-1">
          <span style={{ fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif', fontSize: '14px', display: 'inline' }}>
            <RenderHtml html={parts[0]} />
            {parts.length > 1 && (
              <>
                <BlankInput 
                  questionNumber={globalNum}
                  value={answers[q.id] || ''}
                  onChange={(e) => {
                    try {
                      setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                    } catch (error) {
                      console.error('Error updating note answer:', error);
                    }
                  }}
                />
                <RenderHtml html={parts[1]} />
              </>
            )}
          </span>
        </div>
      );
    });
  }

  // Matching
  if (type === 'matching') {
    const sharedOptions = group.shared_options || [];
    
    return (
      <div>
        {sharedOptions.length > 0 && (
          <div style={{background: 'white', marginBottom: '16px'}}>
            <p style={{fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '8px'}}>Options:</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {sharedOptions.map(opt => (
                <div key={opt.label} style={{display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
                  <span style={{minWidth: '30px', fontWeight: 'bold', color: '#374151', fontSize: '15px'}}>{opt.label}</span>
                  <span style={{fontSize: '15px', color: '#1f2937'}}>{opt.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {groupQuestions.map((q, idx) => {
          const globalNum = globalOffset + q.question_number;
          return (
            <div key={q.id} className="py-2">
              <div className="flex items-start gap-3 mb-2">
                <span className="font-bold text-gray-900 min-w-[30px]">{globalNum}.</span>
                <div className="flex-1">
                  <RenderHtml html={q.question_text || ''} />
                </div>
              </div>
              <input 
                type="text"
                value={answers[q.id] || ''}
                onChange={(e) => {
                  setAnswers(prev => ({ ...prev, [q.id]: e.target.value.toUpperCase() }));
                  if (saveAnswers) saveAnswers();
                }}
                onCopy={(e) => e.stopPropagation()}
                onCut={(e) => e.stopPropagation()}
                onPaste={(e) => e.stopPropagation()}
                maxLength={1}
                className="w-12 h-10 text-center border rounded font-bold text-lg"
                placeholder="?"
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

  // Short Answer - Stack question and blank vertically
  if (type === 'short_answer') {
    return (
      <div className="space-y-3">
        {groupQuestions.map((q, idx) => {
          const globalNum = globalOffset + q.question_number;
          return (
            <div key={q.id} className="flex flex-col gap-2" data-question-id={q.id}>
              <p style={{
                color: 'rgb(40, 40, 40)',
                fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 600
              }}>
                {globalNum}. <RenderHtml html={q.question_text || `Question ${globalNum}`} />
              </p>
              <BlankInput
                questionNumber={globalNum}
                questionId={q.id}
                value={answers[q.id]}
                onChange={(e) => {
                  setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                  if (saveAnswers) saveAnswers();
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Map/Diagram Labeling
  if (type === 'map_labeling' || type === 'diagram_labeling') {
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
        <div className="space-y-3">
          {groupQuestions.map((q, idx) => {
            const globalNum = globalOffset + q.question_number;
            return (
              <div key={q.id} className="flex flex-col gap-2" data-question-id={q.id}>
                <p style={{
                  color: 'rgb(40, 40, 40)',
                  fontFamily: 'Nunito, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  {globalNum}. <RenderHtml html={q.question_text || `Question ${globalNum}`} />
                </p>
                <BlankInput
                  questionNumber={globalNum}
                  questionId={q.id}
                  value={answers[q.id]}
                  onChange={(e) => {
                    setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                    if (saveAnswers) saveAnswers();
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default function ListeningRenderer({ sections, questions, questionGroups, answers, setAnswers, partNumber, globalOffset: externalOffset, saveAnswers = null }) {
  const listeningSections = sections
    .filter(s => s.module_type === 'listening')
    .sort((a, b) => a.section_order - b.section_order);

  if (listeningSections.length === 0) {
    return <div>Listening sections not found.</div>;
  }

  // Use external globalOffset if provided (from ExamPlayer), otherwise calculate internally
  let cumulativeOffset = typeof externalOffset === 'number' ? externalOffset : 0;
  const partOffsets = listeningSections.map((section) => {
    const offset = cumulativeOffset;
    cumulativeOffset += questions.filter(q => q.section_id === section.id).length;
    return { sectionId: section.id, offset };
  });

  const requestedPartIndex = Number(partNumber) - 1;
  const currentPartSection = listeningSections[requestedPartIndex] || listeningSections[0];

  const sectionGroups = questionGroups
    .filter(g => g.section_id === currentPartSection.id)
    .sort((a, b) => a.group_order - b.group_order);

  const globalOffset = partOffsets.find(p => p.sectionId === currentPartSection.id)?.offset ?? 0;

  return (
    <div className="h-full min-h-0 flex flex-col select-text">
      {/* Questions */}
      <div className="overflow-y-auto pr-4 flex-1 min-h-0" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
        {/* Headers (scroll with content - not pinned) */}
        <div className="mb-4">
          <h1 style={{ fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', fontSize: '24px', fontWeight: 700, textTransform: 'uppercase', color: 'rgb(41, 69, 99)', margin: '0 0 5px 0', padding: 0, lineHeight: '28.8px' }}>
            PART {partNumber}
          </h1>
          {currentPartSection.instruction && (
            <div
              className="mt-2 text-gray-700 leading-relaxed"
              style={{ fontSize: '14px', lineHeight: '21px' }}
              dangerouslySetInnerHTML={{ __html: currentPartSection.instruction }}
            />
          )}
        </div>

        {sectionGroups.map(group => {
          const groupQuestions = questions
            .filter(q => {
              // Primary: match by group_id
              if (q.group_id === group.id) return true;
              // Fallback: match by section_id + question_number range (for old data)
              if (q.section_id === group.section_id && 
                q.question_number >= group.question_range_start && 
                q.question_number <= group.question_range_end) return true;
              // Last resort for form_completion: match by section + question_type
              if (group.question_type === 'form_completion' && 
                q.section_id === group.section_id && 
                (q.question_type === 'form_completion' || q.question_type === group.question_type)) return true;
              return false;
            })
            .sort((a, b) => a.question_number - b.question_number);

          const hasExplicitRange = Number.isFinite(Number(group.question_range_start)) && Number.isFinite(Number(group.question_range_end));
          const headingStart = hasExplicitRange
            ? globalOffset + Number(group.question_range_start)
            : (groupQuestions[0] ? globalOffset + Number(groupQuestions[0].question_number) : globalOffset + 1);
          const headingEnd = hasExplicitRange
            ? globalOffset + Number(group.question_range_end)
            : (groupQuestions[groupQuestions.length - 1] ? globalOffset + Number(groupQuestions[groupQuestions.length - 1].question_number) : headingStart);
          
          return (
            <div key={group.id} className="mb-8">
              {group.group_title ? (
                <div 
                  style={{ 
                    fontFamily: 'Montserrat, Helvetica, Arial, sans-serif', 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    color: 'rgb(41, 69, 99)', 
                    padding: '10px',
                    backgroundColor: 'rgb(230, 230, 230)',
                    borderRadius: '5px',
                    marginBottom: '15px' 
                  }}
                  dangerouslySetInnerHTML={{ __html: group.group_title }}
                />
              ) : (
                <h3
                  style={{
                    fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'rgb(41, 69, 99)',
                    margin: '0 0 15px 0',
                    lineHeight: '26px'
                  }}
                >
                  {`Questions ${headingStart}-${headingEnd}`}
                </h3>
              )}
              {group.instruction_text && (
                <div
                  className="mb-3 text-gray-700 leading-relaxed"
                  style={{ fontSize: '14px', lineHeight: '21px' }}
                  dangerouslySetInnerHTML={{ __html: group.instruction_text }}
                />
              )}
              {renderQuestionGroup(group, groupQuestions, globalOffset, answers, setAnswers, saveAnswers)}
            </div>
          );
        })}
      </div>
    </div>
  );

}
