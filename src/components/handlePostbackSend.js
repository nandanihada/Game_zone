// Updated handlePostbackSend function for Dashboard.jsx
// Replace the existing handlePostbackSend function with this one

const handlePostbackSend = async (e) => {
  e.preventDefault();
  setPostbackLoading(true);
  setPostbackResponse(null);
  
  try {
    let response, result;
    
    if (postbackMethod === 'GET') {
      // Use the new proxy endpoint for GET requests
      const proxyUrl = `/api/proxy-get?target=${encodeURIComponent(previewUrl)}`;
      console.log('Sending GET request to proxy:', proxyUrl);
      
      response = await fetch(proxyUrl, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      result = await response.json();
      
      // Save the postback to the server's received postbacks
      await fetch('/api/receive-postback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          url: previewUrl,
          status: response.status,
          headers: {},
          query: Object.fromEntries(new URL(previewUrl).searchParams),
          body: result,
          ip: '127.0.0.1' // This would be the client IP in a real scenario
        })
      });
      
      setPostbackResponse({
        status: response.status,
        data: result,
        headers: Object.fromEntries(response.headers.entries())
      });
      
    } else {
      // Use the new proxy endpoint for POST requests
      console.log('Sending POST request to:', postbackUrl);
      console.log('Payload:', postPayload);
      
      response = await fetch('/api/proxy-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: postbackUrl,
          data: postPayload
        })
      });
      
      result = await response.json();
      
      // Save the postback to the server's received postbacks
      await fetch('/api/receive-postback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'POST',
          url: postbackUrl,
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
          body: postPayload,
          response: result,
          ip: '127.0.0.1' // This would be the client IP in a real scenario
        })
      });
      
      setPostbackResponse({
        status: response.status,
        status_text: response.statusText,
        data: result,
        headers: Object.fromEntries(response.headers.entries())
      });
    }
    
  } catch (err) {
    console.error('Error sending postback:', err);
    setPostbackResponse({ 
      error: 'Failed to send postback',
      details: err.message 
    });
  } finally {
    setPostbackLoading(false);
  }
};
