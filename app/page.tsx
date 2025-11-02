"use client";

import { useState } from "react";
import { FaHeart, FaHome, FaUser, FaSearch } from "react-icons/fa";
import { IoMdSettings, IoMdNotifications } from "react-icons/io";
import { BsFillBellFill, BsFillStarFill } from "react-icons/bs";
import { AiOutlineMail, AiFillLike } from "react-icons/ai";
import { HiOutlineMenu } from "react-icons/hi";
import { MdFavorite, MdDashboard } from "react-icons/md";

export default function Home() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Library Test Page
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Testing all installed libraries and features
          </p>
        </div>

        {/* React Icons Test Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FaHome className="text-blue-500" />
            React Icons Test
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {/* Font Awesome Icons */}
            <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FaHeart className="text-3xl text-red-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">FontAwesome</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <IoMdSettings className="text-3xl text-purple-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Ionicons</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <BsFillBellFill className="text-3xl text-green-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Bootstrap</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AiOutlineMail className="text-3xl text-yellow-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Ant Design</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <HiOutlineMenu className="text-3xl text-indigo-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Heroicons</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <MdFavorite className="text-3xl text-pink-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Material</span>
            </div>

            <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <FaUser className="text-3xl text-red-600 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">User</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <FaSearch className="text-3xl text-orange-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Search</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <IoMdNotifications className="text-3xl text-teal-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Notification</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
              <BsFillStarFill className="text-3xl text-cyan-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Star</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <AiFillLike className="text-3xl text-emerald-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Like</span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <MdDashboard className="text-3xl text-violet-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Dashboard</span>
            </div>
          </div>
        </div>

        {/* Fonts Test Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Fonts Test
          </h2>
          
          <div className="space-y-6">
            {/* Inter Font */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-inter text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Inter Font Family
              </h3>
              <p className="font-inter text-gray-600 dark:text-gray-300">
                This text is using the Inter font family. Inter is a carefully crafted typeface 
                designed for computer screens. It features a tall x-height to aid in readability 
                of mixed-case and lower-case text.
              </p>
              <p className="font-inter font-light text-sm text-gray-500 dark:text-gray-400 mt-2">
                Light weight: 300 | Regular: 400 | Medium: 500 | Semi-bold: 600 | Bold: 700
              </p>
            </div>

            {/* Poppins Font */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-poppins text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Poppins Font Family
              </h3>
              <p className="font-poppins text-gray-600 dark:text-gray-300">
                This text is using the Poppins font family. Poppins is a geometric sans serif 
                typeface designed for clarity and modern aesthetics. It has a friendly and 
                approachable appearance, making it perfect for various design applications.
              </p>
              <p className="font-poppins font-light text-sm text-gray-500 dark:text-gray-400 mt-2">
                Available weights: 100, 200, 300, 400, 500, 600, 700, 800, 900
              </p>
            </div>

            {/* Font Comparison */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="font-inter text-sm text-gray-500 dark:text-gray-400 mb-2">Inter</p>
                <p className="font-inter text-lg font-medium text-gray-900 dark:text-white">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="font-poppins text-sm text-gray-500 dark:text-gray-400 mb-2">Poppins</p>
                <p className="font-poppins text-lg font-medium text-gray-900 dark:text-white">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* React Router DOM Test Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            React Router DOM Status
          </h2>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200">
              ✅ <strong>React Router DOM</strong> is installed and available!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              Note: Next.js uses its own file-based routing system (App Router). React Router DOM 
              is available for client-side navigation if needed, but Next.js routing is recommended.
            </p>
          </div>
        </div>

        {/* Interactive Test Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Interactive Test
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <button
              onClick={() => setClickCount(clickCount + 1)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaHeart className="text-lg" />
              Click Me!
            </button>
            <div className="text-center md:text-left">
              <p className="text-gray-600 dark:text-gray-300">
                Button clicked: <span className="font-bold text-blue-600 dark:text-blue-400">{clickCount}</span> times
              </p>
            </div>
          </div>
        </div>

        {/* Tailwind CSS Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Tailwind CSS Test
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg">Blue</div>
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg">Green</div>
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg">Red</div>
            <div className="bg-purple-500 text-white px-4 py-2 rounded-lg">Purple</div>
            <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg">Yellow</div>
            <div className="bg-pink-500 text-white px-4 py-2 rounded-lg">Pink</div>
          </div>
        </div>

      </div>
    </div>
  );
}
