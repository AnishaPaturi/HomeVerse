import React from "react";
import Link from "next/link";

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-gray-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              HomeVerse
            </span>
          </Link>
          <div className="hidden md:flex space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-white">
              Dashboard
            </Link>
            <Link href="/studio" className="text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-white">
              Studio
            </Link>
            <Link href="/onboarding" className="text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-white">
              New Project
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};
