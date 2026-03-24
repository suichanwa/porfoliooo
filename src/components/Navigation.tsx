import { useState, useEffect, useRef } from "react";

export default function Navigation() {
  const [activeHash, setActiveHash] = useState("/");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentPfp, setCurrentPfp] = useState("/images/pfp.jpg");
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [miniPlayerStyleIndex, setMiniPlayerStyleIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  const miniPlayerStyles = [
    {
      shell: "border-slate-700/85 bg-[linear-gradient(120deg,rgba(var(--primary-bg-rgb),0.76),rgba(var(--primary-bg-rgb),0.48))]",
      buttonIdle: "border-slate-600/80 bg-[rgba(var(--primary-bg-rgb),0.66)] text-slate-100 hover:text-primary-accent",
      buttonActive: "border-primary-accent/60 bg-primary-accent/20 text-primary-accent shadow-md shadow-primary-accent/20",
      text: "text-slate-100/90"
    },
    {
      shell: "border-cyan-400/25 bg-[linear-gradient(120deg,rgba(7,19,34,0.85),rgba(12,39,64,0.72),rgba(31,67,92,0.58))]",
      buttonIdle: "border-cyan-300/25 bg-cyan-950/45 text-cyan-100 hover:text-cyan-200",
      buttonActive: "border-cyan-300/55 bg-cyan-400/20 text-cyan-100 shadow-md shadow-cyan-400/20",
      text: "text-cyan-50/95"
    },
    {
      shell: "border-amber-300/30 bg-[linear-gradient(120deg,rgba(24,17,28,0.82),rgba(38,28,45,0.74),rgba(61,40,42,0.62))]",
      buttonIdle: "border-amber-200/25 bg-amber-950/35 text-amber-50 hover:text-amber-200",
      buttonActive: "border-amber-300/60 bg-amber-300/20 text-amber-100 shadow-md shadow-amber-400/20",
      text: "text-amber-50/95"
    }
  ] as const;

  const miniPlayerStyle = miniPlayerStyles[miniPlayerStyleIndex % miniPlayerStyles.length];

  useEffect(() => {
    setActiveHash(window.location.pathname);
  }, []);

  useEffect(() => {
    const audio = bgmRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0.5;

    const handlePlay = () => setIsBgmPlaying(true);
    const handlePause = () => setIsBgmPlaying(false);
    const handleEnded = () => {
      setIsBgmPlaying(false);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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

  const togglePfp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPfp(prev => 
      prev === "/images/pfp.jpg" ? "/images/pfp2.jpg" : "/images/pfp.jpg"
    );
  };

  const toggleBgm = () => {
    const audio = bgmRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play()
        .then(() => setIsBgmPlaying(true))
        .catch(() => setIsBgmPlaying(false));
    } else {
      audio.pause();
      setIsBgmPlaying(false);
    }
  };

  const mainNavItems = [
    { 
      name: "Home", 
      path: "/", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: "About", 
      path: "/about", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      name: "Diary", 
      path: "/diary", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      name: 'Books', 
      path: '/books', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      name: "Planetarium", 
      path: "/planetarium", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  const moreNavItems = [
    { 
      name: "Manage Books", 
      path: "/manage-books", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
      )
    }, 
    { 
      name: "Game", 
      path: "/game", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
        </svg>
      )
    },
    { 
      name: "Letters", 
      path: "/letters", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      )
    },
    { 
      name: "Write Letter", 
      path: "/write-letter", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      )
    },
  ];

  // All items for mobile
  const allNavItems = [...mainNavItems, ...moreNavItems];

  const handleNavClick = (path: string) => {
    setActiveHash(path);
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const isMoreActive = moreNavItems.some(item => item.path === activeHash);
  const desktopNavButtonBase =
    "group relative flex items-center gap-2 px-2.5 py-2 border-b-2 border-transparent text-[12px] font-semibold uppercase tracking-[0.08em] transition-all duration-300";
  const desktopNavButtonIdle =
    "text-slate-300/90 hover:text-white hover:border-primary-accent/35";
  const desktopNavButtonActive =
    "text-white border-primary-accent/65 drop-shadow-[0_0_10px_rgba(99,102,241,0.35)]";
  const mobileNavButtonBase =
    "group flex items-center gap-3 px-3.5 py-3 rounded-lg border text-[12px] font-semibold uppercase tracking-[0.07em] transition-all duration-300";
  const mobileNavButtonIdle =
    "border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.18)] text-slate-300 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.36)] hover:text-white";

  return (
    <nav
      data-theme="dark"
      className={`py-3 shadow-sm sticky top-0 z-[100] transition-all duration-300 ${
        scrolled 
          ? 'bg-[rgba(var(--primary-bg-rgb),0.22)] backdrop-blur-lg border-b border-white/20' 
          : 'bg-[rgba(var(--primary-bg-rgb),0.06)] backdrop-blur-md border-b border-white/10'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-end gap-3">
          <button
            onClick={togglePfp}
            className="w-10 h-10 rounded-full border-2 border-primary-accent shadow-lg overflow-hidden hover:scale-110 active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2"
            aria-label="Toggle profile picture"
          >
            <img 
              src={currentPfp}
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </button>
          <a href="/" className="hidden sm:block pb-1 hover:opacity-80 transition-opacity">
            <div className="text-xs text-primary-accent">fullstack dev</div>
          </a>

          {/* Mini Player */}
          <div
            className={`hidden md:flex items-center gap-2 h-10 px-3 rounded-2xl border backdrop-blur-md ml-4 relative shadow-lg transition-all duration-300 ${miniPlayerStyle.shell}`}
          >
            <button
              type="button"
              onClick={toggleBgm}
              aria-pressed={isBgmPlaying}
              aria-label={isBgmPlaying ? "Pause background music" : "Play background music"}
              className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${
                isBgmPlaying
                  ? miniPlayerStyle.buttonActive
                  : miniPlayerStyle.buttonIdle
              }`}
            >
              {isBgmPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="min-w-0 pr-1">
              <span className={`text-xs max-w-[170px] truncate block ${miniPlayerStyle.text}`}>
                play a song for yourself
              </span>
            </div>

            <div className="flex items-end gap-[2px] h-3 mr-0.5" aria-hidden="true">
              {[0, 1, 2].map((bar) => (
                <span
                  key={bar}
                  className={`w-[2px] rounded-full transition-all duration-300 ${
                    isBgmPlaying
                      ? "bg-primary-accent/80 animate-[pulse_900ms_ease-in-out_infinite]"
                      : "bg-slate-500/60"
                  }`}
                  style={{
                    height: isBgmPlaying ? `${6 + bar * 2}px` : "4px",
                    animationDelay: `${bar * 120}ms`
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMiniPlayerStyleIndex((prev) => prev + 1)}
              aria-label="Switch mini player style"
              className="flex items-center justify-center w-7 h-7 rounded-full border border-white/15 text-slate-200/85 hover:text-white hover:border-white/35 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
            </button>

            <audio ref={bgmRef} src="/song/BGM.mp3" preload="none" />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {mainNavItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`${desktopNavButtonBase} ${
                activeHash === item.path 
                  ? desktopNavButtonActive
                  : desktopNavButtonIdle
              }`}
              onClick={() => setActiveHash(item.path)}
            >
              <span className="flex items-center justify-center w-5 h-5 text-current opacity-85 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-0.5">
                {item.icon}
              </span>
              <span className="leading-none">{item.name}</span>
            </a>
          ))}
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`${desktopNavButtonBase} ${
                isMoreActive 
                  ? desktopNavButtonActive
                  : desktopNavButtonIdle
              }`}
            >
              <span className="flex items-center justify-center w-5 h-5 text-current opacity-85 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </span>
              <span className="leading-none">More</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className={`w-4 h-4 ml-0.5 text-slate-300 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 p-2 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.95),rgba(20,28,40,0.84))] backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/55 z-[110]">
                {moreNavItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    className={`${mobileNavButtonBase} ${
                      activeHash === item.path 
                        ? desktopNavButtonActive
                        : mobileNavButtonIdle
                    }`}
                    onClick={() => handleNavClick(item.path)}
                  >
                    <span className="flex items-center justify-center w-6 h-6 text-current opacity-85 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-0.5">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
          
          {/* GitHub Link */}
          <a 
            href="https://github.com/suichanwa" 
            target="_blank" 
            rel="noopener" 
            className={`${desktopNavButtonBase} ${desktopNavButtonIdle}`}
          >
            <span className="flex items-center justify-center w-5 h-5 text-current opacity-85 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </span>
            <span className="leading-none">GitHub</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className={`btn btn-circle border border-slate-700/85 bg-[rgba(var(--primary-bg-rgb),0.55)] text-slate-100 hover:bg-[rgba(var(--primary-bg-rgb),0.75)] hover:border-slate-500/90 ${isMenuOpen ? "relative z-[120]" : ""}`}
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

          {isMenuOpen && (
            <div className="fixed inset-0 z-[110] md:hidden">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsMenuOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <div
                id="mobile-nav-panel"
                role="dialog"
                aria-modal="true"
                className="absolute left-4 right-4 top-[calc(4rem+env(safe-area-inset-top))] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-slate-700/90 bg-[rgba(var(--primary-bg-rgb),0.94)] p-4 shadow-2xl"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-primary-accent uppercase tracking-wider mb-2 px-2">
                      Navigation
                    </h3>
                    <div className="space-y-1">
                      {allNavItems.map((item) => (
                        <a
                          key={item.path}
                          href={item.path}
                          className={`${mobileNavButtonBase} ${
                            activeHash === item.path 
                              ? desktopNavButtonActive
                              : mobileNavButtonIdle
                          }`}
                          onClick={() => handleNavClick(item.path)}
                        >
                          <span className="flex items-center justify-center w-6 h-6 text-current opacity-85 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-0.5">
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-700/90 pt-3">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-2 px-2">
                      Social
                    </h3>
                    <a 
                      href="https://github.com/suichanwa" 
                      target="_blank" 
                      rel="noopener" 
                      className={`${mobileNavButtonBase} ${mobileNavButtonIdle}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-center justify-center w-6 h-6 text-current opacity-85 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </span>
                      <span>GitHub</span>
                      <svg className="ml-auto w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
