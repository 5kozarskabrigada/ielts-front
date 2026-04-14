import React, { useState, useEffect } from "react";
import { useAuth } from "../../authContext";
import { apiGetScoringConfigs, apiUpdateScoringConfig } from "../../api";
import { Save, RefreshCw } from "lucide-react";

const DEFAULT_LISTENING_BAND_TABLE = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 32, max: 34, band: 7.5 },
  { min: 30, max: 31, band: 7.0 },
  { min: 26, max: 29, band: 6.5 },
  { min: 23, max: 25, band: 6.0 },
  { min: 18, max: 22, band: 5.5 },
  { min: 16, max: 17, band: 5.0 },
  { min: 13, max: 15, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 0, max: 9, band: 0.0 },
];

const DEFAULT_READING_ACADEMIC_BAND_TABLE = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 27, max: 29, band: 6.5 },
  { min: 23, max: 26, band: 6.0 },
  { min: 19, max: 22, band: 5.5 },
  { min: 15, max: 18, band: 5.0 },
  { min: 13, max: 14, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 8, max: 9, band: 3.5 },
  { min: 6, max: 7, band: 3.0 },
  { min: 4, max: 5, band: 2.5 },
  { min: 3, max: 3, band: 2.0 },
  { min: 2, max: 2, band: 1.5 },
  { min: 1, max: 1, band: 1.0 },
  { min: 0, max: 0, band: 0.0 },
];

const normalizeBandTable = (rawTable, fallbackTable) => {
  let parsed = rawTable;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }

  if (!Array.isArray(parsed)) {
    return [...fallbackTable];
  }

  const normalized = parsed
    .map((row) => {
      const min = Number(row?.min);
      const max = Number(row?.max);
      const band = Number(row?.band);
      if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(band)) return null;
      return { min, max, band };
    })
    .filter(Boolean)
    .sort((a, b) => b.max - a.max);

  return normalized.length > 0 ? normalized : [...fallbackTable];
};

export default function SettingsPage() {
  const { token } = useAuth();
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("listening");

  useEffect(() => {
    fetchConfigs();
  }, [token]);

  const fetchConfigs = async () => {
    try {
      const data = await apiGetScoringConfigs(token);
      const configMap = {};
      data.forEach(item => {
        configMap[item.config_key] = item.config_value;
      });

      configMap.ielts_listening_band = normalizeBandTable(
        configMap.ielts_listening_band,
        DEFAULT_LISTENING_BAND_TABLE
      );
      configMap.ielts_reading_academic_band = normalizeBandTable(
        configMap.ielts_reading_academic_band,
        DEFAULT_READING_ACADEMIC_BAND_TABLE
      );

      setConfigs(configMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      await apiUpdateScoringConfig(token, key, value);
      setConfigs(prev => ({ ...prev, [key]: value }));
      alert("Settings saved!");
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  const renderBandTable = (key) => {
    const bands = Array.isArray(configs[key]) ? configs[key] : [];
    return (
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 font-medium">Min Score</th>
              <th className="p-3 font-medium">Max Score</th>
              <th className="p-3 font-medium">IELTS Band</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bands.map((row, idx) => (
              <tr key={idx}>
                <td className="p-3">
                  <input 
                    type="number" 
                    className="w-16 border rounded p-1"
                    value={row.min} 
                    onChange={(e) => {
                      const newBands = [...bands];
                      newBands[idx].min = parseInt(e.target.value);
                      setConfigs({ ...configs, [key]: newBands });
                    }}
                  />
                </td>
                <td className="p-3">
                  <input 
                    type="number" 
                    className="w-16 border rounded p-1"
                    value={row.max}
                    onChange={(e) => {
                      const newBands = [...bands];
                      newBands[idx].max = parseInt(e.target.value);
                      setConfigs({ ...configs, [key]: newBands });
                    }}
                  />
                </td>
                <td className="p-3 font-bold text-blue-600">{row.band}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button 
            onClick={() => handleSave(key, bands)}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-blue-700"
          >
            <Save size={16} /> <span>Save Table</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>

      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {['listening', 'reading', 'writing', 'system'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-md text-sm font-medium capitalize transition ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} Scoring
          </button>
        ))}
      </div>

      {activeTab === 'listening' && (
        <div>
          <h2 className="text-lg font-bold mb-4">Listening Band Conversion</h2>
          {renderBandTable('ielts_listening_band')}
        </div>
      )}

      {activeTab === 'reading' && (
        <div>
           <div className="mb-4 bg-yellow-50 p-4 rounded text-sm text-yellow-800 border border-yellow-200">
            Note: Academic and General Training reading modules use different scoring tables.
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <h3 className="font-bold mb-2">Academic Reading</h3>
               {renderBandTable('ielts_reading_academic_band')}
             </div>
           </div>
        </div>
      )}
      
      {activeTab === 'system' && (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">AI Scoring Model</label>
             <select className="w-full max-w-xs border rounded p-2 bg-gray-50">
               <option>GPT-4o (Recommended)</option>
               <option>GPT-3.5 Turbo</option>
               <option>Disabled (Manual Grading)</option>
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Exam Timer Defaults</label>
             <div className="grid grid-cols-3 gap-4 max-w-lg">
               <div>
                 <span className="text-xs text-gray-500">Listening</span>
                 <input type="number" value="30" className="w-full border rounded p-2" disabled />
               </div>
               <div>
                 <span className="text-xs text-gray-500">Reading</span>
                 <input type="number" value="60" className="w-full border rounded p-2" disabled />
               </div>
               <div>
                 <span className="text-xs text-gray-500">Writing</span>
                 <input type="number" value="60" className="w-full border rounded p-2" disabled />
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
