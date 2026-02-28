import React, { useState, useEffect } from 'react';

// Data model types
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock AI suggestion function
const generateSuggestion = (type, title) => {
  const suggestions = {
    project: [
      "Consider breaking this into 3-5 major milestones. Start with research and planning phases.",
      "Think about deliverables at each stage. What's the minimum viable outcome for each checkpoint?",
      "Define clear success criteria for each phase. What does 'done' look like?",
      "Map out dependencies between stages. Which tasks must happen before others?",
      "Consider resource allocation. What will you need at each stage?"
    ],
    stage: [
      "Break this down into 2-4 concrete subtasks. What's the first actionable step?",
      "Consider dependencies: what needs to happen before this stage can be marked complete?",
      "Define clear exit criteria. How will you know this stage is done?",
      "Think about who needs to be involved. What expertise is required?",
      "Estimate time and effort. Is this stage sized appropriately?"
    ]
  };
  const list = suggestions[type] || suggestions.stage;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
};

// Storage utilities
const STORAGE_KEY = 'tasksplits_projects';

const loadProjects = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveProjects = (projects) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

// Utility to strip IDs from export data
const stripIds = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => stripIds(item));
  }
  if (obj && typeof obj === 'object') {
    const { id, ...rest } = obj;
    const cleaned = {};
    for (const key in rest) {
      cleaned[key] = stripIds(rest[key]);
    }
    return cleaned;
  }
  return obj;
};

// Improved clipboard copy function for sandbox environment
const copyToClipboard = async (text) => {
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Clipboard API failed, try fallback
  }

  // Fallback method using textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    return successful;
  } catch (err) {
    return false;
  }
};

