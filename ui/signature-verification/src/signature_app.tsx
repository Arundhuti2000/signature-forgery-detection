import React, { useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Configuration
const API_BASE_URL = 'http://localhost:5000'; // Flask API URL

// Main component
export default function SignatureVerificationApp() {
  const [mode, setMode] = useState('single'); // 'single' or 'compare'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  
  // Single verification state
  const [singleSignature, setSingleSignature] = useState(null);
  const [singleResult, setSingleResult] = useState(null);
  
  // Compare mode state
  const [referenceSignature, setReferenceSignature] = useState(null);
  const [testSignatures, setTestSignatures] = useState([]);
  const [compareResults, setCompareResults] = useState(null);
  
  // Check API status when component mounts
  useEffect(() => {
    checkApiStatus();
  }, []);
  
  // Check if the API is running
  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      if (response.ok) {
        const data = await response.json();
        setApiStatus(data.status === 'ready' ? 'ready' : 'loading');
      } else {
        setApiStatus('error');
      }
    } catch (err) {
      setApiStatus('offline');
    }
  };
  
  // Handle file selection
  const handleFileSelect = (event, type) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onloadend = () => {
      // Get base64 string without the prefix
      const base64String = reader.result.toString().split(',')[1];
      
      if (type === 'single') {
        setSingleSignature({
          file: file,
          preview: reader.result,
          base64: base64String
        });
        setSingleResult(null);
      } else if (type === 'reference') {
        setReferenceSignature({
          file: file,
          preview: reader.result,
          base64: base64String
        });
        setCompareResults(null);
      } else if (type === 'test') {
        setTestSignatures([...testSignatures, {
          id: Date.now(),
          file: file,
          preview: reader.result,
          base64: base64String
        }]);
        setCompareResults(null);
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  // Remove a test signature
  const removeTestSignature = (id) => {
    setTestSignatures(testSignatures.filter(sig => sig.id !== id));
    setCompareResults(null);
  };
  
  // Verify single signature
  const verifySingleSignature = async () => {
    if (!singleSignature) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/verify/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: singleSignature.base64
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server responded with an error');
      }
      
      const data = await response.json();
      setSingleResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Compare signatures
  const compareSignatures = async () => {
    if (!referenceSignature || testSignatures.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/verify/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference_signature: referenceSignature.base64,
          test_signatures: testSignatures.map(sig => sig.base64)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server responded with an error');
      }
      
      const data = await response.json();
      setCompareResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset all states
  const resetAll = () => {
    setSingleSignature(null);
    setSingleResult(null);
    setReferenceSignature(null);
    setTestSignatures([]);
    setCompareResults(null);
    setError(null);
  };
  
  // Show API status message if not ready
  if (apiStatus !== 'ready') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">Signature Verification System</h1>
            <p className="text-blue-100">Detect forged signatures using machine learning</p>
          </div>
        </header>
        
        <main className="container mx-auto p-4 flex-grow flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {apiStatus === 'checking' && 'Checking API Status...'}
              {apiStatus === 'loading' && 'API is starting up...'}
              {apiStatus === 'error' && 'API Error'}
              {apiStatus === 'offline' && 'API is Offline'}
            </h2>
            <p className="text-gray-600 mb-6">
              {apiStatus === 'checking' && 'Please wait while we check the API connection...'}
              {apiStatus === 'loading' && 'The model is being loaded. This may take a moment...'}
              {apiStatus === 'error' && 'The API is running but there was an error loading the model.'}
              {apiStatus === 'offline' && 'Cannot connect to the API server. Please make sure the Flask server is running.'}
            </p>
            <button
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
              onClick={checkApiStatus}
            >
              Retry Connection
            </button>
          </div>
        </main>
        
        <footer className="bg-gray-800 text-white p-4 mt-8">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-300">
                Signature Verification System © 2025
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Signature Verification System</h1>
          <p className="text-blue-100">Detect forged signatures using machine learning</p>
        </div>
      </header>
      
      <main className="container mx-auto p-4 flex-grow">
        {/* Mode Selection */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${mode === 'single' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setMode('single')}
            >
              Single Verification
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${mode === 'compare' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setMode('compare')}
            >
              Compare Signatures
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="mr-2" size={20} />
            {error}
          </div>
        )}
        
        {/* Single Verification Mode */}
        {mode === 'single' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Verify a Signature</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Signature
              </label>
              
              {singleSignature ? (
                <div className="relative">
                  <img 
                    src={singleSignature.preview} 
                    alt="Signature to verify" 
                    className="max-h-48 border rounded-md p-2 bg-gray-50"
                  />
                  <button 
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    onClick={() => {
                      setSingleSignature(null);
                      setSingleResult(null);
                    }}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG or JPEG
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'single')}
                    />
                  </label>
                </div>
              )}
            </div>
            
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={verifySingleSignature}
              disabled={!singleSignature || loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Verifying...
                </span>
              ) : (
                'Verify Signature'
              )}
            </button>
            
            {/* Results */}
            {singleResult && (
              <div className="mt-8 border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-2">Verification Result</h3>
                
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-full ${singleResult.is_authentic ? 'bg-green-100' : 'bg-red-100'}`}>
                    {singleResult.is_authentic ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-medium">
                      {singleResult.is_authentic ? 'Authentic Signature' : 'Forged Signature'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Confidence: {Math.round(singleResult.confidence * 100)}%
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Real Probability</p>
                    <div className="mt-1 relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                        <div 
                          style={{ width: `${Math.round(singleResult.real_probability * 100)}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                        ></div>
                      </div>
                      <p className="text-right text-sm font-medium mt-1">
                        {Math.round(singleResult.real_probability * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Forged Probability</p>
                    <div className="mt-1 relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                        <div 
                          style={{ width: `${Math.round(singleResult.forged_probability * 100)}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                        ></div>
                      </div>
                      <p className="text-right text-sm font-medium mt-1">
                        {Math.round(singleResult.forged_probability * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Compare Mode */}
        {mode === 'compare' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Compare Signatures</h2>
            
            {/* Reference Signature */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Signature (Known Authentic)
              </label>
              
              {referenceSignature ? (
                <div className="relative">
                  <img 
                    src={referenceSignature.preview} 
                    alt="Reference signature" 
                    className="max-h-48 border rounded-md p-2 bg-gray-50"
                  />
                  <button 
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    onClick={() => {
                      setReferenceSignature(null);
                      setCompareResults(null);
                    }}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG or JPEG
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'reference')}
                    />
                  </label>
                </div>
              )}
            </div>
            
            {/* Test Signatures */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Signatures (To Verify)
              </label>
              
              {testSignatures.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {testSignatures.map((sig) => (
                    <div key={sig.id} className="relative">
                      <img 
                        src={sig.preview} 
                        alt="Test signature" 
                        className="h-32 object-contain border rounded-md p-2 bg-gray-50"
                      />
                      <button 
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        onClick={() => removeTestSignature(sig.id)}
                      >
                        <XCircle size={16} />
                      </button>
                      
                      {/* Show result for this signature if available */}
                      {compareResults && (
                        <div className={`absolute bottom-2 right-2 p-1 rounded-full ${
                          compareResults.results.find(r => r.signature_index === testSignatures.findIndex(t => t.id === sig.id))?.result.is_authentic
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}>
                          {compareResults.results.find(r => r.signature_index === testSignatures.findIndex(t => t.id === sig.id))?.result.is_authentic
                            ? <CheckCircle size={16} className="text-white" />
                            : <XCircle size={16} className="text-white" />
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or JPEG (add multiple signatures)
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'test')}
                  />
                </label>
              </div>
            </div>
            
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={compareSignatures}
              disabled={!referenceSignature || testSignatures.length === 0 || loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Comparing...
                </span>
              ) : (
                'Compare Signatures'
              )}
            </button>
            
            {/* Compare Results */}
            {compareResults && (
              <div className="mt-8 border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-2">Comparison Results</h3>
                
                {/* Reference signature verification */}
                <div className="mb-4 p-3 border rounded bg-white">
                  <p className="text-sm font-medium mb-2">Reference Signature:</p>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${compareResults.reference_signature.is_authentic ? 'bg-green-100' : 'bg-red-100'}`}>
                      {compareResults.reference_signature.is_authentic ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">
                        {compareResults.reference_signature.is_authentic 
                          ? 'Authentic' 
                          : 'Warning: Reference signature appears to be forged'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Confidence: {Math.round(compareResults.reference_signature.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 border rounded bg-white">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{compareResults.summary.total}</p>
                  </div>
                  <div className="p-3 border rounded bg-white">
                    <p className="text-sm text-gray-600">Authentic</p>
                    <p className="text-2xl font-bold text-green-600">{compareResults.summary.authentic}</p>
                  </div>
                  <div className="p-3 border rounded bg-white">
                    <p className="text-sm text-gray-600">Forged</p>
                    <p className="text-2xl font-bold text-red-600">{compareResults.summary.forged}</p>
                  </div>
                </div>
                
                {/* Detailed results */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Signature
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Result
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Confidence
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Real Prob.
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Forged Prob.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {compareResults.results.map((result) => (
                        <tr key={result.signature_index}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-900">Signature {result.signature_index + 1}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              result.result.is_authentic
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.result.is_authentic ? 'Authentic' : 'Forged'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {Math.round(result.result.confidence * 100)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-green-600 h-2.5 rounded-full" 
                                style={{ width: `${Math.round(result.result.real_probability * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {Math.round(result.result.real_probability * 100)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-red-600 h-2.5 rounded-full" 
                                style={{ width: `${Math.round(result.result.forged_probability * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {Math.round(result.result.forged_probability * 100)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-300">
              Signature Verification System © 2025
            </p>
            <div className="mt-4 md:mt-0">
              <button
                className="text-sm text-gray-300 hover:text-white"
                onClick={resetAll}
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}