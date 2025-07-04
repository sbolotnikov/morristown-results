'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState<'docx' | 'pdf'>('docx');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDebugPDF = async () => {
    if (!selectedFile || fileType !== 'pdf') {
      setMessage('Please select a PDF file first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

    try {
      const response = await fetch('/api/debug-pdf', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
        setMessage(
          `Debug successful! Extracted ${data.totalLines} lines. Check debug section below.`
        );
      } else {
        const errorData = await response.json();
        setMessage(`Debug Error: ${errorData.error}`);
      }
    } catch (error: any) {
      setMessage(`Debug Error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!selectedFile) {
      setMessage(
        `Please select a ${fileType === 'docx' ? '.docx' : '.pdf'} file.`
      );
      setLoading(false);
      return;
    }

    const formData = new FormData();

    if (fileType === 'pdf') {
      formData.append('pdfFile', selectedFile);

      try {
        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          // Handle CSV download for PDF files
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'competition_results_from_pdf.csv';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setMessage('CSV generated and downloaded successfully from PDF!');
        } else {
          const errorData = await response.json();
          let errorMessage = `Error: ${
            errorData.error || 'Something went wrong'
          }`;

          // If there's debug info, add it to help with troubleshooting
          if (errorData.debug) {
            errorMessage += `\n\nDebug Info:\n- Total lines extracted: ${
              errorData.debug.totalLines
            }\n- Sample lines: ${errorData.debug.sampleLines
              ?.slice(0, 5)
              .join(', ')}`;
            console.log('Full debug info:', errorData.debug);
          }

          setMessage(errorMessage);
        }
      } catch (error: any) {
        setMessage(`Error: ${error.message || 'Network error'}`);
      }
    } else {
      // Original DOCX processing
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
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">
        Ballroom Competition Results Processor
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mb-6"
      >
        {/* File Type Selection */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select File Type:
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="fileType"
                value="docx"
                checked={fileType === 'docx'}
                onChange={(e) => setFileType(e.target.value as 'docx' | 'pdf')}
                className="mr-2"
              />
              DOCX File
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="fileType"
                value="pdf"
                checked={fileType === 'pdf'}
                onChange={(e) => setFileType(e.target.value as 'docx' | 'pdf')}
                className="mr-2"
              />
              PDF File
            </label>
          </div>
        </div>

        {/* File Input */}
        <div className="mb-4">
          <label
            htmlFor="file"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Upload {fileType === 'docx' ? '.docx' : '.pdf'} File:
          </label>
          <input
            type="file"
            id="file"
            accept={fileType === 'docx' ? '.docx' : '.pdf'}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={handleFileChange}
            required
          />
        </div>

        <button
          type="submit"
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-2 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Generate CSV'}
        </button>

        {/* Debug button for PDF files */}
        {fileType === 'pdf' && (
          <button
            type="button"
            onClick={handleDebugPDF}
            className={`bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            Debug PDF (Show Extracted Text)
          </button>
        )}
      </form>

      {/* Message Display */}
      {message && (
        <p
          className={`text-center ${
            message.startsWith('Error') ? 'text-red-500' : 'text-green-500'
          }`}
        >
          {message}
        </p>
      )}

      {/* Debug Info Display */}
      {debugInfo && (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Debug Information
          </h2>
          <div className="mb-4">
            <p>
              <strong>Total Lines:</strong> {debugInfo.totalLines}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">First 20 Lines:</h3>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded p-4 bg-gray-50">
              {debugInfo.lines
                ?.slice(0, 20)
                .map((line: string, index: number) => (
                  <div key={index} className="mb-1 text-sm">
                    <span className="text-blue-600 mr-2">{index + 1}:</span>
                    <span className="font-mono">{line}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Pattern Analysis:</h3>
            <div className="text-sm">
              <p>
                <strong>Looking for student/teacher pattern:</strong> Name/Name
                (#number) [Location]
              </p>
              <p>
                <strong>Looking for place pattern:</strong> Number or Number
                [Score]
              </p>
              <p>
                <strong>Looking for heat pattern:</strong> Heat/Solo + Number
              </p>

              {debugInfo.lines && (
                <div className="mt-2">
                  <p>
                    <strong>Lines matching student/teacher pattern:</strong>
                  </p>
                  {debugInfo.lines
                    .filter((line: string) =>
                      /^(.+?)\/(.+?)\s*\(#\d+\)\s*\[.+?\]$|^(.+?)\s*\(#\d+\)\/(.+?)\s*\[.+?\]$/.test(
                        line
                      )
                    )
                    .slice(0, 5)
                    .map((line: string, index: number) => (
                      <div
                        key={index}
                        className="text-green-600 font-mono text-xs ml-4"
                      >
                        ✓ {line}
                      </div>
                    ))}

                  <p className="mt-2">
                    <strong>Lines matching place pattern:</strong>
                  </p>
                  {debugInfo.lines
                    .filter((line: string) =>
                      /^(\d+)(?:\s*\[(\d+\.?\d*)\])?$/.test(line)
                    )
                    .slice(0, 5)
                    .map((line: string, index: number) => (
                      <div
                        key={index}
                        className="text-blue-600 font-mono text-xs ml-4"
                      >
                        ✓ {line}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
