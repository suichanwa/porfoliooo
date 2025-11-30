import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface NeptuneProps {
  className?: string;
}

export default function Neptune({ className = '' }: NeptuneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [neptuneTime, setNeptuneTime] = useState('00:00:00');
  const [earthTime, setEarthTime] = useState('00:00:00');
  const [weather, setWeather] = useState({
    windSpeed: 0,
    temperature: 0,
    condition: 'Clear',
    stormActivity: 0,
    latitude: 0,
    hemisphere: 'Northern'
  });
  const animationRef = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const rotationRef = useRef({ planet: 0, orbit: 0, storm: 0, cloud: 0, triton: 0 });

  // Real Neptune scientific data from NASA/Voyager 2 + JWST
  const NEPTUNE_DATA = useMemo(() => ({
    dayLength: 16.11,
    yearLength: 164.8,
    avgTemp: -214,
    tempRange: { min: -218, max: -200 },
    maxWind: 2100,
    avgWind: 1200,
    axialTilt: 28.32,
    rotationPeriod: 16.11,
    
    // Ring system (discovered by Voyager 2, imaged by JWST)
    rings: {
      galle: { innerRadius: 1.69, outerRadius: 1.75, opacity: 0.15 },
      leverrier: { innerRadius: 2.15, outerRadius: 2.18, opacity: 0.25 },
      lassell: { innerRadius: 2.18, outerRadius: 2.40, opacity: 0.1 },
      arago: { innerRadius: 2.31, outerRadius: 2.36, opacity: 0.2 },
      adams: { innerRadius: 2.54, outerRadius: 2.56, opacity: 0.4 }
    },
    
    // Triton - Neptune's largest moon
    triton: {
      orbitalPeriod: 5.877, // days (retrograde)
      distance: 354759, // km from Neptune
      radius: 1353.4, // km
      temperature: -235, // °C
      atmosphere: 'Nitrogen, trace methane'
    },
    
    greatDarkSpot: {
      discovered: 1989,
      size: '13,000 km × 6,600 km',
      windSpeed: 2400,
      disappeared: 1994
    },
    
    atmosphere: {
      hydrogen: 80,
      helium: 19,
      methane: 1.5,
      trace: 0.5
    }
  }), []);

  // Draw Triton moon
  const drawTriton = useCallback((
    ctx: CanvasRenderingContext2D,
    planetX: number,
    planetY: number,
    planetRadius: number,
    time: number
  ) => {
    // Triton orbits retrograde (opposite direction)
    const orbitRadius = planetRadius * 3.2;
    const orbitTilt = 0.35;
    const tritonAngle = -time; // Negative for retrograde
    
    const tritonX = planetX + Math.cos(tritonAngle) * orbitRadius;
    const tritonY = planetY + Math.sin(tritonAngle) * orbitRadius * orbitTilt;
    const tritonRadius = planetRadius * 0.12;
    
    // Only draw if in front of planet (simple depth check)
    const isInFront = Math.sin(tritonAngle) > -0.3;
    
    // Draw orbit path (very subtle)
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, orbitRadius, orbitRadius * orbitTilt, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    if (!isInFront) return; // Behind Neptune
    
    // Triton outer glow
    const tritonGlow = ctx.createRadialGradient(
      tritonX, tritonY, 0,
      tritonX, tritonY, tritonRadius * 2.5
    );
    tritonGlow.addColorStop(0, 'rgba(200, 210, 230, 0.15)');
    tritonGlow.addColorStop(0.5, 'rgba(180, 195, 220, 0.05)');
    tritonGlow.addColorStop(1, 'rgba(150, 170, 200, 0)');
    ctx.fillStyle = tritonGlow;
    ctx.beginPath();
    ctx.arc(tritonX, tritonY, tritonRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Triton body - icy pinkish-white surface
    const tritonGradient = ctx.createRadialGradient(
      tritonX - tritonRadius * 0.3,
      tritonY - tritonRadius * 0.3,
      0,
      tritonX,
      tritonY,
      tritonRadius
    );
    tritonGradient.addColorStop(0, '#e8e0e8');
    tritonGradient.addColorStop(0.3, '#d4ccd8');
    tritonGradient.addColorStop(0.6, '#b8aec0');
    tritonGradient.addColorStop(1, '#8a7e94');
    
    ctx.fillStyle = tritonGradient;
    ctx.beginPath();
    ctx.arc(tritonX, tritonY, tritonRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Triton surface features (nitrogen ice)
    ctx.save();
    ctx.beginPath();
    ctx.arc(tritonX, tritonY, tritonRadius, 0, Math.PI * 2);
    ctx.clip();
    
    // South polar cap (nitrogen/methane ice - pinkish)
    const polarGradient = ctx.createRadialGradient(
      tritonX, tritonY + tritonRadius * 0.5, 0,
      tritonX, tritonY + tritonRadius * 0.5, tritonRadius * 0.6
    );
    polarGradient.addColorStop(0, 'rgba(255, 220, 230, 0.4)');
    polarGradient.addColorStop(0.5, 'rgba(240, 200, 210, 0.2)');
    polarGradient.addColorStop(1, 'rgba(200, 180, 190, 0)');
    ctx.fillStyle = polarGradient;
    ctx.beginPath();
    ctx.arc(tritonX, tritonY + tritonRadius * 0.5, tritonRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Terminator shadow
    const tritonShadow = ctx.createLinearGradient(
      tritonX - tritonRadius, tritonY,
      tritonX + tritonRadius * 0.3, tritonY
    );
    tritonShadow.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    tritonShadow.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)');
    tritonShadow.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = tritonShadow;
    ctx.fillRect(tritonX - tritonRadius, tritonY - tritonRadius, tritonRadius * 2, tritonRadius * 2);
    
    ctx.restore();
    
    // Triton label (subtle)
    ctx.fillStyle = 'rgba(200, 210, 230, 0.5)';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Triton', tritonX, tritonY + tritonRadius + 12);
  }, []);

  // Memoized canvas drawing function
  const drawNeptune = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, timestamp: number) => {
    // Frame rate limiting - target 30 FPS
    if (timestamp - lastFrameTime.current < 33) return false;
    lastFrameTime.current = timestamp;

    const centerX = width / 2;
    const centerY = height * 0.45;
    const isMobile = width < 640;

    ctx.clearRect(0, 0, width, height);

    // Calculate positions - Neptune stays more centered
    const planetX = centerX;
    const planetY = centerY;
    const planetRadius = Math.min(width, height) * (isMobile ? 0.18 : 0.15);

    // Draw Triton behind Neptune (if on back of orbit)
    const tritonAngle = rotationRef.current.triton;
    if (Math.sin(-tritonAngle) <= -0.3) {
      drawTriton(ctx, planetX, planetY, planetRadius, rotationRef.current.triton);
    }

    // Draw back rings (behind planet) - much dimmer
    drawRings(ctx, planetX, planetY, planetRadius, true);

    // Neptune's deep outer glow (atmospheric scatter) - enhanced for depth
    const deepGlow = ctx.createRadialGradient(
      planetX, planetY, planetRadius * 0.5,
      planetX, planetY, planetRadius * 2.0
    );
    deepGlow.addColorStop(0, 'rgba(30, 80, 180, 0)');
    deepGlow.addColorStop(0.4, 'rgba(40, 100, 200, 0.08)');
    deepGlow.addColorStop(0.7, 'rgba(50, 120, 220, 0.04)');
    deepGlow.addColorStop(1, 'rgba(60, 140, 240, 0)');
    ctx.fillStyle = deepGlow;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetRadius * 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Inner atmospheric glow - stronger blue
    const innerGlow = ctx.createRadialGradient(
      planetX, planetY, planetRadius * 0.85,
      planetX, planetY, planetRadius * 1.25
    );
    innerGlow.addColorStop(0, 'rgba(60, 120, 200, 0)');
    innerGlow.addColorStop(0.3, 'rgba(70, 130, 210, 0.2)');
    innerGlow.addColorStop(0.6, 'rgba(80, 140, 220, 0.1)');
    innerGlow.addColorStop(1, 'rgba(90, 150, 230, 0)');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetRadius * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // Draw Neptune base - deeper blue colors (less cyan)
    const baseGradient = ctx.createRadialGradient(
      planetX - planetRadius * 0.35, 
      planetY - planetRadius * 0.35, 
      planetRadius * 0.02,
      planetX + planetRadius * 0.1, 
      planetY + planetRadius * 0.1, 
      planetRadius * 1.1
    );
    // Much deeper blue palette
    baseGradient.addColorStop(0, '#a0c4e8');
    baseGradient.addColorStop(0.15, '#7babd4');
    baseGradient.addColorStop(0.35, '#5088c0');
    baseGradient.addColorStop(0.55, '#3a6ca8');
    baseGradient.addColorStop(0.75, '#2a5090');
    baseGradient.addColorStop(0.9, '#1e3a70');
    baseGradient.addColorStop(1, '#152850');
    
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
    ctx.fill();

    // Save for clipped drawing
    ctx.save();
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
    ctx.clip();

    // Draw atmospheric bands - more subtle, deeper blues
    const bandColors = [
      { y: -0.7, opacity: 0.12, color: '120, 160, 200' },
      { y: -0.35, opacity: 0.15, color: '90, 140, 190' },
      { y: 0, opacity: 0.1, color: '70, 120, 180' },
      { y: 0.35, opacity: 0.18, color: '60, 100, 160' },
      { y: 0.7, opacity: 0.08, color: '50, 80, 140' }
    ];

    bandColors.forEach((band, i) => {
      const bandY = planetY + band.y * planetRadius;
      const offset = Math.sin(rotationRef.current.cloud + i * 0.5) * 2;
      const waveOffset = Math.cos(rotationRef.current.cloud * 0.7 + i) * 1.5;
      
      ctx.fillStyle = `rgba(${band.color}, ${band.opacity})`;
      ctx.beginPath();
      ctx.ellipse(planetX + offset, bandY + waveOffset, planetRadius * 1.15, planetRadius * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Add depth with subtle inner shadow
    const innerShadow = ctx.createRadialGradient(
      planetX, planetY, planetRadius * 0.3,
      planetX, planetY, planetRadius
    );
    innerShadow.addColorStop(0, 'rgba(10, 30, 60, 0)');
    innerShadow.addColorStop(0.7, 'rgba(10, 30, 60, 0)');
    innerShadow.addColorStop(1, 'rgba(5, 15, 40, 0.3)');
    ctx.fillStyle = innerShadow;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
    ctx.fill();

    // Bright polar regions (methane ice clouds) - more intense
    // North pole
    const northPoleGradient = ctx.createRadialGradient(
      planetX, planetY - planetRadius * 0.72, 0,
      planetX, planetY - planetRadius * 0.72, planetRadius * 0.45
    );
    northPoleGradient.addColorStop(0, 'rgba(220, 235, 255, 0.7)');
    northPoleGradient.addColorStop(0.2, 'rgba(180, 210, 250, 0.5)');
    northPoleGradient.addColorStop(0.5, 'rgba(140, 180, 240, 0.25)');
    northPoleGradient.addColorStop(0.8, 'rgba(100, 150, 220, 0.1)');
    northPoleGradient.addColorStop(1, 'rgba(70, 120, 200, 0)');
    ctx.fillStyle = northPoleGradient;
    ctx.beginPath();
    ctx.arc(planetX, planetY - planetRadius * 0.72, planetRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // South pole (brighter in JWST images) - enhanced
    const southPoleGradient = ctx.createRadialGradient(
      planetX, planetY + planetRadius * 0.68, 0,
      planetX, planetY + planetRadius * 0.68, planetRadius * 0.4
    );
    southPoleGradient.addColorStop(0, 'rgba(240, 250, 255, 0.6)');
    southPoleGradient.addColorStop(0.3, 'rgba(200, 225, 255, 0.4)');
    southPoleGradient.addColorStop(0.6, 'rgba(160, 195, 240, 0.15)');
    southPoleGradient.addColorStop(1, 'rgba(100, 150, 220, 0)');
    ctx.fillStyle = southPoleGradient;
    ctx.beginPath();
    ctx.arc(planetX, planetY + planetRadius * 0.68, planetRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Great Dark Spot - enhanced with more depth
    const spotX = planetX + Math.cos(rotationRef.current.storm) * planetRadius * 0.25;
    const spotY = planetY - planetRadius * 0.15;
    
    // Spot outer halo
    const spotHalo = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, planetRadius * 0.35);
    spotHalo.addColorStop(0, 'rgba(15, 30, 50, 0)');
    spotHalo.addColorStop(0.5, 'rgba(20, 40, 70, 0.15)');
    spotHalo.addColorStop(1, 'rgba(30, 60, 100, 0)');
    ctx.fillStyle = spotHalo;
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, planetRadius * 0.35, planetRadius * 0.2, 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Spot core
    const spotGradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, planetRadius * 0.22);
    spotGradient.addColorStop(0, 'rgba(10, 20, 40, 0.6)');
    spotGradient.addColorStop(0.4, 'rgba(20, 35, 60, 0.4)');
    spotGradient.addColorStop(0.7, 'rgba(35, 55, 90, 0.2)');
    spotGradient.addColorStop(1, 'rgba(50, 80, 130, 0)');
    ctx.fillStyle = spotGradient;
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, planetRadius * 0.22, planetRadius * 0.13, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Small companion storm
    const smallSpotX = spotX + planetRadius * 0.25;
    const smallSpotY = spotY + planetRadius * 0.12;
    const smallSpotGradient = ctx.createRadialGradient(smallSpotX, smallSpotY, 0, smallSpotX, smallSpotY, planetRadius * 0.08);
    smallSpotGradient.addColorStop(0, 'rgba(15, 30, 55, 0.4)');
    smallSpotGradient.addColorStop(1, 'rgba(40, 70, 110, 0)');
    ctx.fillStyle = smallSpotGradient;
    ctx.beginPath();
    ctx.arc(smallSpotX, smallSpotY, planetRadius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Terminator shadow (day/night) - enhanced gradient
    const terminatorGradient = ctx.createLinearGradient(
      planetX - planetRadius * 1.1, planetY,
      planetX + planetRadius * 0.4, planetY
    );
    terminatorGradient.addColorStop(0, 'rgba(0, 5, 15, 0.55)');
    terminatorGradient.addColorStop(0.3, 'rgba(5, 15, 35, 0.3)');
    terminatorGradient.addColorStop(0.6, 'rgba(10, 25, 50, 0.1)');
    terminatorGradient.addColorStop(0.8, 'rgba(20, 40, 70, 0)');
    terminatorGradient.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
    ctx.fillStyle = terminatorGradient;
    ctx.fillRect(planetX - planetRadius, planetY - planetRadius, planetRadius * 2, planetRadius * 2);

    ctx.restore();

    // Atmospheric rim (bright edge) - enhanced glow
    const rimGradient = ctx.createRadialGradient(
      planetX, planetY, planetRadius * 0.88,
      planetX, planetY, planetRadius * 1.08
    );
    rimGradient.addColorStop(0, 'rgba(150, 190, 240, 0)');
    rimGradient.addColorStop(0.4, 'rgba(170, 205, 250, 0.35)');
    rimGradient.addColorStop(0.6, 'rgba(140, 180, 235, 0.2)');
    rimGradient.addColorStop(0.8, 'rgba(110, 155, 220, 0.08)');
    rimGradient.addColorStop(1, 'rgba(80, 130, 200, 0)');
    ctx.fillStyle = rimGradient;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetRadius * 1.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Specular highlight (sun reflection)
    const specularGradient = ctx.createRadialGradient(
      planetX - planetRadius * 0.5, planetY - planetRadius * 0.45, 0,
      planetX - planetRadius * 0.5, planetY - planetRadius * 0.45, planetRadius * 0.35
    );
    specularGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    specularGradient.addColorStop(0.3, 'rgba(220, 240, 255, 0.08)');
    specularGradient.addColorStop(1, 'rgba(180, 210, 250, 0)');
    ctx.fillStyle = specularGradient;
    ctx.beginPath();
    ctx.arc(planetX - planetRadius * 0.5, planetY - planetRadius * 0.45, planetRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Draw front rings (in front of planet) - dimmer
    drawRings(ctx, planetX, planetY, planetRadius, false);
    
    // Draw Triton in front of Neptune (if on front of orbit)
    if (Math.sin(-tritonAngle) > -0.3) {
      drawTriton(ctx, planetX, planetY, planetRadius, rotationRef.current.triton);
    }

    // Update rotations
    rotationRef.current.planet += 0.0008;
    rotationRef.current.orbit += 0.001;
    rotationRef.current.storm += 0.0004;
    rotationRef.current.cloud += 0.002;
    rotationRef.current.triton += 0.003; // Triton orbits faster (5.877 day period)

    return true;
  }, [drawTriton]);

  // Ring drawing function - much dimmer, subtle
  const drawRings = useCallback((
    ctx: CanvasRenderingContext2D, 
    planetX: number, 
    planetY: number, 
    planetRadius: number, 
    isBack: boolean
  ) => {
    const tilt = 0.22; // Ring tilt angle
    
    // Ring data - much dimmer opacities
    const rings = [
      { inner: 1.68, outer: 1.73, opacity: 0.04, brightness: 0.5 },  // Galle
      { inner: 2.12, outer: 2.17, opacity: 0.07, brightness: 0.6 },  // Le Verrier
      { inner: 2.17, outer: 2.38, opacity: 0.02, brightness: 0.3 },  // Lassell (very diffuse)
      { inner: 2.48, outer: 2.58, opacity: 0.10, brightness: 0.7 },  // Adams (brightest but still dim)
    ];

    ctx.save();
    
    rings.forEach(ring => {
      const innerRadius = planetRadius * ring.inner;
      const outerRadius = planetRadius * ring.outer;
      
      ctx.beginPath();
      
      if (isBack) {
        ctx.ellipse(planetX, planetY, outerRadius, outerRadius * tilt, 0, 0, Math.PI);
        ctx.ellipse(planetX, planetY, innerRadius, innerRadius * tilt, 0, Math.PI, 0, true);
      } else {
        ctx.ellipse(planetX, planetY, outerRadius, outerRadius * tilt, 0, Math.PI, Math.PI * 2);
        ctx.ellipse(planetX, planetY, innerRadius, innerRadius * tilt, 0, 0, Math.PI, true);
      }
      
      ctx.closePath();
      
      // Dimmer, more blue-gray color
      const brightness = Math.floor(140 + ring.brightness * 40);
      const alpha = ring.opacity * (isBack ? 0.5 : 1);
      ctx.fillStyle = `rgba(${brightness - 20}, ${brightness}, ${brightness + 30}, ${alpha})`;
      ctx.fill();
    });
    
    ctx.restore();
  }, []);

  // Canvas setup and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isRunning = true;

    const setCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    setCanvasSize();

    const animate = (timestamp: number) => {
      if (!isRunning) return;
      
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      drawNeptune(ctx, width, height, timestamp);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(setCanvasSize, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [drawNeptune]);

  // Update time and weather simulation
  useEffect(() => {
    const updateNeptuneData = () => {
      const now = new Date();

      setEarthTime(now.toISOString().slice(11, 19));

      const neptuneDayInMs = NEPTUNE_DATA.dayLength * 60 * 60 * 1000;
      const msIntoNeptuneDay = now.getTime() % neptuneDayInMs;
      const neptuneHoursDecimal = (msIntoNeptuneDay / neptuneDayInMs) * 24;
      const h = Math.floor(neptuneHoursDecimal);
      const m = Math.floor((neptuneHoursDecimal - h) * 60);
      const s = Math.floor(((neptuneHoursDecimal - h) * 60 - m) * 60);
      setNeptuneTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);

      const t = now.getTime();
      const latitude = Math.sin(t / 50000) * 90;
      const hemisphere = latitude >= 0 ? 'Northern' : 'Southern';
      const temperature = Math.round(-210 + Math.sin(t / 30000) * 8);
      const windSpeed = Math.round(1200 + Math.sin(t / 20000) * 400);
      const stormActivity = Math.round(40 + Math.sin(t / 40000) * 35);

      let condition: string;
      if (stormActivity > 70) condition = 'Dark Storm System';
      else if (windSpeed > 1500) condition = 'Supersonic Winds';
      else if (Math.abs(latitude) > 60) condition = 'Polar Methane Clouds';
      else condition = 'Methane Haze';

      setWeather({
        windSpeed,
        temperature,
        condition,
        stormActivity,
        latitude: Math.round(latitude),
        hemisphere
      });
    };

    updateNeptuneData();
    const interval = setInterval(updateNeptuneData, 1000);
    return () => clearInterval(interval);
  }, [NEPTUNE_DATA.dayLength]);

  return (
    <div className={`neptune-widget ${className}`}>
      {/* Canvas for Neptune visualization */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 rounded-2xl overflow-hidden border border-blue-400/20">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
        
        {/* JWST badge */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-[9px] sm:text-[10px] text-blue-300/70 font-mono border border-blue-500/20">
          JWST Style
        </div>
        
        {/* Time overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            <div className="space-y-1">
              <div className="text-[10px] sm:text-xs text-blue-300/50 uppercase tracking-wider font-semibold">
                Neptune Local Time
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-300/80 font-mono tracking-tight">
                {neptuneTime}
              </div>
              <div className="text-[10px] sm:text-xs text-blue-400/40">
                Day Length: {NEPTUNE_DATA.dayLength}h
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] sm:text-xs text-blue-200/50 uppercase tracking-wider font-semibold">
                Earth Time (UTC)
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-200/80 font-mono tracking-tight">
                {earthTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Data Grid */}
      <div className="mt-3 sm:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-gradient-to-br from-blue-950/40 to-indigo-950/40 backdrop-blur-sm rounded-xl p-3 border border-blue-500/20">
          <div className="text-[10px] sm:text-xs text-blue-300/60 uppercase tracking-wider mb-1">Wind</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-300">{weather.windSpeed}</div>
          <div className="text-[10px] sm:text-xs text-blue-400/50">km/h</div>
        </div>

        <div className="bg-gradient-to-br from-blue-950/40 to-indigo-950/40 backdrop-blur-sm rounded-xl p-3 border border-blue-400/20">
          <div className="text-[10px] sm:text-xs text-blue-300/60 uppercase tracking-wider mb-1">Temp</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-300">{weather.temperature}°C</div>
          <div className="text-[10px] sm:text-xs text-blue-400/50">at 1 bar</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/40 to-blue-950/40 backdrop-blur-sm rounded-xl p-3 border border-indigo-500/20">
          <div className="text-[10px] sm:text-xs text-indigo-300/60 uppercase tracking-wider mb-1">Location</div>
          <div className="text-base sm:text-lg font-bold text-indigo-300">{weather.latitude}°</div>
          <div className="text-[10px] sm:text-xs text-indigo-400/50">{weather.hemisphere}</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 backdrop-blur-sm rounded-xl p-3 border border-indigo-400/20">
          <div className="text-[10px] sm:text-xs text-indigo-300/60 uppercase tracking-wider mb-1">Storm</div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-300">{weather.stormActivity}%</div>
          <div className="text-[10px] sm:text-xs text-indigo-400/50">Activity</div>
        </div>
      </div>

      {/* Current Conditions */}
      <div className="mt-3 bg-gradient-to-r from-blue-950/30 via-indigo-950/30 to-blue-950/30 backdrop-blur-sm rounded-xl p-3 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌀</span>
          <div>
            <div className="text-[10px] text-blue-300/60 uppercase tracking-wider">Current Conditions</div>
            <div className="text-base font-bold text-blue-300">{weather.condition}</div>
          </div>
        </div>
      </div>

      {/* Scientific Facts */}
      <div className="mt-3 bg-gradient-to-r from-blue-950/20 to-indigo-950/20 backdrop-blur-sm rounded-xl p-3 border border-blue-500/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🔭</span>
          <span className="text-xs font-semibold text-blue-300">NASA JWST + Voyager 2 Data</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-blue-300/70">
          <div>• Fastest winds: <strong className="text-blue-300">{NEPTUNE_DATA.maxWind} km/h</strong></div>
          <div>• Year: <strong className="text-blue-300">{NEPTUNE_DATA.yearLength} Earth years</strong></div>
          <div>• Triton: <strong className="text-blue-300">{NEPTUNE_DATA.triton.temperature}°C</strong> (retrograde orbit)</div>
          <div>• Blue color: <strong className="text-blue-300">{NEPTUNE_DATA.atmosphere.methane}% methane</strong></div>
        </div>
      </div>
    </div>
  );
}