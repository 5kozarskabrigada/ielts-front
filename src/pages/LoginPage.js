import React, { useState } from "react";
import { useAuth } from "../authContext";
import { useNavigate } from "react-router-dom";
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(identifier, password);
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container min-h-screen flex items-center justify-center relative overflow-hidden">

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md relative z-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-64 md:w-72 h-20 md:h-24 mx-auto mb-5 rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://img.sanishtech.com/u/9d24edad692886d6d3bd9f0192f8349c.jpeg"
              alt="EXAMROOM"
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to the IELTS Platform</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r mb-6 flex items-start text-sm animate-pulse">
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email or Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#123b71] focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#123b71] focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#123b71] text-white py-3.5 rounded-xl font-semibold hover:bg-[#0f315c] transition-all shadow-lg hover:shadow-[#123b71]/30 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Are you an administrator? <span className="text-[#123b71] font-medium">Use your admin credentials to access the panel.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
