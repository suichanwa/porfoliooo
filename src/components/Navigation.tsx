import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function Navigation() {
  const [activeHash, setActiveHash] = useState("/");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveHash(window.location.pathname);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Diary", path: "/diary" },
    { name: 'Books', path: '/books' }, 
    { name: "Game", path: "/game" }
  ];

  const handleNavClick = (path: string) => {
    setActiveHash(path);
    setIsMenuOpen(false);
  };

  return (
    <motion.nav
      className="bg-secondary-bg py-3 shadow-sm sticky top-0 z-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
          <a href="/" className="flex items-center gap-2">
            <img src="/images/pfp.jpg" alt="Avatar" className="w-8 h-8 rounded-full border border-primary-accent" />
            <span className="font-medium text-base-content hidden sm:block">My Portfolio</span>
          </a>
        </motion.div>

        <div className="flex-grow" />

        <div className="relative" ref={menuRef}>
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="btn btn-ghost btn-circle relative z-20"
            whileTap={{ scale: 0.95 }}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </motion.svg>
          </motion.button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-60 p-2 bg-base-100 rounded-xl shadow-xl border border-base-300/50 z-10"
              >
                <ul className="menu">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <a
                        href={item.path}
                        className={activeHash === item.path ? "text-primary-accent" : ""}
                        onClick={() => handleNavClick(item.path)}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}

                  <li className="menu-title mt-2 pt-2 border-t border-base-300/50">
                    <span>More</span>
                  </li>
                  <li>
                    <a href="/write-letter" onClick={() => setIsMenuOpen(false)}>Write me a letter</a>
                  </li>
                  <li>
                    <a href="/letters" className="text-pink-400 font-medium" onClick={() => setIsMenuOpen(false)}>
                      Letters from visitors
                    </a>
                  </li>

                  <li className="menu-title mt-2 pt-2 border-t border-base-300/50">
                    <span>Social</span>
                  </li>
                  <li>
                    <a href="https://github.com/suichanwa" target="_blank" rel="noopener" onClick={() => setIsMenuOpen(false)}>
                      GitHub
                    </a>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}