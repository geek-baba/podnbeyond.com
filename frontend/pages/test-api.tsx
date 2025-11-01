import { useEffect, useState } from 'react';
import axios from 'axios';

export default function TestAPI() {
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    async function testAPIs() {
      const tests: any = {
        envVar: process.env.NEXT_PUBLIC_API_URL,
        timestamp: new Date().toISOString()
      };

      // Test 1: Direct localhost call
      try {
        const res1 = await axios.get('http://localhost:4000/api/health');
        tests.directLocalhost = { success: true, data: res1.data };
      } catch (err: any) {
        tests.directLocalhost = { success: false, error: err.message };
      }

      // Test 2: Using env variable
      try {
        const res2 = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/health`);
        tests.viaEnvVar = { success: true, data: res2.data };
      } catch (err: any) {
        tests.viaEnvVar = { success: false, error: err.message };
      }

      // Test 3: Properties API
      try {
        const res3 = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`);
        tests.propertiesAPI = { 
          success: true, 
          count: res3.data.count,
          properties: res3.data.properties?.map((p: any) => p.name) 
        };
      } catch (err: any) {
        tests.propertiesAPI = { success: false, error: err.message };
      }

      setResults(tests);
    }

    testAPIs();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>API Connection Test</h1>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        overflow: 'auto' 
      }}>
        {JSON.stringify(results, null, 2)}
      </pre>
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          ← Back to Home
        </a>
      </div>
    </div>
  );
}

