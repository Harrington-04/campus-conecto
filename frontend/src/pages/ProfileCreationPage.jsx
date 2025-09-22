import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

// This is the main Profile Creation Page component, restyled with the Neubrutalist theme.
export default function ProfileCreationPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // --- All original state is preserved ---
  const [formData, setFormData] = useState({
    username: "",
    college: "",
    bio: "",
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const fileInputRef = useRef(null);

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

  // --- All original handler functions are preserved ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfileImagePreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        alert("❌ No token found. Please login again.");
        navigate("/login");
        return;
      }
  
      let profileImageUrl = null;
      if (profileImageFile) {
        const form = new FormData();
        form.append("file", profileImageFile);
        const up = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/upload/profile-image`,
          form,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
        );
        if (up.data.success) {
          profileImageUrl = up.data.url;
        } else {
          throw new Error(up.data.message || "Upload failed");
        }
      }
  
      const profileData = {
        username: formData.username,
        fullName: formData.username,
        college: formData.college,
        bio: formData.bio,
        profileImageUrl,
      };
      
      console.log('🚀 SENDING PROFILE DATA:', profileData);
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/users/profile`,
        profileData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
  
      sessionStorage.setItem("profileCreated", "true");
      localStorage.setItem("profileCreated", "true");
      alert("✅ Profile created successfully!");
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("❌ Error saving profile:", err.response?.data || err.message);
      
      // Handle different types of errors
      let errorMessage = "Failed to save profile. ";
      
      if (err.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a few minutes before trying again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else {
        errorMessage += "Please try again later.";
      }
      
      alert("❌ " + errorMessage);
    }
  };
  

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
          {/* The Hard Shadow Effect */}
          <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 -z-10"></div>
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
            <h2 className="text-3xl font-bold text-black dark:text-gray-100 text-center mb-4">
              Create Your Profile
            </h2>

            <div className="flex flex-col items-center space-y-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 bg-gray-100 dark:bg-gray-700 border-2 border-black flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-200 text-3xl font-semibold">+</span>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <input
              type="text"
              name="username"
              placeholder="Username (e.g., user123)"
              value={formData.username}
              onChange={handleChange}
              className="w-full py-2 px-3 bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              name="college"
              placeholder="College / Institute Name"
              value={formData.college}
              onChange={handleChange}
              className="w-full py-2 px-3 bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              name="bio"
              placeholder="Short bio (optional)"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="w-full py-2 px-3 bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold uppercase tracking-wider border-2 border-black hover:bg-blue-700 transition-colors">
              Save Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
