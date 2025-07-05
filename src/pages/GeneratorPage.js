import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const GeneratorPage = () => {
  const { isAuthenticated, logout } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('chatgpt');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setContent('');
    try {
      const response = await api.post('/api/generate', { model, prompt });
      setContent(response.data.content);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    const backendLoginUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/auth/google/login`;
    return (
      <div>
        <h1>Welcome to Content Generator</h1>
        <a href={backendLoginUrl}>Login with Google</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Content Generator</h1>
      <button onClick={logout}>Logout</button>
      <form onSubmit={handleGenerate}>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="chatgpt">ChatGPT</option>
          <option value="gemini">Gemini</option>
          <option value="dalle">DALL-E</option>
          <option value="deepseek">DeepSeek</option>
        </select>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter your prompt" required />
        <button type="submit" disabled={loading}>{loading ? 'Generating...' : 'Generate'}</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {content && <div><h2>Generated Content:</h2><p>{content}</p></div>}
    </div>
  );
};

export default GeneratorPage;