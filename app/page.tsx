"use client";

import { useState } from "react";
import { FaHeart, FaHome, FaUser, FaSearch } from "react-icons/fa";
import { IoMdSettings, IoMdNotifications } from "react-icons/io";
import { BsFillBellFill, BsFillStarFill } from "react-icons/bs";
import { AiOutlineMail, AiFillLike } from "react-icons/ai";
import { HiOutlineMenu } from "react-icons/hi";
import { MdFavorite, MdDashboard } from "react-icons/md";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";
import { Filter } from "bad-words";
import toast from "react-hot-toast";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";

export default function Home() {
  const [clickCount, setClickCount] = useState(0);
  const [generatedUUID, setGeneratedUUID] = useState<string>("");
  const [generatedName, setGeneratedName] = useState<string>("");
  const [profanityText, setProfanityText] = useState<string>("");
  const [profanityResult, setProfanityResult] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const generateUUID = () => {
    const newUUID = uuidv4();
    setGeneratedUUID(newUUID);
    toast.success("UUID generated!");
  };

  const generateUniqueName = () => {
    const name = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: "-",
      style: "lowerCase",
    });
    setGeneratedName(name);
    toast.success("Unique name generated!");
  };

  const checkProfanity = (text: string) => {
    setProfanityText(text);
    const filter = new Filter();
    if (filter.isProfane(text)) {
      setProfanityResult(`❌ Contains profanity! Cleaned: "${filter.clean(text)}"`);
      toast.error("Profanity detected!");
    } else {
      setProfanityResult("✅ No profanity detected!");
      toast.success("Text is clean!");
    }
  };

  const showToast = (type: string) => {
    switch (type) {
      case "success":
        toast.success("This is a success toast!");
        break;
      case "error":
        toast.error("This is an error toast!");
        break;
      case "loading":
        toast.loading("Loading...");
        break;
      default:
        toast("This is a default toast!");
    }
  };

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

        {/* Framer Motion Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Framer Motion Test
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg text-white text-center cursor-pointer"
            >
              Hover & Tap Me!
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg text-white text-center"
            >
              Animated Entry
            </motion.div>
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="p-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg text-white text-center"
            >
              Infinite Animation
            </motion.div>
          </div>
        </div>

        {/* UUID Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            UUID Test
          </h2>
          <div className="space-y-4">
            <button
              onClick={generateUUID}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Generate UUID
            </button>
            {generatedUUID && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Generated UUID:</p>
                <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{generatedUUID}</p>
              </div>
            )}
          </div>
        </div>

        {/* Unique Names Generator Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Unique Names Generator Test
          </h2>
          <div className="space-y-4">
            <button
              onClick={generateUniqueName}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Generate Unique Name
            </button>
            {generatedName && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Generated Name:</p>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">{generatedName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Profanity Filter Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Profanity Filter Test
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              value={profanityText}
              onChange={(e) => setProfanityText(e.target.value)}
              placeholder="Enter text to check for profanity..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => checkProfanity(profanityText)}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Check Profanity
            </button>
            {profanityResult && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-900 dark:text-white">{profanityResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* React Hot Toast Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            React Hot Toast Test
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => showToast("success")}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Success Toast
            </button>
            <button
              onClick={() => showToast("error")}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Error Toast
            </button>
            <button
              onClick={() => showToast("loading")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Loading Toast
            </button>
            <button
              onClick={() => showToast("default")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Default Toast
            </button>
          </div>
        </div>

        {/* Radix UI Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Radix UI Test
          </h2>
          <div className="flex flex-wrap gap-4">
            {/* Tooltip */}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                    Hover for Tooltip
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg"
                    sideOffset={5}
                  >
                    This is a Radix UI Tooltip!
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            {/* Popover */}
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                  Open Popover
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600"
                  sideOffset={5}
                >
                  <p className="text-sm mb-2">This is a Radix UI Popover!</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Click outside to close.</p>
                  <Popover.Arrow className="fill-white dark:fill-gray-700" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {/* Dialog */}
            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Trigger asChild>
                <button className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                  Open Dialog
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Radix UI Dialog
                  </Dialog.Title>
                  <Dialog.Description className="text-gray-600 dark:text-gray-300 mb-4">
                    This is a Radix UI Dialog component. You can use it for modals, confirmations, and more.
                  </Dialog.Description>
                  <Dialog.Close asChild>
                    <button className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                      Close
                    </button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* Vercel Analytics Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Vercel Analytics Status
          </h2>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200">
              ✅ <strong>@vercel/analytics</strong> is installed and active!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              Analytics component is added to the layout. It will track page views and events when deployed to Vercel.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
