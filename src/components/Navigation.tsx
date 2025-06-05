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
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
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
    <nav
      className={`py-3 shadow-sm sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-secondary-bg/95 backdrop-blur-sm border-b border-white/10' 
          : 'bg-secondary-bg'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/images/pfp.jpg" 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border-2 border-primary-accent shadow-lg" 
          />
          <div className="hidden sm:block">
            <span className="font-bold text-base-content text-lg">My Portfolio</span>
            <div className="text-xs text-primary-accent">fullstack dev ✨</div>
          </div>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeHash === item.path 
                  ? 'bg-primary-accent text-white shadow-md' 
                  : 'text-base-content hover:bg-base-200'
              }`}
              onClick={() => setActiveHash(item.path)}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
          
          {/* GitHub Link */}
          <a 
            href="https://github.com/suichanwa" 
            target="_blank" 
            rel="noopener" 
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base-content hover:bg-base-200 transition-all duration-200"
          >
            <span>🐙</span>
            <span>GitHub</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="btn btn-ghost btn-circle"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>

          {/* Mobile Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 p-3 bg-base-100/95 backdrop-blur-sm rounded-xl shadow-xl border border-base-300/50 z-40">
              <div className="space-y-1">
                {/* Navigation Items */}
                <div className="mb-3">
                  <h3 className="text-xs font-bold text-primary-accent uppercase tracking-wider mb-2 px-2">
                    Navigation
                  </h3>
                  {navItems.map((item) => (
                    <a
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
                        activeHash === item.path 
                          ? 'bg-primary-accent text-white' 
                          : 'text-base-content hover:bg-base-200'
                      }`}
                      onClick={() => handleNavClick(item.path)}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </a>
                  ))}
                </div>

                {/* Social Links */}
                <div className="border-t border-base-300/50 pt-3">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-2 px-2">
                    Social
                  </h3>
                  <a 
                    href="https://github.com/suichanwa" 
                    target="_blank" 
                    rel="noopener" 
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-base-content hover:bg-base-200 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-lg">🐙</span>
                    <span>GitHub</span>
                    <svg className="ml-auto w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}