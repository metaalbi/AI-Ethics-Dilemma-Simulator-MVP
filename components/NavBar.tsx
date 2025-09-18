"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";

export default function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: admin } = await supabase.rpc("is_admin", { uid: user.id });
        setIsAdmin(!!admin);
      }
    }
    getUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="glass-nav w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/iaca-logo.png"
                alt="IACA Logo"
                width={40}
                height={40}
                className="rounded"
                priority
                quality={90}
              />
              <span className="text-iaca-blue font-semibold text-lg">
                IACA Alumni
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <Link
                    href="/news"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/news")
                        ? "text-iaca-blue bg-blue-50"
                        : "text-gray-600 hover:text-iaca-blue hover:bg-blue-50"
                    }`}
                  >
                    News
                  </Link>
                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/profile")
                        ? "text-iaca-blue bg-blue-50"
                        : "text-gray-600 hover:text-iaca-blue hover:bg-blue-50"
                    }`}
                  >
                    Profile
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        href="/admin/news"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive("/admin/news")
                            ? "text-iaca-blue bg-blue-50"
                            : "text-gray-600 hover:text-iaca-blue hover:bg-blue-50"
                        }`}
                      >
                        Manage News
                      </Link>
                      <Link
                        href="/admin/alumni"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive("/admin/alumni")
                            ? "text-iaca-blue bg-blue-50"
                            : "text-gray-600 hover:text-iaca-blue hover:bg-blue-50"
                        }`}
                      >
                        Manage Alumni
                      </Link>
                    </>
                  )}
                </>
              )}
              {user ? (
                <Link
                  href="/logout"
                  className="glass-button px-3 py-2 rounded-md text-sm font-medium text-iaca-blue"
                >
                  Sign Out
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="glass-button px-3 py-2 rounded-md text-sm font-medium text-iaca-blue"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-iaca-blue text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="glass-button p-2 rounded-md"
              aria-label="Main menu"
              aria-expanded="false"
            >
              <svg
                className="h-6 w-6 text-iaca-blue"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {!isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? "block" : "hidden"} md:hidden glass-effect`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {user && (
            <>
              <Link
                href="/news"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/news")
                    ? "text-iaca-blue bg-blue-50"
                    : "text-gray-600 hover:text-iaca-blue hover:bg-blue-50"
                }`}
              >
                News
              </Link>
              <Link
                href="/profile"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/profile")
                    ? "text-iaca-blue bg-blue-50"
                    : "text-gray-600 hover:text-iaca-blue hover:bg-blue-50"
                }`}
              >
                Profile
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/admin/news"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive("/admin/news")
                        ? "text-iaca-blue bg-blue-50"
                        : "text-gray-600 hover:text-iaca-blue hover:bg-blue-50"
                    }`}
                  >
                    Manage News
                  </Link>
                  <Link
                    href="/admin/alumni"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive("/admin/alumni")
                        ? "text-iaca-blue bg-blue-50"
                        : "text-gray-600 hover:text-iaca-blue hover:bg-blue-50"
                    }`}
                  >
                    Manage Alumni
                  </Link>
                </>
              )}
            </>
          )}
          {user ? (
            <Link
              href="/logout"
              className="block px-3 py-2 rounded-md text-base font-medium text-iaca-blue hover:bg-blue-50"
            >
              Sign Out
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-iaca-blue hover:bg-blue-50"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 rounded-md text-base font-medium bg-iaca-blue text-white hover:bg-opacity-90"
              >
                Join Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
