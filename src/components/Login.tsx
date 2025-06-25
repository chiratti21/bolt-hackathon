// Login.tsx (ตรวจสอบให้แน่ใจว่าเป็นโค้ดนี้)
import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (username: string) => void; // ควรรับ username มาด้วย
  onNavigateToRegister: () => void;
}

export default function Login({ onLoginSuccess, onNavigateToRegister }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/login', { // ยังคง fetch ไปที่ backend ของเรา
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.username); // เรียก onLoginSuccess ซึ่งจะไปอัปเดตสถานะใน AuthContext
      } else {
        setError(data.msg || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-zinc-800 to-stone-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-xl text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Login</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-white/80">
          Don't have an account?{' '}
          <button
            onClick={onNavigateToRegister}
            className="text-blue-300 hover:underline font-semibold"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}