// Google Calendar CSV Export
const exportToGoogleCalendarCSV = (project) => {
  // CSV Headers for Google Calendar
  const headers = ['Subject', 'Start Date', 'Start Time', 'End Date', 'End Time', 'All Day Event', 'Description', 'Location', 'Private'];
  
  const rows = [headers];
  
  // Process each stage with dates
  project.stages.forEach(stage => {
    if (stage.endDate) {
      const subject = stage.title;
      const startDate = stage.startDate || stage.endDate;
      const endDate = stage.endDate;
      const allDayEvent = 'True';
      const description = stage.description || '';
      
      rows.push([
        `"${subject}"`,
        startDate,
        '',
        endDate,
        '',
        allDayEvent,
        `"${description}"`,
        '',
        'False'
      ]);
    }
  });
  
  // Convert to CSV string
  const csvContent = rows.map(row => row.join(',')).join('\n');
  
  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${project.title.replace(/[^a-z0-9]/gi, '_')}_calendar.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ProjectExportModal Component
const ProjectExportModal = ({ project, onClose }) => {
  const [copyStatus, setCopyStatus] = useState('');
  
  const exportData = stripIds({
    title: project.title,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    stages: project.stages
  });
  
  const jsonString = JSON.stringify(exportData, null, 2);

  const handleCopy = async () => {
    const success = await copyToClipboard(jsonString);
    if (success) {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } else {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <h2 className="text-xl font-bold mb-4">Export Project</h2>
        <p className="text-sm text-gray-600 mb-3">
          Copy this JSON to save or share your project.
        </p>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          <textarea
            value={jsonString}
            readOnly
            className="w-full h-full px-3 py-2 border rounded font-mono text-sm"
            style={{ minHeight: '300px', resize: 'none' }}
          />
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
          {copyStatus && (
            <span className={`text-sm ${copyStatus === 'Copied!' ? 'text-green-600' : 'text-red-600'}`}>
              {copyStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ConfirmDeleteModal Component
const ConfirmDeleteModal = ({ projectTitle, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Delete Project?</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "<strong>{projectTitle}</strong>"? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ImportProjectModal Component
const ImportProjectModal = ({ onImport, onClose, existingProjects }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      // Check if it's an array (shareable stages format)
      if (Array.isArray(parsed)) {
        const newProject = {
          id: generateId(),
          title: 'Imported Project',
          description: '',
          startDate: '',
          endDate: '',
          stages: parsed.map(stage => ({
            id: generateId(),
            title: stage.title || 'Untitled Stage',
            description: stage.description || '',
            startDate: stage.startDate || '',
            endDate: stage.endDate || '',
            completed: stage.completed || false,
            subtasks: (stage.subtasks || []).map(st => ({
              id: generateId(),
              title: st.title || 'Untitled Subtask',
              description: st.description || '',
              endDate: st.endDate || '',
              completed: st.completed || false
            })),
            shareable: false
          }))
        };
        
        const existingTitles = existingProjects.map(p => p.title.toLowerCase());
        let finalTitle = newProject.title;
        let counter = 1;
        while (existingTitles.includes(finalTitle.toLowerCase())) {
          finalTitle = `${newProject.title} (${counter})`;
          counter++;
        }
        newProject.title = finalTitle;
        
        onImport(newProject);
        setError('');
        return;
      }
      
      if (parsed.stages && Array.isArray(parsed.stages)) {
        const baseTitle = parsed.title || parsed.projectTitle || 'Imported Project';
        
        const existingTitles = existingProjects.map(p => p.title.toLowerCase());
        let finalTitle = baseTitle;
        let counter = 1;
        while (existingTitles.includes(finalTitle.toLowerCase())) {
          finalTitle = `${baseTitle} (${counter})`;
          counter++;
        }
        
        const newProject = {
          id: generateId(),
          title: finalTitle,
          description: parsed.description || parsed.projectDescription || '',
          startDate: parsed.startDate || '',
          endDate: parsed.endDate || '',
          stages: parsed.stages.map(stage => ({
            id: generateId(),
            title: stage.title || 'Untitled Stage',
            description: stage.description || '',
            startDate: stage.startDate || '',
            endDate: stage.endDate || '',
            completed: stage.completed || false,
            subtasks: (stage.subtasks || []).map(st => ({
              id: generateId(),
              title: st.title || 'Untitled Subtask',
              description: st.description || '',
              endDate: st.endDate || '',
              completed: st.completed || false
            })),
            shareable: false
          }))
        };
        onImport(newProject);
        setError('');
        return;
      }

      throw new Error('Invalid format: must be a project object with stages array or a stages array');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <h2 className="text-xl font-bold mb-4">Import Project from JSON</h2>
        <p className="text-sm text-gray-600 mb-3">
          Paste a complete project JSON export or shareable stages array.
        </p>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-full px-3 py-2 border rounded font-mono text-sm"
            placeholder='{"title": "...", "stages": [...]} or [{"title": "...", ...}]'
            style={{ minHeight: '200px' }}
          />
        </div>
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Import
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// CreateProjectModal Component
const CreateProjectModal = ({ onSave, onClose, existingProjects }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [draftStages, setDraftStages] = useState([]);
  const [expandedStages, setExpandedStages] = useState({});
  const [titleError, setTitleError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const validateTitle = (newTitle) => {
    if (!newTitle.trim()) {
      setTitleError('');
      return false;
    }
    
    const existingTitles = existingProjects.map(p => p.title.toLowerCase());
    if (existingTitles.includes(newTitle.trim().toLowerCase())) {
      setTitleError('A project with this title already exists');
      return false;
    }
    
    setTitleError('');
    return true;
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    validateTitle(newTitle);
  };

  const handleGetSuggestion = () => {
    const newSuggestion = generateSuggestion('project', title || 'new project');
    setSuggestions([...suggestions, newSuggestion]);
  };

  const handleClearSuggestions = () => {
    setSuggestions([]);
  };

  const handleAddStage = () => {
    const newStage = {
      id: generateId(),
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      completed: false,
      subtasks: [],
      shareable: false
    };
    setDraftStages([...draftStages, newStage]);
    setExpandedStages({ ...expandedStages, [newStage.id]: true });
  };

  const handleUpdateStage = (stageId, updates) => {
    setDraftStages(draftStages.map(stage =>
      stage.id === stageId ? { ...stage, ...updates } : stage
    ));
  };

  const handleDeleteStage = (stageId) => {
    setDraftStages(draftStages.filter(stage => stage.id !== stageId));
    const newExpanded = { ...expandedStages };
    delete newExpanded[stageId];
    setExpandedStages(newExpanded);
  };

  const handleAddSubtask = (stageId) => {
    const newSubtask = {
      id: generateId(),
      title: '',
      description: '',
      endDate: '',
      completed: false
    };
    setDraftStages(draftStages.map(stage =>
      stage.id === stageId
        ? { ...stage, subtasks: [...stage.subtasks, newSubtask] }
        : stage
    ));
  };

  const handleUpdateSubtask = (stageId, subtaskId, updates) => {
    setDraftStages(draftStages.map(stage =>
      stage.id === stageId
        ? {
            ...stage,
            subtasks: stage.subtasks.map(st =>
              st.id === subtaskId ? { ...st, ...updates } : st
            )
          }
        : stage
    ));
  };

  const handleDeleteSubtask = (stageId, subtaskId) => {
    setDraftStages(draftStages.map(stage =>
      stage.id === stageId
        ? { ...stage, subtasks: stage.subtasks.filter(st => st.id !== subtaskId) }
        : stage
    ));
  };

  const toggleStageExpanded = (stageId) => {
    setExpandedStages({
      ...expandedStages,
      [stageId]: !expandedStages[stageId]
    });
  };

  const handleSave = () => {
    if (title.trim() && validateTitle(title)) {
      onSave({
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
        stages: draftStages
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Create New Project</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div className="space-y-3 mb-6 pb-6 border-b">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded ${titleError ? 'border-red-500' : ''}`}
                placeholder="Project title"
                autoFocus
              />
              {titleError && (
                <p className="text-red-500 text-sm mt-1">{titleError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Project description (optional)"
                rows={2}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleGetSuggestion}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Get a suggestion
              </button>
              {suggestions.length > 0 && (
                <button
                  onClick={handleClearSuggestions}
                  className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Clear suggestions
                </button>
              )}
            </div>
            
            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    💡 {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Stages</h3>
            {draftStages.length === 0 ? (
              <p className="text-sm text-gray-500 mb-3">No stages yet. Add stages to structure your project.</p>
            ) : (
              <div className="space-y-3 mb-3">
                {draftStages.map((stage) => (
                  <div key={stage.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start gap-2 mb-2">
                      <button
                        onClick={() => toggleStageExpanded(stage.id)}
                        className="text-gray-400 text-sm mt-1"
                      >
                        {expandedStages[stage.id] ? '▼' : '▶'}
                      </button>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={stage.title}
                          onChange={(e) => handleUpdateStage(stage.id, { title: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Stage title"
                        />
                        <textarea
                          value={stage.description}
                          onChange={(e) => handleUpdateStage(stage.id, { description: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Stage description (optional)"
                          rows={1}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={stage.startDate}
                            onChange={(e) => handleUpdateStage(stage.id, { startDate: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-xs"
                            placeholder="Start date"
                          />
                          <input
                            type="date"
                            value={stage.endDate}
                            onChange={(e) => handleUpdateStage(stage.id, { endDate: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-xs"
                            placeholder="End date"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="text-red-500 text-sm px-2 mt-1 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>

                    {expandedStages[stage.id] && (
                      <div className="ml-6 mt-3 space-y-2">
                        <div className="text-xs font-semibold text-gray-600 mb-2">Subtasks</div>
                        {stage.subtasks.map((subtask) => (
                          <div key={subtask.id} className="border rounded p-2 bg-white">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={subtask.title}
                                  onChange={(e) => handleUpdateSubtask(stage.id, subtask.id, { title: e.target.value })}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  placeholder="Subtask title"
                                />
                                <textarea
                                  value={subtask.description}
                                  onChange={(e) => handleUpdateSubtask(stage.id, subtask.id, { description: e.target.value })}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  placeholder="Subtask description (optional)"
                                  rows={1}
                                />
                                <input
                                  type="date"
                                  value={subtask.endDate}
                                  onChange={(e) => handleUpdateSubtask(stage.id, subtask.id, { endDate: e.target.value })}
                                  className="w-full px-2 py-1 border rounded text-xs"
                                  placeholder="End date"
                                />
                              </div>
                              <button
                                onClick={() => handleDeleteSubtask(stage.id, subtask.id)}
                                className="text-red-500 text-xs px-2 mt-1 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddSubtask(stage.id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          + Add Subtask
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleAddStage}
              className="w-full px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
            >
              + Add Stage
            </button>
          </div>
        </div>

        <div className="p-6 border-t bg-white">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!title.trim() || titleError}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
            >
              Save Project
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// CreateStageModal Component
const CreateStageModal = ({ onSave, onClose, existingStages }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [titleError, setTitleError] = useState('');

  const validateTitle = (newTitle) => {
    if (!newTitle.trim()) {
      setTitleError('');
      return false;
    }
    
    const existingTitles = existingStages.map(s => s.title.toLowerCase());
    if (existingTitles.includes(newTitle.trim().toLowerCase())) {
      setTitleError('A stage with this title already exists in this project');
      return false;
    }
    
    setTitleError('');
    return true;
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    validateTitle(newTitle);
  };

  const handleSave = () => {
    if (title.trim() && validateTitle(title)) {
      onSave({
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate
      });
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Create New Stage</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded ${titleError ? 'border-red-500' : ''}`}
              placeholder="Stage title"
              autoFocus
            />
            {titleError && (
              <p className="text-red-500 text-sm mt-1">{titleError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Description (optional)"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!title.trim() || titleError}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create Stage
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ImportModal Component
const ImportModal = ({ onImport, onClose }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [validatedData, setValidatedData] = useState(null);

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      if (!parsed.stages || !Array.isArray(parsed.stages)) {
        throw new Error('Invalid format: must contain "stages" array');
      }

      for (const stage of parsed.stages) {
        if (!stage.title) {
          throw new Error('Invalid stage: missing title');
        }
        if (stage.subtasks && !Array.isArray(stage.subtasks)) {
          throw new Error('Invalid stage: subtasks must be an array');
        }
      }

      setValidatedData(parsed);
      setError('');
    } catch (e) {
      setError(e.message);
      setValidatedData(null);
    }
  };

  const handleImport = () => {
    if (validatedData) {
      onImport(validatedData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <h2 className="text-xl font-bold mb-4">Import Stages</h2>
        <p className="text-sm text-gray-600 mb-3">
          Paste exported JSON data below. Stages will be appended to the current project.
        </p>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-full px-3 py-2 border rounded font-mono text-sm"
            placeholder='{"stages": [...]}'
            style={{ minHeight: '200px' }}
          />
        </div>
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}
        {validatedData && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            ✓ Valid format: {validatedData.stages.length} stage{validatedData.stages.length !== 1 ? 's' : ''} ready to import
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleValidate}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Validate
          </button>
          <button
            onClick={handleImport}
            disabled={!validatedData}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Import
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// SubtaskItem Component
const SubtaskItem = ({ subtask, onToggle, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isEditing) {
      setTitle(subtask.title);
      setDescription(subtask.description || '');
      setEndDate(subtask.endDate || '');
    }
  }, [isEditing, subtask.title, subtask.description, subtask.endDate]);

  const handleSave = () => {
    if (title.trim()) {
      onEdit(subtask.id, { title: title.trim(), description: description.trim(), endDate });
      setIsEditing(false);
      setTitle('');
      setDescription('');
      setEndDate('');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle('');
    setDescription('');
    setEndDate('');
  };

  return (
    <div className="border rounded-lg p-3 bg-white hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={subtask.completed}
          onChange={() => onToggle(subtask.id)}
          className="w-4 h-4 mt-1 cursor-pointer"
        />
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="Subtask title"
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="Description (optional)"
                rows={2}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs"
                placeholder="End date"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-2 py-1 bg-gray-200 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`font-medium text-sm cursor-pointer ${subtask.completed ? 'line-through text-gray-400' : ''}`}
                onClick={() => setIsEditing(true)}
              >
                {subtask.title}
              </div>
              {subtask.description && (
                <div className="text-xs text-gray-600 mt-1">{subtask.description}</div>
              )}
              {subtask.endDate && (
                <div className="text-xs text-gray-500 mt-1">Due: {subtask.endDate}</div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(subtask.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// StageCard Component
const StageCard = ({ stage, onUpdate, onDelete, onMoveUp, onMoveDown, showMove, existingStages, currentStageId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [titleError, setTitleError] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (isEditing) {
      setTitle(stage.title);
      setDescription(stage.description || '');
      setStartDate(stage.startDate || '');
      setEndDate(stage.endDate || '');
      setTitleError('');
    }
  }, [isEditing, stage.title, stage.description, stage.startDate, stage.endDate]);

  const validateTitle = (newTitle) => {
    if (!newTitle.trim()) {
      setTitleError('');
      return false;
    }
    
    const existingTitles = existingStages
      .filter(s => s.id !== currentStageId)
      .map(s => s.title.toLowerCase());
    
    if (existingTitles.includes(newTitle.trim().toLowerCase())) {
      setTitleError('A stage with this title already exists in this project');
      return false;
    }
    
    setTitleError('');
    return true;
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    validateTitle(newTitle);
  };

  const completedSubtasks = stage.subtasks.filter(st => st.completed).length;
  const totalSubtasks = stage.subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleSave = () => {
    if (title.trim() && validateTitle(title)) {
      onUpdate(stage.id, { title: title.trim(), description: description.trim(), startDate, endDate });
      setIsEditing(false);
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setTitleError('');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setTitleError('');
  };

  const handleToggleStage = () => {
    onUpdate(stage.id, { completed: !stage.completed });
  };

  const handleToggleShareable = () => {
    onUpdate(stage.id, { shareable: !stage.shareable });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const updatedStage = {
        ...stage,
        subtasks: [...stage.subtasks, { 
          id: generateId(), 
          title: newSubtask.trim(), 
          description: '',
          endDate: '',
          completed: false 
        }]
      };
      onUpdate(stage.id, updatedStage);
      setNewSubtask('');
    }
  };

  const handleToggleSubtask = (subtaskId) => {
    const updatedSubtasks = stage.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate(stage.id, { subtasks: updatedSubtasks });
  };

  const handleEditSubtask = (subtaskId, updates) => {
    const updatedSubtasks = stage.subtasks.map(st =>
      st.id === subtaskId ? { ...st, ...updates } : st
    );
    onUpdate(stage.id, { subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (subtaskId) => {
    const updatedSubtasks = stage.subtasks.filter(st => st.id !== subtaskId);
    onUpdate(stage.id, { subtasks: updatedSubtasks });
  };

  const handleGetSuggestion = () => {
    const newSuggestion = generateSuggestion('stage', stage.title);
    setSuggestions([...suggestions, newSuggestion]);
  };

  const handleClearSuggestions = () => {
    setSuggestions([]);
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${stage.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={stage.completed}
          onChange={handleToggleStage}
          className="w-5 h-5 mt-1 cursor-pointer"
        />
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded ${titleError ? 'border-red-500' : ''}`}
                placeholder="Stage title"
              />
              {titleError && (
                <p className="text-red-500 text-sm">{titleError}</p>
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="End date"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={titleError}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`text-lg font-semibold cursor-pointer ${stage.completed ? 'line-through text-gray-500' : ''}`}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {stage.title}
                </h3>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-400 text-sm"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>
              {stage.description && (
                <p className="text-sm text-gray-600 mb-2">{stage.description}</p>
              )}
              {(stage.startDate || stage.endDate) && (
                <div className="text-xs text-gray-500 mb-2">
                  {stage.startDate && <span>Start: {stage.startDate}</span>}
                  {stage.startDate && stage.endDate && <span className="mx-1">→</span>}
                  {stage.endDate && <span>End: {stage.endDate}</span>}
                </div>
              )}
              {totalSubtasks > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <span>{completedSubtasks} / {totalSubtasks} subtasks</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(stage.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
                <button
                  onClick={handleToggleShareable}
                  className={`text-sm ${stage.shareable ? 'text-green-600' : 'text-gray-400'} hover:underline`}
                >
                  {stage.shareable ? '✓ Shareable' : 'Mark Shareable'}
                </button>
                {showMove.up && (
                  <button onClick={onMoveUp} className="text-sm text-gray-600 hover:underline">
                    ↑ Move Up
                  </button>
                )}
                {showMove.down && (
                  <button onClick={onMoveDown} className="text-sm text-gray-600 hover:underline">
                    ↓ Move Down
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {isExpanded && !isEditing && (
        <div className="mt-4 pl-8">
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleGetSuggestion}
              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Get a suggestion
            </button>
            {suggestions.length > 0 && (
              <button
                onClick={handleClearSuggestions}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear suggestions
              </button>
            )}
          </div>
          
          {suggestions.length > 0 && (
            <div className="space-y-2 mb-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  💡 {suggestion}
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-2 mb-3">
            {stage.subtasks.map(subtask => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={handleToggleSubtask}
                onEdit={handleEditSubtask}
                onDelete={handleDeleteSubtask}
              />
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              placeholder="Add subtask title..."
              className="flex-1 px-3 py-2 border rounded text-sm"
            />
            <button
              onClick={handleAddSubtask}
              className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ExportPanel Component
const ExportPanel = ({ project, onClose }) => {
  const [copyStatus, setCopyStatus] = useState('');
  const shareableStages = project.stages.filter(s => s.shareable);
  
  const exportData = stripIds({
    projectTitle: project.title,
    projectDescription: project.description,
    stages: shareableStages.map(stage => ({
      title: stage.title,
      description: stage.description,
      startDate: stage.startDate,
      endDate: stage.endDate,
      completed: stage.completed,
      subtasks: stage.subtasks.map(st => ({
        title: st.title,
        description: st.description,
        endDate: st.endDate,
        completed: st.completed
      }))
    }))
  });

  const jsonString = JSON.stringify(exportData, null, 2);

  const handleCopy = async () => {
    const success = await copyToClipboard(jsonString);
    if (success) {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } else {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Export Shareable Stages (Read-Only)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        {shareableStages.length === 0 ? (
          <p className="text-gray-600">No stages marked as shareable. Mark stages as shareable to include them in export.</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              {shareableStages.length} stage{shareableStages.length !== 1 ? 's' : ''} marked as shareable
            </p>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
              <div className="bg-gray-50 rounded border p-4">
                <pre className="text-xs">{jsonString}</pre>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Copy to Clipboard
              </button>
              {copyStatus && (
                <span className={`text-sm ${copyStatus === 'Copied!' ? 'text-green-600' : 'text-red-600'}`}>
                  {copyStatus}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ProjectView Component
const ProjectView = ({ project, projects, onUpdate, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCreateStage, setShowCreateStage] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (isEditing) {
      setTitle(project.title);
      setDescription(project.description || '');
      setStartDate(project.startDate || '');
      setEndDate(project.endDate || '');
      setTitleError('');
    }
  }, [isEditing, project.title, project.description, project.startDate, project.endDate]);

  const validateTitle = (newTitle) => {
    if (!newTitle.trim()) {
      setTitleError('');
      return false;
    }
    
    const existingTitles = projects
      .filter(p => p.id !== project.id)
      .map(p => p.title.toLowerCase());
    
    if (existingTitles.includes(newTitle.trim().toLowerCase())) {
      setTitleError('A project with this title already exists');
      return false;
    }
    
    setTitleError('');
    return true;
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    validateTitle(newTitle);
  };

  const handleSave = () => {
    if (title.trim() && validateTitle(title)) {
      onUpdate({
        ...project,
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate
      });
      setIsEditing(false);
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setTitleError('');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setTitleError('');
  };

  const handleCreateStage = (stageData) => {
    const newStage = {
      id: generateId(),
      title: stageData.title,
      description: stageData.description,
      startDate: stageData.startDate || '',
      endDate: stageData.endDate || '',
      completed: false,
      subtasks: [],
      shareable: false
    };
    onUpdate({
      ...project,
      stages: [...project.stages, newStage]
    });
    setShowCreateStage(false);
  };

  const handleUpdateStage = (stageId, updates) => {
    const updatedStages = project.stages.map(stage =>
      stage.id === stageId ? { ...stage, ...updates } : stage
    );
    onUpdate({ ...project, stages: updatedStages });
  };

  const handleDeleteStage = (stageId) => {
    const updatedStages = project.stages.filter(stage => stage.id !== stageId);
    onUpdate({ ...project, stages: updatedStages });
  };

  const handleMoveStage = (stageId, direction) => {
    const index = project.stages.findIndex(s => s.id === stageId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= project.stages.length) return;

    const updatedStages = [...project.stages];
    [updatedStages[index], updatedStages[newIndex]] = [updatedStages[newIndex], updatedStages[index]];
    onUpdate({ ...project, stages: updatedStages });
  };

  const handleImport = (importedData) => {
    const newStages = importedData.stages.map(stage => ({
      id: generateId(),
      title: stage.title,
      description: stage.description || '',
      startDate: stage.startDate || '',
      endDate: stage.endDate || '',
      completed: stage.completed || false,
      subtasks: (stage.subtasks || []).map(st => ({
        id: generateId(),
        title: st.title,
        description: st.description || '',
        endDate: st.endDate || '',
        completed: st.completed || false
      })),
      shareable: false
    }));

    onUpdate({
      ...project,
      stages: [...project.stages, ...newStages]
    });
    setShowImport(false);
  };

  const handleExportToCalendar = () => {
    exportToGoogleCalendarCSV(project);
  };

  const completedStages = project.stages.filter(s => s.completed).length;
  const totalStages = project.stages.length;
  const overallProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  const handleGetSuggestion = () => {
    const newSuggestion = generateSuggestion('project', project.title);
    setSuggestions([...suggestions, newSuggestion]);
  };

  const handleClearSuggestions = () => {
    setSuggestions([]);
  };

  const stagesWithDates = project.stages.filter(s => s.endDate).length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={onBack}
          className="mb-4 text-blue-600 hover:underline flex items-center gap-1"
        >
          ← Back to Projects
        </button>

        {isEditing ? (
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded ${titleError ? 'border-red-500' : ''}`}
                placeholder="Project title"
              />
              {titleError && (
                <p className="text-red-500 text-sm">{titleError}</p>
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Project description (optional)"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={titleError}
                  className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                {project.description && (
                  <p className="text-gray-600 mb-3">{project.description}</p>
                )}
                {(project.startDate || project.endDate) && (
                  <div className="text-sm text-gray-500">
                    {project.startDate && <span>Start: {project.startDate}</span>}
                    {project.startDate && project.endDate && <span className="mx-2">•</span>}
                    {project.endDate && <span>End: {project.endDate}</span>}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
              >
                Edit Project
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  Overall Progress: {completedStages} / {totalStages} stages
                </span>
                <span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowExport(true)}
                className="px-4 py-2 bg-gray-100 border rounded text-sm hover:bg-gray-200"
              >
                Export Shareable Stages
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="px-4 py-2 bg-gray-100 border rounded text-sm hover:bg-gray-200"
              >
                Import Stages
              </button>
              <button
                onClick={handleExportToCalendar}
                disabled={stagesWithDates === 0}
                className="px-4 py-2 bg-purple-100 border border-purple-300 text-purple-700 rounded text-sm hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                title={stagesWithDates === 0 ? 'Add end dates to stages to export' : `Export ${stagesWithDates} stage(s) to Google Calendar`}
              >
                📅 Export to Google Calendar ({stagesWithDates})
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Stages</h2>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleGetSuggestion}
              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Get a suggestion
            </button>
            {suggestions.length > 0 && (
              <button
                onClick={handleClearSuggestions}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear suggestions
              </button>
            )}
          </div>
          
          {suggestions.length > 0 && (
            <div className="space-y-2 mb-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  💡 {suggestion}
                </div>
              ))}
            </div>
          )}

          {project.stages.length === 0 ? (
            <p className="text-gray-500 mb-4">No stages yet. Add your first stage below.</p>
          ) : (
            project.stages.map((stage, index) => (
              <StageCard
                key={stage.id}
                stage={stage}
                onUpdate={handleUpdateStage}
                onDelete={handleDeleteStage}
                onMoveUp={() => handleMoveStage(stage.id, 'up')}
                onMoveDown={() => handleMoveStage(stage.id, 'down')}
                showMove={{
                  up: index > 0,
                  down: index < project.stages.length - 1
                }}
                existingStages={project.stages}
                currentStageId={stage.id}
              />
            ))
          )}

          <button
            onClick={() => setShowCreateStage(true)}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + New Stage
          </button>
        </div>
      </div>

      {showExport && (
        <ExportPanel
          project={project}
          onClose={() => setShowExport(false)}
        />
      )}

      {showImport && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {showCreateStage && (
        <CreateStageModal
          onSave={handleCreateStage}
          onClose={() => setShowCreateStage(false)}
          existingStages={project.stages}
        />
      )}
    </div>
  );
};

// ProjectList Component
const ProjectList = ({ projects, selectedId, onSelect, onAdd, onDelete, onImport }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProject, setExportProject] = useState(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);

  const handleCreate = (projectData) => {
    onAdd(projectData);
    setShowCreateModal(false);
  };

  const handleDeleteClick = (e, project) => {
    e.stopPropagation();
    setDeleteConfirmProject(project);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmProject) {
      onDelete(deleteConfirmProject.id);
      setDeleteConfirmProject(null);
    }
  };

  const handleExportClick = (e, project) => {
    e.stopPropagation();
    setExportProject(project);
    setShowExportModal(true);
  };

  const handleImport = (project) => {
    onImport(project);
    setShowImportModal(false);
  };

  return (
    <div className="w-full md:w-64 bg-gray-50 border-r p-4 overflow-auto">
      <h2 className="text-xl font-bold mb-4">Projects</h2>
      
      {projects.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">No projects yet</p>
      ) : (
        <div className="space-y-2 mb-4">
          {projects.map(project => (
            <div
              key={project.id}
              className={`p-3 rounded cursor-pointer group ${
                selectedId === project.id ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'
              }`}
            >
              <div
                onClick={() => onSelect(project.id)}
                className="flex-1"
              >
                <div className="font-semibold">{project.title}</div>
                <div className={`text-sm ${selectedId === project.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {project.stages.length} stage{project.stages.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => handleExportClick(e, project)}
                  className={`text-xs px-2 py-1 rounded ${
                    selectedId === project.id 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Export
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, project)}
                  className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + New Project
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Import from JSON
        </button>
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
          existingProjects={projects}
        />
      )}

      {showImportModal && (
        <ImportProjectModal
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
          existingProjects={projects}
        />
      )}

      {showExportModal && exportProject && (
        <ProjectExportModal
          project={exportProject}
          onClose={() => {
            setShowExportModal(false);
            setExportProject(null);
          }}
        />
      )}

      {deleteConfirmProject && (
        <ConfirmDeleteModal
          projectTitle={deleteConfirmProject.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmProject(null)}
        />
      )}
    </div>
  );
};

// Main App Component
export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
  }, []);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const handleAddProject = (projectData) => {
    const newProject = {
      id: generateId(),
      title: projectData.title,
      description: projectData.description,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      stages: projectData.stages || []
    };
    setProjects([...projects, newProject]);
    setSelectedProjectId(newProject.id);
    setMobileMenuOpen(false);
  };

  const handleImportProject = (project) => {
    setProjects([...projects, project]);
    setSelectedProjectId(project.id);
    setMobileMenuOpen(false);
  };

  const handleDeleteProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  };

  const handleUpdateProject = (updatedProject) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setMobileMenuOpen(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TaskSplits</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {(!selectedProjectId || mobileMenuOpen) && (
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
          <ProjectList
            projects={projects}
            selectedId={selectedProjectId}
            onSelect={(id) => {
              setSelectedProjectId(id);
              setMobileMenuOpen(false);
            }}
            onAdd={handleAddProject}
            onDelete={handleDeleteProject}
            onImport={handleImportProject}
          />
        </div>
      )}

      {selectedProject ? (
        <ProjectView
          project={selectedProject}
          projects={projects}
          onUpdate={handleUpdateProject}
          onBack={handleBackToProjects}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-xl mb-2">No project selected</p>
            <p className="text-sm">Create a new project to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}