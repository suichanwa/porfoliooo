export default function Avatar() {
  return (
    <div className="inline-block animate-avatar-enter">
      <img
        src="/images/pfp.jpg"
        alt="avatar"
        width="160"
        height="160"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        className="rounded-full w-[clamp(8.75rem,16vw,10rem)] aspect-square object-cover border-2 border-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-transform duration-300 hover:scale-105 active:scale-95 cursor-pointer"
      />
    </div>
  );
}