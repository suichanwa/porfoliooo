import { useEffect, useRef, useState } from 'react';

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

  // Real Neptune scientific data from NASA/Voyager 2
  const NEPTUNE_DATA = {
    dayLength: 16.11, // hours
    yearLength: 164.8, // Earth years
    avgTemp: -214, // Celsius (at 1 bar pressure level)
    tempRange: { min: -218, max: -200 }, // Celsius variation
    maxWind: 2100, // km/h (fastest in solar system)
    avgWind: 1200, // km/h typical
    axialTilt: 28.32, // degrees (causes seasons)
    rotationPeriod: 16.11, // hours
    
    // Known features from observations
    greatDarkSpot: {
      discovered: 1989,
      size: '13,000 km × 6,600 km',
      windSpeed: 2400, // km/h
      disappeared: 1994
    },
    
    // Atmospheric composition
    atmosphere: {
      hydrogen: 80,
      helium: 19,
      methane: 1.5, // gives blue color
      trace: 0.5
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let rotation = 0;
    let orbitAngle = 0;
    let stormRotation = 0;
    let cloudOffset = 0;

    const drawNeptune = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const centerX = width / 2;
      const centerY = height * 0.4;

      ctx.clearRect(0, 0, width, height);

      // Calculate orbit position with adjusted radius for mobile
      const isMobile = width < 640;
      const orbitRadiusX = isMobile ? width * 0.25 : width * 0.35;
      const orbitRadiusY = isMobile ? height * 0.15 : height * 0.25;
      const planetX = centerX + Math.cos(orbitAngle) * orbitRadiusX;
      const planetY = centerY + Math.sin(orbitAngle) * orbitRadiusY;
      const planetRadius = Math.min(width, height) * (isMobile ? 0.15 : 0.12);

      // Draw orbit path
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, orbitRadiusX, orbitRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Neptune's outer glow (atmospheric scatter)
      const outerGlow = ctx.createRadialGradient(
        planetX, planetY, planetRadius * 0.8,
        planetX, planetY, planetRadius * 1.4
      );
      outerGlow.addColorStop(0, 'rgba(64, 156, 255, 0)');
      outerGlow.addColorStop(0.6, 'rgba(64, 156, 255, 0.15)');
      outerGlow.addColorStop(1, 'rgba(64, 156, 255, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Draw Neptune base - Deep blue with realistic colors
      // Neptune's actual color: Rich azure blue from methane absorption
      const baseGradient = ctx.createRadialGradient(
        planetX - planetRadius * 0.35, 
        planetY - planetRadius * 0.35, 
        planetRadius * 0.1,
        planetX, 
        planetY, 
        planetRadius
      );
      // Using actual Neptune colors from Voyager 2 imagery
      baseGradient.addColorStop(0, '#5ba3ff');    // Lighter blue (sunlit side)
      baseGradient.addColorStop(0.3, '#3d8eff');  // Medium azure
      baseGradient.addColorStop(0.6, '#2563eb');  // Deep blue
      baseGradient.addColorStop(0.85, '#1e40af'); // Darker blue
      baseGradient.addColorStop(1, '#1e3a8a');    // Shadow edge
      
      ctx.fillStyle = baseGradient;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(planetX, planetY);
      ctx.rotate(rotation);
      
      // Create clipping region for planet
      ctx.beginPath();
      ctx.arc(0, 0, planetRadius, 0, Math.PI * 2);
      ctx.clip();

      // Draw atmospheric bands (wind zones) - More realistic
      const bandData = [
        { y: -0.7, width: 0.3, color: 'rgba(91, 163, 255, 0.25)', blur: 15 },
        { y: -0.4, width: 0.25, color: 'rgba(59, 130, 246, 0.2)', blur: 12 },
        { y: -0.1, width: 0.35, color: 'rgba(37, 99, 235, 0.3)', blur: 18 },
        { y: 0.15, width: 0.3, color: 'rgba(30, 64, 175, 0.25)', blur: 10 },
        { y: 0.45, width: 0.28, color: 'rgba(30, 58, 138, 0.2)', blur: 14 },
        { y: 0.7, width: 0.25, color: 'rgba(23, 37, 84, 0.15)', blur: 8 }
      ];

      bandData.forEach((band, index) => {
        const bandY = band.y * planetRadius;
        const bandHeight = band.width * planetRadius;
        const offset = Math.sin(cloudOffset + index * 0.5) * 5;
        
        // Create soft cloud-like bands
        const bandGradient = ctx.createLinearGradient(
          -planetRadius, bandY,
          planetRadius, bandY
        );
        bandGradient.addColorStop(0, 'rgba(91, 163, 255, 0)');
        bandGradient.addColorStop(0.2, band.color);
        bandGradient.addColorStop(0.5, band.color);
        bandGradient.addColorStop(0.8, band.color);
        bandGradient.addColorStop(1, 'rgba(91, 163, 255, 0)');
        
        ctx.fillStyle = bandGradient;
        
        // Add slight wave pattern to bands
        ctx.beginPath();
        ctx.moveTo(-planetRadius, bandY - bandHeight/2);
        for (let x = -planetRadius; x <= planetRadius; x += 10) {
          const wave = Math.sin((x / planetRadius) * Math.PI * 3 + cloudOffset + index) * 3;
          ctx.lineTo(x + offset, bandY - bandHeight/2 + wave);
        }
        for (let x = planetRadius; x >= -planetRadius; x -= 10) {
          const wave = Math.sin((x / planetRadius) * Math.PI * 3 + cloudOffset + index) * 3;
          ctx.lineTo(x + offset, bandY + bandHeight/2 + wave);
        }
        ctx.closePath();
        ctx.fill();
      });

      // Draw Great Dark Spot (like Jupiter's Great Red Spot but dark blue)
      ctx.save();
      ctx.rotate(stormRotation);
      const spotX = planetRadius * 0.25;
      const spotY = planetRadius * -0.15;
      const spotWidth = planetRadius * 0.45;
      const spotHeight = planetRadius * 0.3;

      // Dark storm with realistic colors
      const spotGradient = ctx.createRadialGradient(
        spotX, spotY, 0,
        spotX, spotY, spotWidth
      );
      spotGradient.addColorStop(0, 'rgba(15, 23, 42, 0.7)');     // Very dark center
      spotGradient.addColorStop(0.3, 'rgba(30, 41, 59, 0.6)');   // Dark blue-gray
      spotGradient.addColorStop(0.6, 'rgba(51, 65, 85, 0.4)');   // Medium dark
      spotGradient.addColorStop(1, 'rgba(71, 85, 105, 0)');      // Fade out
      
      ctx.fillStyle = spotGradient;
      ctx.beginPath();
      ctx.ellipse(spotX, spotY, spotWidth, spotHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Add small bright clouds around the storm (like Voyager images)
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + stormRotation * 2;
        const dist = spotWidth * 1.2;
        const cloudX = spotX + Math.cos(angle) * dist;
        const cloudY = spotY + Math.sin(angle) * dist * 0.6;
        
        const cloudGradient = ctx.createRadialGradient(
          cloudX, cloudY, 0,
          cloudX, cloudY, planetRadius * 0.08
        );
        cloudGradient.addColorStop(0, 'rgba(147, 197, 253, 0.5)');
        cloudGradient.addColorStop(0.5, 'rgba(147, 197, 253, 0.2)');
        cloudGradient.addColorStop(1, 'rgba(147, 197, 253, 0)');
        
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, planetRadius * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();

      // Add subtle cloud texture overlay
      for (let i = 0; i < 8; i++) {
        const cloudX = (Math.random() - 0.5) * planetRadius * 1.6;
        const cloudY = (Math.random() - 0.5) * planetRadius * 1.6;
        const cloudSize = planetRadius * (0.05 + Math.random() * 0.1);
        
        const cloudGradient = ctx.createRadialGradient(
          cloudX, cloudY, 0,
          cloudX, cloudY, cloudSize
        );
        const opacity = 0.05 + Math.random() * 0.1;
        cloudGradient.addColorStop(0, `rgba(147, 197, 253, ${opacity})`);
        cloudGradient.addColorStop(1, 'rgba(147, 197, 253, 0)');
        
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add terminator (day/night boundary) for 3D effect
      const terminatorGradient = ctx.createLinearGradient(
        -planetRadius * 0.3, 0,
        planetRadius * 0.8, 0
      );
      terminatorGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      terminatorGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.15)');
      terminatorGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
      terminatorGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = terminatorGradient;
      ctx.fillRect(-planetRadius, -planetRadius, planetRadius * 2, planetRadius * 2);

      ctx.restore();

      // Add atmospheric rim lighting (methane absorption creates bright edge)
      const rimGradient = ctx.createRadialGradient(
        planetX, planetY, planetRadius * 0.88,
        planetX, planetY, planetRadius * 1.0
      );
      rimGradient.addColorStop(0, 'rgba(147, 197, 253, 0)');
      rimGradient.addColorStop(0.7, 'rgba(147, 197, 253, 0.3)');
      rimGradient.addColorStop(0.9, 'rgba(59, 130, 246, 0.4)');
      rimGradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
      
      ctx.fillStyle = rimGradient;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
      ctx.fill();

      // Update rotations with realistic speeds
      rotation += 0.0015;        // Faster rotation (16 hour day)
      orbitAngle += 0.002;       // Orbital motion
      stormRotation += 0.0003;   // Storm rotation
      cloudOffset += 0.005;      // Cloud drift

      animationRef.current = requestAnimationFrame(drawNeptune);
    };

    drawNeptune();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  // Update time and scientifically-based weather simulation
  useEffect(() => {
    const updateNeptuneData = () => {
      const now = new Date();

      // Earth time
      const earthHours = now.getUTCHours().toString().padStart(2, '0');
      const earthMinutes = now.getUTCMinutes().toString().padStart(2, '0');
      const earthSeconds = now.getUTCSeconds().toString().padStart(2, '0');
      setEarthTime(`${earthHours}:${earthMinutes}:${earthSeconds}`);

      // Neptune time (16.11 hour day)
      const neptuneDayInMs = NEPTUNE_DATA.dayLength * 60 * 60 * 1000;
      const msIntoNeptuneDay = now.getTime() % neptuneDayInMs;
      const neptuneHoursDecimal = (msIntoNeptuneDay / neptuneDayInMs) * 24;
      const neptuneHours = Math.floor(neptuneHoursDecimal);
      const neptuneMinutes = Math.floor((neptuneHoursDecimal - neptuneHours) * 60);
      const neptuneSeconds = Math.floor(((neptuneHoursDecimal - neptuneHours) * 60 - neptuneMinutes) * 60);
      setNeptuneTime(
        `${neptuneHours.toString().padStart(2, '0')}:${neptuneMinutes.toString().padStart(2, '0')}:${neptuneSeconds.toString().padStart(2, '0')}`
      );

      // Simulate latitude-based weather (scientifically accurate)
      const latitude = Math.sin(now.getTime() / 50000) * 90;
      const hemisphere = latitude >= 0 ? 'Northern' : 'Southern';
      
      // Temperature variation by latitude
      const latitudeFactor = Math.abs(latitude) / 90;
      const baseTemp = NEPTUNE_DATA.tempRange.max - (latitudeFactor * 18);
      const timeVariation = Math.sin(now.getTime() / 30000) * 3;
      const temperature = Math.round(baseTemp + timeVariation);

      // Wind speed varies by latitude and time
      const midLatitudeFactor = Math.sin((Math.abs(latitude) - 45) * Math.PI / 180);
      const baseWind = NEPTUNE_DATA.avgWind;
      const windVariation = (1 - midLatitudeFactor) * 900;
      const timeWind = Math.sin(now.getTime() / 20000) * 300;
      const windSpeed = Math.round(baseWind + windVariation + timeWind);

      // Storm activity
      const hemisphereBonus = hemisphere === 'Southern' ? 20 : 0;
      const stormBase = 30 + hemisphereBonus;
      const stormVariation = Math.abs(Math.sin(now.getTime() / 40000)) * 50;
      const stormActivity = Math.round(stormBase + stormVariation);

      // Determine conditions
      let condition: string;
      if (stormActivity > 70) {
        condition = 'Dark Storm System';
      } else if (windSpeed > 1800) {
        condition = 'Supersonic Winds';
      } else if (Math.abs(latitude) > 60) {
        condition = 'Polar Methane Clouds';
      } else if (windSpeed > 1400) {
        condition = 'High Wind Bands';
      } else {
        condition = 'Methane Haze';
      }

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
  }, []);

  return (
    <div className={`neptune-widget ${className}`}>
      {/* Canvas for Neptune visualization */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-gradient-to-b from-black via-indigo-950/20 to-black rounded-2xl overflow-hidden border border-blue-500/20">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
        
        {/* Time overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {/* Neptune Time */}
            <div className="space-y-1 sm:space-y-2">
              <div className="text-[10px] sm:text-xs text-blue-300/50 uppercase tracking-wider font-semibold">
                Neptune Local Time
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-300/80 font-mono tracking-tight">
                {neptuneTime}
              </div>
              <div className="text-[10px] sm:text-xs text-blue-400/40">
                Day Length: {NEPTUNE_DATA.dayLength} hours
              </div>
            </div>

            {/* Earth Time Reference */}
            <div className="space-y-1 sm:space-y-2">
              <div className="text-[10px] sm:text-xs text-cyan-300/50 uppercase tracking-wider font-semibold">
                Earth Time (UTC)
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-300/80 font-mono tracking-tight">
                {earthTime}
              </div>
              <div className="text-[10px] sm:text-xs text-cyan-400/40">
                Reference Time
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Weather Data - Responsive Grid */}
      <div className="mt-3 sm:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-gradient-to-br from-blue-950/40 to-indigo-950/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="text-[10px] sm:text-xs text-blue-300/60 uppercase tracking-wider">Wind Speed</div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-300">{weather.windSpeed}</div>
          <div className="text-[10px] sm:text-xs text-blue-400/50">km/h</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-950/40 to-blue-950/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
            <div className="text-[10px] sm:text-xs text-cyan-300/60 uppercase tracking-wider">Temperature</div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-cyan-300">{weather.temperature}°C</div>
          <div className="text-[10px] sm:text-xs text-cyan-400/50">at 1 bar</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-[10px] sm:text-xs text-indigo-300/60 uppercase tracking-wider">Location</div>
          </div>
          <div className="text-base sm:text-lg font-bold text-indigo-300">{weather.latitude}°</div>
          <div className="text-[10px] sm:text-xs text-indigo-400/50">{weather.hemisphere}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-950/40 to-pink-950/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="text-[10px] sm:text-xs text-purple-300/60 uppercase tracking-wider">Storm</div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-300">{weather.stormActivity}%</div>
          <div className="text-[10px] sm:text-xs text-purple-400/50">Intensity</div>
        </div>
      </div>

      {/* Current Conditions Card */}
      <div className="mt-3 sm:mt-4 bg-gradient-to-r from-indigo-950/30 via-blue-950/30 to-cyan-950/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <div>
            <div className="text-[10px] sm:text-xs text-blue-300/60 uppercase tracking-wider">Current Conditions</div>
            <div className="text-base sm:text-lg font-bold text-blue-300">{weather.condition}</div>
          </div>
        </div>
      </div>

      {/* Scientific Facts */}
      <div className="mt-3 sm:mt-4 bg-gradient-to-r from-blue-950/20 via-indigo-950/20 to-purple-950/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-500/10">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs sm:text-sm font-semibold text-blue-300">Based on NASA/Voyager 2 Observations (1989)</span>
        </div>
        
        <div className="text-[11px] sm:text-xs text-blue-300/70 space-y-2">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p><strong className="text-blue-300">Fastest winds in solar system:</strong> up to {NEPTUNE_DATA.maxWind} km/h</p>
          </div>
          
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>One Neptune year = <strong className="text-blue-300">{NEPTUNE_DATA.yearLength} Earth years</strong></p>
          </div>
          
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
            <p>Temperature range: <strong className="text-cyan-300">{NEPTUNE_DATA.tempRange.min}°C to {NEPTUNE_DATA.tempRange.max}°C</strong></p>
          </div>
          
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p>Great Dark Spot (1989-1994): <strong className="text-blue-300">{NEPTUNE_DATA.greatDarkSpot.size}</strong></p>
          </div>
          
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <p>Blue color from <strong className="text-indigo-300">{NEPTUNE_DATA.atmosphere.methane}% methane</strong> in atmosphere</p>
          </div>
          
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p>Distance from Sun: <strong className="text-indigo-300">4.5 billion km</strong> (30 AU)</p>
          </div>
        </div>
      </div>
    </div>
  );
}