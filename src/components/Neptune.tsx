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

  const NEPTUNE_DATA = useMemo(() => ({
    dayLength: 16.11,
    yearLength: 164.8,
    avgTemp: -214,
    tempRange: { min: -218, max: -200 },
    maxWind: 2100,
    avgWind: 1200,
    axialTilt: 28.32,
    rotationPeriod: 16.11,
    orbitalPeriod: 164.8,
    distanceFromSun: 30.07,
    
    rings: {
      galle: { 
        innerRadius: 1.655,
        outerRadius: 1.733,
        opticalDepth: 0.0001,
        dustFraction: 0.55,
        width: 2000
      },
      leVerrier: { 
        innerRadius: 2.148,
        width: 0.00456,
        opticalDepth: 0.0062,
        dustFraction: 0.55
      },
      lassell: { 
        innerRadius: 2.148,
        outerRadius: 2.310,
        opticalDepth: 0.0001,
        dustFraction: 0.30,
        width: 4000
      },
      arago: { 
        radius: 2.310,
        width: 0.004,
        opticalDepth: 0.0002,
        dustFraction: 0.40
      },
      adams: { 
        radius: 2.541,
        width: 0.0014,
        opticalDepth: 0.011,
        dustFraction: 0.30,
        eccentricity: 0.00047,
        inclination: 0.0617,
        arcs: [
          { name: 'Fraternité', longitude: 247, span: 10, brightness: 0.09 },
          { name: 'Égalité 1', longitude: 261, span: 3, brightness: 0.05 },
          { name: 'Égalité 2', longitude: 265, span: 1, brightness: 0.04 },
          { name: 'Liberté', longitude: 276, span: 4, brightness: 0.07 },
          { name: 'Courage', longitude: 284.5, span: 1, brightness: 0.03 }
        ]
      }
    },
    
    triton: {
      orbitalPeriod: 5.877,
      distance: 354759,
      radius: 1353.4,
      temperature: -235,
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

  const drawTriton = useCallback((
    ctx: CanvasRenderingContext2D,
    planetX: number,
    planetY: number,
    planetRadius: number,
    time: number
  ) => {
    const orbitRadius = planetRadius * 3.2;
    const orbitTilt = 0.35;
    const tritonAngle = -time;
    
    const tritonX = planetX + Math.cos(tritonAngle) * orbitRadius;
    const tritonY = planetY + Math.sin(tritonAngle) * orbitRadius * orbitTilt;
    const tritonRadius = planetRadius * 0.12;
    
    const isInFront = Math.sin(tritonAngle) > -0.3;
    
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, orbitRadius, orbitRadius * orbitTilt, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    if (!isInFront) return;
    
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
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(tritonX, tritonY, tritonRadius, 0, Math.PI * 2);
    ctx.clip();
    
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
  }, []);

  const drawRings = useCallback((
    ctx: CanvasRenderingContext2D, 
    planetX: number, 
    planetY: number, 
    planetRadius: number, 
    isBack: boolean
  ) => {
    const tilt = 0.22;
    const rings = NEPTUNE_DATA.rings;
    
    ctx.save();
    
    if (!isBack) {
      const galleInner = planetRadius * rings.galle.innerRadius;
      const galleOuter = planetRadius * rings.galle.outerRadius;
      
      ctx.beginPath();
      ctx.ellipse(planetX, planetY, galleOuter, galleOuter * tilt, 0, Math.PI, Math.PI * 2);
      ctx.ellipse(planetX, planetY, galleInner, galleInner * tilt, 0, 0, Math.PI, true);
      ctx.closePath();
      
      const galleGradient = ctx.createRadialGradient(planetX, planetY, galleInner, planetX, planetY, galleOuter);
      galleGradient.addColorStop(0, 'rgba(140, 150, 170, 0.015)');
      galleGradient.addColorStop(0.5, 'rgba(130, 145, 165, 0.025)');
      galleGradient.addColorStop(1, 'rgba(120, 140, 160, 0.01)');
      ctx.fillStyle = galleGradient;
      ctx.fill();
    }
    
    const leVerrierRadius = planetRadius * rings.leVerrier.innerRadius;
    const leVerrierWidth = planetRadius * rings.leVerrier.width;
    
    ctx.beginPath();
    if (isBack) {
      ctx.ellipse(planetX, planetY, leVerrierRadius + leVerrierWidth/2, (leVerrierRadius + leVerrierWidth/2) * tilt, 0, 0, Math.PI);
      ctx.ellipse(planetX, planetY, leVerrierRadius - leVerrierWidth/2, (leVerrierRadius - leVerrierWidth/2) * tilt, 0, Math.PI, 0, true);
    } else {
      ctx.ellipse(planetX, planetY, leVerrierRadius + leVerrierWidth/2, (leVerrierRadius + leVerrierWidth/2) * tilt, 0, Math.PI, Math.PI * 2);
      ctx.ellipse(planetX, planetY, leVerrierRadius - leVerrierWidth/2, (leVerrierRadius - leVerrierWidth/2) * tilt, 0, 0, Math.PI, true);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(135, 150, 175, ${isBack ? 0.04 : 0.08})`;
    ctx.lineWidth = leVerrierWidth;
    ctx.stroke();
    
    if (!isBack) {
      const lassellInner = planetRadius * rings.lassell.innerRadius;
      const lassellOuter = planetRadius * rings.lassell.outerRadius;
      
      ctx.beginPath();
      ctx.ellipse(planetX, planetY, lassellOuter, lassellOuter * tilt, 0, Math.PI, Math.PI * 2);
      ctx.ellipse(planetX, planetY, lassellInner, lassellInner * tilt, 0, 0, Math.PI, true);
      ctx.closePath();
      
      ctx.fillStyle = 'rgba(130, 145, 165, 0.012)';
      ctx.fill();
    }
    
    const aragoRadius = planetRadius * rings.arago.radius;
    const aragoWidth = planetRadius * rings.arago.width;
    
    ctx.beginPath();
    if (isBack) {
      ctx.ellipse(planetX, planetY, aragoRadius, aragoRadius * tilt, 0, 0, Math.PI);
    } else {
      ctx.ellipse(planetX, planetY, aragoRadius, aragoRadius * tilt, 0, Math.PI, Math.PI * 2);
    }
    ctx.strokeStyle = `rgba(140, 155, 180, ${isBack ? 0.025 : 0.05})`;
    ctx.lineWidth = aragoWidth;
    ctx.stroke();
    
    const adamsRadius = planetRadius * rings.adams.radius;
    const adamsWidth = planetRadius * rings.adams.width;
    
    ctx.beginPath();
    if (isBack) {
      ctx.ellipse(planetX, planetY, adamsRadius, adamsRadius * tilt, 0, 0, Math.PI);
    } else {
      ctx.ellipse(planetX, planetY, adamsRadius, adamsRadius * tilt, 0, Math.PI, Math.PI * 2);
    }
    ctx.strokeStyle = `rgba(140, 160, 190, ${isBack ? 0.03 : 0.06})`;
    ctx.lineWidth = adamsWidth * 0.6;
    ctx.stroke();
    
    if (!isBack) {
      rings.adams.arcs.forEach(arc => {
        const startAngle = (arc.longitude * Math.PI / 180) + Math.PI;
        const endAngle = startAngle + (arc.span * Math.PI / 180);
        
        ctx.beginPath();
        ctx.ellipse(planetX, planetY, adamsRadius, adamsRadius * tilt, 0, startAngle, endAngle);
        
        const arcOpacity = 0.15 + (arc.brightness * 0.8);
        ctx.strokeStyle = `rgba(160, 180, 210, ${arcOpacity})`;
        ctx.lineWidth = adamsWidth * 1.5;
        ctx.stroke();
        
        ctx.strokeStyle = `rgba(180, 200, 230, ${arcOpacity * 0.3})`;
        ctx.lineWidth = adamsWidth * 3;
        ctx.stroke();
      });
    }
    
    ctx.restore();
  }, [NEPTUNE_DATA.rings]);

  const drawNeptune = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, timestamp: number) => {
    if (timestamp - lastFrameTime.current < 33) return false;
    lastFrameTime.current = timestamp;

    const isMobile = width < 640;

    ctx.clearRect(0, 0, width, height);

    // Invisible orbital center
    const orbitCenterX = width * 0.5;
    const orbitCenterY = height * 0.45;
    const orbitRadius = width * (isMobile ? 0.15 : 0.12);

    // Calculate Neptune's position in orbit around invisible center
    const neptuneAngle = rotationRef.current.orbit;
    const planetX = orbitCenterX + Math.cos(neptuneAngle) * orbitRadius;
    const planetY = orbitCenterY + Math.sin(neptuneAngle) * orbitRadius * 0.3;
    const planetRadius = Math.min(width, height) * (isMobile ? 0.18 : 0.15);

    const tritonAngle = rotationRef.current.triton;
    if (Math.sin(-tritonAngle) <= -0.3) {
      drawTriton(ctx, planetX, planetY, planetRadius, rotationRef.current.triton);
    }

    drawRings(ctx, planetX, planetY, planetRadius, true);

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

    const baseGradient = ctx.createRadialGradient(
      planetX - planetRadius * 0.35, 
      planetY - planetRadius * 0.35, 
      planetRadius * 0.02,
      planetX + planetRadius * 0.1, 
      planetY + planetRadius * 0.1, 
      planetRadius * 1.1
    );
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

    ctx.save();
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
    ctx.clip();

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

    const spotX = planetX + Math.cos(rotationRef.current.storm) * planetRadius * 0.25;
    const spotY = planetY - planetRadius * 0.15;
    
    const spotHalo = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, planetRadius * 0.35);
    spotHalo.addColorStop(0, 'rgba(15, 30, 50, 0)');
    spotHalo.addColorStop(0.5, 'rgba(20, 40, 70, 0.15)');
    spotHalo.addColorStop(1, 'rgba(30, 60, 100, 0)');
    ctx.fillStyle = spotHalo;
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, planetRadius * 0.35, planetRadius * 0.2, 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    const spotGradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, planetRadius * 0.22);
    spotGradient.addColorStop(0, 'rgba(10, 20, 40, 0.6)');
    spotGradient.addColorStop(0.4, 'rgba(20, 35, 60, 0.4)');
    spotGradient.addColorStop(0.7, 'rgba(35, 55, 90, 0.2)');
    spotGradient.addColorStop(1, 'rgba(50, 80, 130, 0)');
    ctx.fillStyle = spotGradient;
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, planetRadius * 0.22, planetRadius * 0.13, 0.15, 0, Math.PI * 2);
    ctx.fill();

    const smallSpotX = spotX + planetRadius * 0.25;
    const smallSpotY = spotY + planetRadius * 0.12;
    const smallSpotGradient = ctx.createRadialGradient(smallSpotX, smallSpotY, 0, smallSpotX, smallSpotY, planetRadius * 0.08);
    smallSpotGradient.addColorStop(0, 'rgba(15, 30, 55, 0.4)');
    smallSpotGradient.addColorStop(1, 'rgba(40, 70, 110, 0)');
    ctx.fillStyle = smallSpotGradient;
    ctx.beginPath();
    ctx.arc(smallSpotX, smallSpotY, planetRadius * 0.08, 0, Math.PI * 2);
    ctx.fill();

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

    drawRings(ctx, planetX, planetY, planetRadius, false);
    
    if (Math.sin(-tritonAngle) > -0.3) {
      drawTriton(ctx, planetX, planetY, planetRadius, rotationRef.current.triton);
    }

    rotationRef.current.planet += 0.0008;
    rotationRef.current.orbit += 0.0005;
    rotationRef.current.storm += 0.0004;
    rotationRef.current.cloud += 0.002;
    rotationRef.current.triton += 0.003;

    return true;
  }, [drawTriton, drawRings]);

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
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 rounded-2xl overflow-hidden border border-blue-400/20">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
        
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-[9px] sm:text-[10px] text-blue-300/70 font-mono border border-blue-500/20">
          JWST + Voyager 2
        </div>
        
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
                Day Length: {NEPTUNE_DATA.dayLength}h | Orbital Period: {NEPTUNE_DATA.orbitalPeriod} years
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

      <div className="mt-3 bg-gradient-to-r from-blue-950/30 via-indigo-950/30 to-blue-950/30 backdrop-blur-sm rounded-xl p-3 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌀</span>
          <div>
            <div className="text-[10px] text-blue-300/60 uppercase tracking-wider">Current Conditions</div>
            <div className="text-base font-bold text-blue-300">{weather.condition}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 bg-gradient-to-r from-blue-950/20 to-indigo-950/20 backdrop-blur-sm rounded-xl p-3 border border-blue-500/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🔭</span>
          <span className="text-xs font-semibold text-blue-300">Orbiting at {NEPTUNE_DATA.distanceFromSun} AU from the Sun</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-blue-300/70">
          <div>• Adams ring arcs: <strong className="text-blue-300">5 distinct bright clumps</strong></div>
          <div>• Ring material: <strong className="text-blue-300">20-70% dust particles</strong></div>
          <div>• Optical depth: <strong className="text-blue-300">&lt;0.1 (very transparent)</strong></div>
          <div>• Triton: <strong className="text-blue-300">{NEPTUNE_DATA.triton.temperature}°C</strong> (retrograde)</div>
        </div>
      </div>
    </div>
  );
}
