import React, { useState } from 'react';
import { dhanAPI } from '../services/dhanAPI';

const APIKeyPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!apiKey || !clientId) {
      setError('API Key and Client ID are required');
      return;
    }

    // Save credentials and set them in the API service
    localStorage.setItem('dhanCreds', JSON.stringify({ apiKey, clientId }));
    dhanAPI.setCredentials({ apiKey, clientId });

    try {
      const result = await dhanAPI.getFundLimit(); // ✅ Your usage
      setResponse(result);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch fund limit.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Enter Dhan API Credentials</h2>
      <input
        type="text"
        placeholder="API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="w-full border p-2 mb-4 rounded"
      />
      <input
        type="text"
        placeholder="Client ID"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="w-full border p-2 mb-4 rounded"
      />
      <button
        onClick={handleFetch}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Save & Fetch Fund Limit
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {response && (
        <pre className="bg-gray-100 mt-4 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default APIKeyPage;
