import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { apiUploadPassageImage } from "../../api";

export default function GroupImageUploader({ imageUrl, onChange, description, onDescriptionChange }) {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { url } = await apiUploadPassageImage(formData);
      onChange(url);
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 mt-4">
      <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Group Image</h5>
      <div className="flex gap-2 items-center">
        <input
          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none"
          placeholder="https://example.com/group-image.png"
          value={imageUrl || ""}
          onChange={e => onChange(e.target.value)}
        />
        <button
          type="button"
          className="p-2 bg-blue-100 rounded hover:bg-blue-200 border border-blue-200"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={18} />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <textarea
        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:border-blue-400 outline-none mt-2"
        placeholder="Describe the image for accessibility (optional)"
        rows={2}
        value={description || ""}
        onChange={e => onDescriptionChange(e.target.value)}
      />
      {uploading && <div className="text-xs text-blue-600">Uploading...</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
      {imageUrl && (
        <div className="bg-white rounded-lg border border-blue-200 p-2 mt-2">
          <img
            src={imageUrl}
            alt={description || "Group image preview"}
            className="max-h-48 mx-auto rounded"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}
