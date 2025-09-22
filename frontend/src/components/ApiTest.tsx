import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

const ApiTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [routes, setRoutes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test health endpoint
        const healthResponse = await apiClient.healthCheck();
        setStatus(`✅ Backend connected: ${healthResponse.message}`);
        
        // Test debug routes endpoint
        const routesResponse = await apiClient.getDebugRoutes();
        setRoutes(routesResponse.routes || []);
        
        setError(null);
      } catch (err) {
        setStatus('❌ Backend connection failed');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Frontend-Backend Integration Test</h2>
      
      <div className="mb-4">
        <p className="text-lg">{status}</p>
        {error && (
          <p className="text-red-600 mt-2">Error: {error}</p>
        )}
      </div>

      {routes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Available API Routes:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {routes.map((route, index) => (
              <div key={index} className="bg-gray-100 p-2 rounded text-sm">
                <span className="font-mono text-blue-600">
                  {route.methods?.join(', ').toUpperCase()}
                </span>
                <span className="ml-2 font-mono">{route.path}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTest;

