import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import socket from '../socket';
import ThemeToggle from "../components/ThemeToggle";

// This is the main LoginPage component, restyled with the Neubrutalist theme.
export default function LoginPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // --- All original state and logic is preserved ---
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState(0);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/login`, formData);

      if (!res.data.success) {
        setMessage(`❌ ${res.data.message}`);
        return;
      }

      const user = res.data.data;
      setMessage("✅ Login successful! Welcome back.");

      if (user && user.email) {
        sessionStorage.setItem("userEmail", user.email);
        localStorage.setItem("userEmail", user.email);
        sessionStorage.setItem("token", user.token);
        localStorage.setItem("token", user.token);
        sessionStorage.setItem("userId", user._id);
        localStorage.setItem("userId", user._id);
        socket.connect();
      }

      // Clear any existing profile creation flags
      sessionStorage.removeItem("profileCreated");
      localStorage.removeItem("profileCreated");
      
      // Check if user has completed profile creation
      if (!user.profileCreated) {
        console.log("User profile not created, redirecting to profile creation");
        navigate("/create-profile", { replace: true });
      } else {
        console.log("User profile exists, redirecting to home");
        // Set the profile created flag for the CreateProfileRoute component
        sessionStorage.setItem("profileCreated", "true");
        localStorage.setItem("profileCreated", "true");
        navigate("/home", { replace: true });
      }
    } catch (err) {
      setMessage("❌ Invalid email or password.");
    }
  };
  
  const requestPasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage("Sending OTP...");
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/forgot-password`, { email: resetEmail });
      setResetMessage("✅ OTP sent to your email.");
      setResetStep(2);
    } catch (err) {
      setResetMessage(`❌ ${err.response?.data?.message || "Failed to send OTP."}`);
    }
  };

  const verifyOTPAndResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage("Resetting password...");
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/reset-password`, { email: resetEmail, otp, newPassword });
      setResetMessage("✅ Password reset successful! You can now login.");
      setTimeout(() => {
        setResetStep(0);
        setResetEmail("");
        setOtp("");
        setNewPassword("");
      }, 3000);
    } catch (err) {
      setResetMessage(`❌ ${err.response?.data?.message || "Failed to reset password."}`);
    }
  };
  
  // This useEffect handles the animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#FFD700', '#007BFF', '#FF7F50', '#28a745'];
    const shapes = [];
    const numShapes = 40;
    const random = (min, max) => Math.random() * (max - min) + min;
    class Shape {
        constructor() { this.x = random(0, canvas.width); this.y = random(0, canvas.height); this.type = ['circle', 'triangle', 's-curve', 'squiggle', 'square'][Math.floor(random(0, 5))]; this.color = colors[Math.floor(random(0, colors.length))]; this.size = random(5, 90); this.vx = random(-0.3, 0.3); this.vy = random(-0.3, 0.3); }
        draw() { ctx.strokeStyle = this.color; ctx.fillStyle = this.color; ctx.lineWidth = 4; ctx.beginPath(); switch (this.type) { case 'circle': ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2); ctx.fill(); break; case 'square': ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size); break; case 'triangle': ctx.moveTo(this.x, this.y - this.size / 2); ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2); ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2); ctx.closePath(); ctx.fill(); break; case 's-curve': ctx.moveTo(this.x - this.size / 2, this.y - this.size / 2); ctx.bezierCurveTo(this.x + this.size / 2, this.y - this.size / 2, this.x - this.size / 2, this.y + this.size / 2, this.x + this.size / 2, this.y + this.size / 2); ctx.stroke(); break; case 'squiggle': ctx.moveTo(this.x, this.y); ctx.quadraticCurveTo(this.x + this.size / 2, this.y - this.size, this.x + this.size, this.y); ctx.stroke(); break; default: break; } }
        update() { if (this.x < -this.size || this.x > canvas.width + this.size) this.vx *= -1; if (this.y < -this.size || this.y > canvas.height + this.size) this.vy *= -1; this.x += this.vx; this.y += this.vy; this.draw(); }
    }
    for (let i = 0; i < numShapes; i++) shapes.push(new Shape());
    const animate = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); shapes.forEach(shape => shape.update()); animationFrameId = requestAnimationFrame(animate); };
    animate();
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; shapes.length = 0; for (let i = 0; i < numShapes; i++) shapes.push(new Shape()); };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', handleResize); };
  }, []);

  return (
    <div className="relative h-screen w-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">
      {/* Theme Toggle - top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0"></canvas>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10 p-4">
        {/* The Neubrutalist Panel */}
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 border-2 border-black">
          <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 -z-10"></div>
          <div className="p-8">
            <h2 className="text-3xl font-bold text-black dark:text-gray-100 text-center mb-6">Sign In</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full p-3 bg-white border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-3 bg-white border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              {message && <p className="text-center text-sm font-semibold p-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 border-2 border-black">{message}</p>}
              <button type="submit" className="w-full p-3 bg-blue-600 text-white font-bold uppercase tracking-wider border-2 border-black hover:bg-blue-700 transition-colors">Sign In</button>
              <div className="text-center">
                <button type="button" onClick={() => setResetStep(1)} className="text-sm text-black dark:text-gray-100 hover:underline">Forgot Password?</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {resetStep > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 border-2 border-black">
            <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 -z-10"></div>
            <div className="relative p-8">
              <button onClick={() => setResetStep(0)} className="absolute top-2 right-2 font-bold text-xl hover:text-red-500">✕</button>
              <h2 className="text-2xl font-bold text-black dark:text-gray-100 mb-4">
                {resetStep === 1 ? "Reset Password" : "Verify & Reset"}
              </h2>
              {resetStep === 1 && (
                <form onSubmit={requestPasswordReset} className="space-y-4">
                  <p className="text-sm text-black dark:text-gray-200">Enter your email to receive a password reset OTP.</p>
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full p-3 bg-white border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email Address" required />
                  {resetMessage && <p className="text-sm font-semibold p-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 border-2 border-black">{resetMessage}</p>}
                  <button type="submit" className="w-full p-3 bg-blue-600 text-white font-bold uppercase tracking-wider border-2 border-black hover:bg-blue-700 transition-colors">Send OTP</button>
                </form>
              )}
              {resetStep === 2 && (
                <form onSubmit={verifyOTPAndResetPassword} className="space-y-4">
                   <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-3 bg-white border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="6-digit OTP" required />
                   <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 bg-white border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="New Password (min. 6 chars)" required />
                   {resetMessage && <p className="text-sm font-semibold p-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 border-2 border-black">{resetMessage}</p>}
                   <button type="submit" className="w-full p-3 bg-blue-600 text-white font-bold uppercase tracking-wider border-2 border-black hover:bg-blue-700 transition-colors">Reset Password</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
