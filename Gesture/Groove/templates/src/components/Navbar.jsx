// FILE LOCATION: /templates/src/components/Navbar.jsx
// REPLACE your existing Navbar.jsx with this fixed version

import React, { useState } from "react";
import { Music2, Menu } from "lucide-react";

const Navbar = ({ activeTab, setActiveTab }) => {
  const [isMenuToggled, setIsMenuToggled] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-green-400 to-green-600 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Music2 className="h-8 w-8 text-white" />
            <span className="ml-2 text-2xl font-bold text-white">GestureGroove</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {["Home", "Instructions", "Connect Spotify", "Gesture Control"].map(
              (item) => (
                <button
                  key={item}
                  className={`text-white hover:text-green-100 px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    activeTab === item.toLowerCase().replace(" ", "-")
                      ? "border-b-2 border-white scale-105 font-bold"
                      : "border-b-2 border-transparent"
                  }`}
                  onClick={() => setActiveTab(item.toLowerCase().replace(" ", "-"))}
                >
                  {item}
                </button>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white hover:text-green-100 focus:outline-none"
            onClick={() => setIsMenuToggled(!isMenuToggled)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuToggled && (
        <div className="md:hidden bg-green-700">
          <div className="flex flex-col items-center space-y-4 py-4">
            {["Home", "Instructions", "Connect Spotify", "Gesture Control"].map(
              (item) => (
                <button
                  key={item}
                  className={`text-white hover:text-green-100 text-lg transition-colors duration-150 ${
                    activeTab === item.toLowerCase().replace(" ", "-")
                      ? "font-bold underline"
                      : ""
                  }`}
                  onClick={() => {
                    setActiveTab(item.toLowerCase().replace(" ", "-"));
                    setIsMenuToggled(false);
                  }}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;