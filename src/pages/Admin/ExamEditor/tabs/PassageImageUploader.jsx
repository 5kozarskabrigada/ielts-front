import React from "react";

// For use in ReadingTab.jsx
export default function PassageImageUploader({ imageUrl, onChange, description, onDescriptionChange }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 mt-4">
      <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Passage Image</h5>
      <input
        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none"
        placeholder="https://example.com/passage-image.png"
        value={imageUrl || ""}
        onChange={e => onChange(e.target.value)}
      />
      <textarea
        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none mt-2"
        placeholder="Describe the image for accessibility (optional)"
        rows={2}
        value={description || ""}
        onChange={e => onDescriptionChange(e.target.value)}
      />
      {imageUrl && (
        <div className="bg-white rounded-lg border border-blue-200 p-2 mt-2">
          <img 
            src={imageUrl} 
            alt={description || "Passage image preview"} 
            className="max-h-48 mx-auto rounded"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}
