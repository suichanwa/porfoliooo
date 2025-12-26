interface StarryNebulaeProps {
  enabled: boolean;
  isLowEnd: boolean;
}

export default function StarryNebulae({ enabled, isLowEnd }: StarryNebulaeProps) {
  if (!enabled) return null;

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "15%",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74, 51, 102, 0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          opacity: 0.6
        }}
      />

      {!isLowEnd && (
        <div
          style={{
            position: "absolute",
            top: "60%",
            right: "20%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(42, 68, 102, 0.06) 0%, transparent 70%)",
            filter: "blur(35px)",
            opacity: 0.5
          }}
        />
      )}
    </>
  );
}
