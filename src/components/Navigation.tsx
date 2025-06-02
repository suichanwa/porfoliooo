import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function Navigation() {
  const [activeHash, setActiveHash] = useState("/");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "About", path: "/about", icon: "👨‍💻" },
    { name: "Diary", path: "/diary", icon: "📖" },
    { name: 'Books', path: '/books', icon: "📚" }, 
    { name: "Game", path: "/game", icon: "🎮" }
  ];

  const handleNavClick = (path: string) => {
    setActiveHash(path);
    setIsMenuOpen(false);
  };

  return (
    <motion.nav
      className={`py-3 shadow-sm sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-secondary-bg/95 backdrop-blur-md border-b border-white/10' 
          : 'bg-secondary-bg'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <a href="/" className="flex items-center gap-3">
            <motion.img 
              src="/images/pfp.jpg" 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border-2 border-primary-accent shadow-lg" 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            />
            <div className="hidden sm:block">
              <span className="font-bold text-base-content text-lg">My Portfolio</span>
              <div className="text-xs text-primary-accent">fullstack dev ✨</div>
            </div>
          </a>
        </motion.div>

        {/* Mobile Menu Button */}
        <div className="relative" ref={menuRef}>
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="btn btn-ghost btn-circle relative z-20"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.1 }}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-72 p-3 bg-base-100/95 backdrop-blur-md rounded-2xl shadow-2xl border border-base-300/50 z-40"
              >
                <div className="space-y-2">
                  {/* Main Navigation */}
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-primary-accent uppercase tracking-wider mb-2 px-3">
                      Navigation
                    </h3>
                    <div className="space-y-1">
                      {navItems.map((item, index) => (
                        <motion.a
                          key={item.path}
                          href={item.path}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 ${
                            activeHash === item.path 
                              ? 'bg-primary-accent text-white shadow-lg' 
                              : 'text-base-content hover:bg-base-200'
                          }`}
                          onClick={() => handleNavClick(item.path)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-xl">{item.icon}</span>
                          <span>{item.name}</span>
                          {activeHash === item.path && (
                            <motion.div
                              className="ml-auto w-2 h-2 bg-white rounded-full"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 }}
                            />
                          )}
                        </motion.a>
                      ))}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="border-t border-base-300/50 pt-3">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-2 px-3">
                      Social
                    </h3>
                    <motion.a 
                      href="https://github.com/suichanwa" 
                      target="_blank" 
                      rel="noopener" 
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-base-content hover:bg-base-200 transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-xl">🐙</span>
                      <span>GitHub</span>
                      <svg className="ml-auto w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}