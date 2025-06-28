'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!selectedFile) {
      setMessage('Please select a .docx file.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('docxFile', selectedFile);

    try {
      const response = await fetch('/api/process-doc', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'competition_results.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setMessage('CSV generated and downloaded successfully!');
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error || 'Something went wrong'}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Ballroom Competition Results to CSV</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-4">
          <label htmlFor="docxFile" className="block text-gray-700 text-sm font-bold mb-2">
            Upload .docx File:
          </label>
          <input
            type="file"
            id="docxFile"
            accept=".docx"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={handleFileChange}
            required
          />
        </div>
        <button
          type="submit"
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Generate CSV'}
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-center ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}