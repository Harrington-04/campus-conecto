import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

// A reusable component for the modern "Neubrutalist" button style.
const BrutalistButton = ({ children, onClick, primary = false }) => {
  const baseClasses = "w-full p-3 font-bold uppercase tracking-wider border-2 border-black transition-all duration-150 ease-in-out";
  const bgColor = primary ? "bg-blue-500" : "bg-white";
  const textColor = primary ? "text-white" : "text-black";
  const hoverClasses = "hover:-translate-x-1 hover:-translate-y-1";
  const activeClasses = "active:translate-x-0 active:translate-y-0 active:shadow-none";

  return (
    <div className={`relative group w-full`} onClick={onClick}>
      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 transition-transform duration-150 ease-in-out group-hover:translate-x-0 group-hover:translate-y-0"></div>
      <button className={`${baseClasses} ${bgColor} ${textColor} relative ${hoverClasses} ${activeClasses}`}>{children}</button>
    </div>
  );
};

// This is the main Landing Page component.
export default function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const handleSignUpClick = () => navigate("/signup");
  const handleSignInClick = () => navigate("/login");

  // This useEffect hook sets up and runs the canvas animation.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Updated colors: Replaced black with green
    const colors = ['#FFD700', '#007BFF', '#FF7F50', '#28a745'];
    const shapes = [];
    const numShapes = 40;

    const random = (min, max) => Math.random() * (max - min) + min;

    class Shape {
      constructor() {
        this.x = random(0, canvas.width);
        this.y = random(0, canvas.height);
        this.type = ['circle', 'triangle', 's-curve', 'squiggle', 'square'][Math.floor(random(0, 5))];
        this.color = colors[Math.floor(random(0, colors.length))];
        this.size = random(5, 90);
        this.vx = random(-0.3, 0.3);
        this.vy = random(-0.3, 0.3);
      }

      draw() {
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();

        switch (this.type) {
          case 'circle':
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'square':
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            break;
          case 'triangle':
            ctx.moveTo(this.x, this.y - this.size / 2);
            ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2);
            ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
            ctx.closePath();
            ctx.fill();
            break;
          case 's-curve':
            ctx.moveTo(this.x - this.size / 2, this.y - this.size / 2);
            ctx.bezierCurveTo(
              this.x + this.size / 2, this.y - this.size / 2,
              this.x - this.size / 2, this.y + this.size / 2,
              this.x + this.size / 2, this.y + this.size / 2
            );
            ctx.stroke();
            break;
          case 'squiggle':
            ctx.moveTo(this.x, this.y);
            ctx.quadraticCurveTo(this.x + this.size / 2, this.y - this.size, this.x + this.size, this.y);
            ctx.stroke();
            break;
          default:
            break;
        }
      }

      update() {
        if (this.x < -this.size || this.x > canvas.width + this.size) this.vx *= -1;
        if (this.y < -this.size || this.y > canvas.height + this.size) this.vy *= -1;
        this.x += this.vx;
        this.y += this.vy;
        this.draw();
      }
    }

    for (let i = 0; i < numShapes; i++) {
      shapes.push(new Shape());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      shapes.forEach(shape => shape.update());
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      shapes.length = 0;
       for (let i = 0; i < numShapes; i++) {
        shapes.push(new Shape());
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Prevent navigating back/forward while on Landing page
  useEffect(() => {
    const blockNav = () => {
      window.history.pushState(null, "", window.location.href);
    };
    // seed one state and block subsequent back/forward
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", blockNav);
    return () => window.removeEventListener("popstate", blockNav);
  }, []);

  return (
    <div className="relative h-screen w-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Theme Toggle - top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* The animated background canvas */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0"></canvas>
      
      {/* A container to center the content directly on the canvas */}
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-12 text-center p-8 max-w-md w-full">
          
          {/* Grouping for the Title and Tagline */}
          <div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-black dark:text-gray-100 tracking-tighter">
              CAMPUS CONECTO
            </h1>
            <p className="text-lg sm:text-xl text-gray-800 dark:text-gray-300 font-medium mt-2">
              Connect up, Grow together
            </p>
          </div>
          
          <div className="w-full flex flex-col sm:flex-row gap-4">
            <BrutalistButton onClick={handleSignInClick}>
              Sign In
            </BrutalistButton>
            <BrutalistButton onClick={handleSignUpClick} primary>
              Sign Up
            </BrutalistButton>
          </div>
        </div>
      </div>
    </div>
  );
}

