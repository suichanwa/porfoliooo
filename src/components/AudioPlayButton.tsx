import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface AudioPlayButtonProps {
  src?: string;
  className?: string;
}

export default function AudioPlayButton({
  src = "/song/BGM.mp3",
  className = ""
}: AudioPlayButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0.5;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handlePause);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handlePause);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className={className} style={{ pointerEvents: "auto" }}>
      <motion.button
        type="button"
        onClick={togglePlayback}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? "Pause background music" : "Play background music"}
        className={`flex items-center gap-2 h-10 px-3 rounded-full border border-white/30 shadow-lg transition-all duration-300 ${
          isPlaying
            ? "bg-blue-500/20 text-blue-100"
            : "bg-black/70 backdrop-blur-sm text-white/80 hover:text-blue-300"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/10"
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 1.4, ease: "linear", repeat: isPlaying ? Infinity : 0 }}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.span>
        <span className="text-sm font-medium text-white/80 whitespace-nowrap">
          play a song for youself
        </span>
      </motion.button>
      <audio ref={audioRef} src={src} preload="none" />
    </div>
  );
}
