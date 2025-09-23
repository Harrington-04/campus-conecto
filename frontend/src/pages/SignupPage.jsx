import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";

// This is the main Signup Page component, with layout adjustments.
export default function SignupPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // --- All original state from your file is preserved ---
  const [formData, setFormData] = useState({
    fullName: "", 
    email: "",
    qualification: "",
    branch: "",
    year: "",
    subjects: [],
    password: "",
  });

  const [qualificationsData, setQualificationsData] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const yearOptions = {
    School: ["8th", "9th", "10th", "11th", "12th"],
    College: ["FY", "SY", "TY", "Final Year"],
    Other: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
  };

  // --- All original useEffects and handler functions are preserved ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [qualResponse, subjResponse] = await Promise.all([
          fetch("/qualifications.json"),
          fetch("/final_subjects.json"),
        ]);
        const qualData = await qualResponse.json();
        const subjData = await subjResponse.json();
        if (Array.isArray(qualData)) setQualificationsData(qualData);
        if (Array.isArray(subjData)) setAllSubjects(subjData);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (formData.qualification) {
      const selected = qualificationsData.find(q => q.qualification === formData.qualification);
      setBranchOptions(selected?.branches || []);
      setFormData((prev) => ({ ...prev, branch: "", year: "" }));
    } else {
      setBranchOptions([]);
    }
  }, [formData.qualification, qualificationsData]);

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

  const getYearOptions = () => {
    if (formData.qualification?.includes("Bachelor") || formData.qualification?.includes("Master")) return yearOptions.College;
    return yearOptions.Other;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectSelect = (subject) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleCustomSubject = () => {
    const custom = prompt("Enter a custom subject name:");
    if (custom && !allSubjects.includes(custom)) {
      setAllSubjects((prev) => [...prev, custom]);
      handleSubjectSelect(custom);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("Registering...");
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/register`, formData);
      setStatusMessage("✅ Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setStatusMessage(`❌ ${err.response?.data?.message || "Registration failed."}`);
    }
  };

  const filteredSubjects = useMemo(() => {
    return allSubjects.filter((subj) => subj.toLowerCase().includes(searchText.toLowerCase()));
  }, [allSubjects, searchText]);

  return (
    <div className="relative h-screen w-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">
      {/* Theme Toggle - top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0"></canvas>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10 p-4">
        {/* The Neubrutalist Panel - Made even wider */}
        <div className="relative w-full max-w-7xl bg-white dark:bg-gray-800 border-2 border-black">
          {/* The Hard Shadow Effect */}
          <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 -z-10"></div>
          
          <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: The Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-2">
                <h2 className="text-3xl font-bold text-black dark:text-gray-100 text-center mb-4">Create Account</h2>
                
                <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="w-full py-2 px-3 bg-white border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full py-2 px-3 bg-white border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="password" name="password" placeholder="Password (min. 6 characters)" value={formData.password} onChange={handleChange} className="w-full py-2 px-3 bg-white border-2 border-black rounded-none placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                
                <select name="qualification" value={formData.qualification} onChange={handleChange} className="w-full py-2 px-3 bg-white border-2 border-black rounded-none text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">Select Stream</option>
                  {qualificationsData.map(q => <option key={q.qualification} value={q.qualification}>{q.qualification}</option>)}
                </select>

                {branchOptions.length > 0 && (
                  <select name="branch" value={formData.branch} onChange={handleChange} className="w-full py-2 px-3 bg-white border-2 border-black rounded-none text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Select Branch</option>
                    {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                )}

                {formData.branch && (
                   <select name="year" value={formData.year} onChange={handleChange} className="w-full py-2 px-3 bg-white border-2 border-black rounded-none text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Select Year</option>
                    {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}

                {/* The restored Subject Selection UI */}
                <div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {formData.subjects.map((subj) => (
                      <span key={subj} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs flex items-center border border-black">
                        {subj}
                        <button type="button" onClick={() => handleSubjectSelect(subj)} className="ml-1 text-red-500 hover:text-red-700 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)} className="w-full py-2 px-3 bg-white border-2 border-black text-left text-gray-700">
                      {dropdownOpen ? "Hide Subjects ▲" : "Select Subjects ▼"}
                    </button>
                    {dropdownOpen && (
                      <div className="absolute z-20 w-full bg-white border-2 border-black mt-1 max-h-48 overflow-y-auto p-2 shadow-lg">
                        <input type="text" placeholder="Search subjects..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full px-2 py-1 border-2 border-black mb-2" />
                        <button type="button" onClick={handleCustomSubject} className="w-full mb-2 px-2 py-1 bg-yellow-300 text-black border-2 border-black text-sm hover:bg-yellow-400 font-semibold">+ Add Custom Subject</button>
                        <div className="grid grid-cols-2 gap-2">
                          {filteredSubjects.map((subject) => (
                            <label key={subject} className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={formData.subjects.includes(subject)} onChange={() => handleSubjectSelect(subject)} className="border-2 border-black focus:ring-blue-500"/>{subject}</label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {statusMessage && <p className="text-center text-sm font-semibold p-2 bg-gray-200 border-2 border-black">{statusMessage}</p>}
                <button
                  type="submit"
                  disabled={statusMessage === "Registering..."}
                  className="w-full py-3 bg-blue-600 text-white font-bold uppercase tracking-wider border-2 border-black hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Register
                </button>
              </form>

              {/* Right Column: The Description */}
              <div className="hidden md:flex flex-col justify-center text-black dark:text-gray-100 px-4">
                <h2 className="text-4xl font-extrabold mb-4">Welcome to Campus Conecto</h2>
                <p className="text-lg text-gray-800 dark:text-gray-200">A student-focused platform designed to connect you with classmates and learners from all over the world based on your academic interests.</p>
                <p className="mt-4 text-gray-800 dark:text-gray-200">Share projects, join subject groups, ask questions globally, and explore study resources — all in one social academic network!</p>
              </div>
            </div>
            {/* "Already have an account?" text is now larger */}
            <p className="text-center text-lg text-black dark:text-gray-100 mt-6">
              Already have an account? <Link to="/login" className="font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

