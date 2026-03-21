import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import ErrorMessage from '../components/error';
const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isError,setIsError]  = useState(false);
  const [errMessage,setErrMessage]  = useState('');
  const navigate = useNavigate()

  const handleCloseError = () => {
    setIsError(false);
    setErrMessage("");
  };
  const handleChange = async(e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    try{
        const res = await axios.post(
            'http://127.0.0.1:8000/api/login/',
            formData
        );

        localStorage.setItem("access",res.data.access);
        localStorage.setItem("refresh",res.data.refresh);

        navigate('/home')
    }catch {
        const message = "Email or password not correct"
        setErrMessage(message);
        setIsError(true);
    }

    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {isError && 
           ( <ErrorMessage msg={errMessage} onClose={handleCloseError}/>)}
        <h2 className="text-3xl font-bold text-green-900 text-center mb-6">
          Welcome Back
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;