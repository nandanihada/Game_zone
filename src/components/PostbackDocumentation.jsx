import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const PostbackDocumentation = () => {
  const codeExample = `// Example: Sending a POST postback\nconst sendPostback = async () => {\n  const response = await fetch('/api/proxy-post', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({\n      url: 'https://your-endpoint.com/postback',\n      data: {\n        event: 'conversion',\n        user_id: '12345',\n        amount: 9.99,\n        currency: 'USD',\n        timestamp: new Date().toISOString()\n      }\n    })\n  });\n  return await response.json();\n};\n\n// Example: Sending a GET postback\nconst sendGetPostback = async () => {\n  const params = new URLSearchParams({\n    event: 'conversion',\n    user_id: '12345',\n    amount: '9.99',\n    currency: 'USD',\n    timestamp: new Date().toISOString()\n  });\n  \n  const response = await fetch(\`/api/proxy-get?target=\${encodeURIComponent(\`https://your-endpoint.com/postback?\${params}\`)}\`);\n  return await response.json();\n};`;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', color: '#333' }}>
      <h1 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Postback Integration Guide</h1>
      
      <section style={{ margin: '30px 0' }}>
        <h2 style={{ color: '#3498db' }}>What is a Postback?</h2>
        <p style={{ lineHeight: '1.6' }}>
          A postback is an HTTP request sent from a server to another server to notify about an event or transaction. 
          It's commonly used in tracking conversions, payments, or other important events in affiliate marketing, 
          mobile advertising, and web analytics.
        </p>
      </section>

      <section style={{ margin: '30px 0' }}>
        <h2 style={{ color: '#3498db' }}>How to Send Postbacks</h2>
        
        <h3 style={{ color: '#2c3e50', marginTop: '20px' }}>1. Using the Postback Sender</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Navigate to the <strong>Postback Sender</strong> in the dashboard</li>
          <li>Enter the target URL in the Base URL field</li>
          <li>Select the HTTP method (GET or POST)</li>
          <li>Configure the required parameters in the Core Fields and Custom Fields sections</li>
          <li>Click "Send Postback" to execute the request</li>
        </ol>

        <h3 style={{ color: '#2c3e50', marginTop: '20px' }}>2. Programmatic Integration</h3>
        <p>You can also send postbacks programmatically using our API:</p>
        
        <div style={{ margin: '20px 0', borderRadius: '6px', overflow: 'hidden' }}>
          <SyntaxHighlighter language="javascript" style={atomDark}>
            {codeExample}
          </SyntaxHighlighter>
        </div>
      </section>

      <section style={{ margin: '30px 0' }}>
        <h2 style={{ color: '#3498db' }}>Receiving Postbacks</h2>
        
        <h3 style={{ color: '#2c3e50', marginTop: '20px' }}>1. Setting Up Your Endpoint</h3>
        <p>To receive postbacks, you need to set up a web server with an endpoint that can handle HTTP requests. Here's what you need to do:</p>
        
        <ol style={{ lineHeight: '1.8' }}>
          <li>Create an endpoint (e.g., <code>/postback</code>) on your server</li>
          <li>Configure it to accept both GET and POST requests</li>
          <li>Parse the incoming request parameters or body</li>
          <li>Return a 200 OK response when the postback is successfully processed</li>
        </ol>

        <h3 style={{ color: '#2c3e50', marginTop: '20px' }}>2. Testing Your Endpoint</h3>
        <p>You can test your endpoint using the Postback Sender before going live:</p>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Enter your endpoint URL in the Base URL field</li>
          <li>Add the required parameters</li>
          <li>Click "Send Postback" and check the response</li>
        </ol>
      </section>

      <section style={{ margin: '30px 0' }}>
        <h2 style={{ color: '#3498db' }}>Best Practices</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Always validate and sanitize incoming postback data</li>
          <li>Implement proper error handling and logging</li>
          <li>Use HTTPS for all postback URLs</li>
          <li>Consider implementing IP whitelisting for additional security</li>
          <li>Set up monitoring for your postback endpoints</li>
          <li>Implement retry logic for failed postbacks</li>
        </ul>
      </section>

      <section style={{ margin: '30px 0', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h3 style={{ color: '#2c3e50', marginTop: '0' }}>Need Help?</h3>
        <p>If you have any questions or run into issues, please contact our support team at <a href="mailto:support@example.com" style={{ color: '#3498db', textDecoration: 'none' }}>support@example.com</a>.</p>
      </section>
    </div>
  );
};

export default PostbackDocumentation;
