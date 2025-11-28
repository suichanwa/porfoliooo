// Vector2D class for 2D physics operations
export class Vector2D {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  // Vector addition
  add(vector: Vector2D): Vector2D {
    return new Vector2D(this.x + vector.x, this.y + vector.y);
  }

  // Vector subtraction
  subtract(vector: Vector2D): Vector2D {
    return new Vector2D(this.x - vector.x, this.y - vector.y);
  }

  // Scalar multiplication
  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  // Vector magnitude (length)
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // Normalize vector to unit length
  normalize(): Vector2D {
    const mag = this.magnitude();
    return mag > 0 ? this.multiply(1 / mag) : new Vector2D(0, 0);
  }

  // Calculate distance to another vector
  distanceTo(vector: Vector2D): number {
    return this.subtract(vector).magnitude();
  }

  // Create a copy of this vector
  copy(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  // Convert to string for debugging
  toString(): string {
    return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}

// Physics Object Interface - base for all renderable objects
export interface PhysicsObject {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  mass: number;
  radius: number;
  isStatic: boolean;
  color: string;
  opacity: number;
  
  // Newton's First Law properties
  inertia: number; // Resistance to change in motion
  friction: number; // Friction coefficient (0-1)
  airResistance: number; // Air resistance coefficient (0-1)
  
  // Methods
  applyForce(force: Vector2D): void;
  update(deltaTime: number, bounds?: { width: number; height: number }): void;
  stopMotion(): void;
  setInitialVelocity(velocity: Vector2D): void;
  getRenderInfo(): {
    x: number;
    y: number;
    radius: number;
    color: string;
    opacity: number;
  };
}

// Base Physics Object implementing Newton's First Law
export class BasePhysicsObject implements PhysicsObject {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  mass: number;
  radius: number;
  isStatic: boolean;
  color: string;
  opacity: number;
  
  // Newton's First Law properties
  inertia: number; // Higher = more resistance to motion changes
  friction: number; // Surface friction (0-1)
  airResistance: number; // Air drag (0-1)
  
  // Force accumulation for this frame
  private accumulatedForce: Vector2D = new Vector2D(0, 0);

  constructor(
    id: string,
    position: Vector2D,
    mass: number = 1,
    radius: number = 10,
    color: string = '#4F46E5',
    isStatic: boolean = false
  ) {
    this.id = id;
    this.position = position;
    this.velocity = new Vector2D(0, 0);
    this.mass = mass;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.isStatic = isStatic;
    
    // Default physics properties
    this.inertia = mass; // Inertia proportional to mass (Newton's First Law)
    this.friction = 0.8; // Medium friction
    this.airResistance = 0.02; // Low air resistance
  }

  // Apply force to the object (F = ma)
  applyForce(force: Vector2D): void {
    if (this.isStatic) return;
    
    // Accumulate forces for this frame
    this.accumulatedForce = this.accumulatedForce.add(force);
  }

  // Update physics based on accumulated forces
  update(deltaTime: number, bounds?: { width: number; height: number }): void {
    if (this.isStatic) return;

    // Apply Newton's Second Law: F = ma, so a = F/m
    // Higher inertia means more force needed to change motion
    const acceleration = this.accumulatedForce.multiply(1 / this.inertia);
    
    // Update velocity based on acceleration
    this.velocity = this.velocity.add(acceleration.multiply(deltaTime));
    
    // Apply friction and air resistance (Newton's First Law - resistance to change)
    const frictionForce = this.velocity.copy().multiply(-this.friction * this.mass);
    const airResistanceForce = this.velocity.copy().multiply(-this.airResistance * this.velocity.magnitude());
    
    this.velocity = this.velocity.add(frictionForce.multiply(deltaTime / this.mass));
    this.velocity = this.velocity.add(airResistanceForce.multiply(deltaTime / this.mass));
    
    // Update position based on velocity
    const displacement = this.velocity.copy().multiply(deltaTime);
    this.position = this.position.add(displacement);
    
    // Boundary collision (simple bounce with energy loss)
    if (bounds) {
      // Left/Right walls
      if (this.position.x - this.radius < 0 || this.position.x + this.radius > bounds.width) {
        this.velocity.x *= -0.8; // Energy loss on bounce
        this.position.x = Math.max(this.radius, Math.min(bounds.width - this.radius, this.position.x));
      }
      
      // Top/Bottom walls
      if (this.position.y - this.radius < 0 || this.position.y + this.radius > bounds.height) {
        this.velocity.y *= -0.8; // Energy loss on bounce
        this.position.y = Math.max(this.radius, Math.min(bounds.height - this.radius, this.position.y));
      }
    }
    
    // Reset accumulated force
    this.accumulatedForce = new Vector2D(0, 0);
  }

  // Stop motion (for Newton's First Law demonstration)
  stopMotion(): void {
    this.velocity = new Vector2D(0, 0);
  }

  // Give initial velocity (demonstrates inertia)
  setInitialVelocity(velocity: Vector2D): void {
    this.velocity = velocity;
  }

  // Get rendering information
  getRenderInfo(): {
    x: number;
    y: number;
    radius: number;
    color: string;
    opacity: number;
  } {
    return {
      x: this.position.x,
      y: this.position.y,
      radius: this.radius,
      color: this.color,
      opacity: this.opacity
    };
  }

  // Set color with opacity
  setColor(color: string, opacity: number = 1): void {
    this.color = color;
    this.opacity = opacity;
  }
}

// Render Engine Class
export class RenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private objects: Map<string, PhysicsObject> = new Map();
  private animationId: number | null = null;
  private isRunning: boolean = false;
  public performanceMonitor: PerformanceMonitor;
  
  // Physics world settings
  private gravity: Vector2D = new Vector2D(0, 0); // No gravity by default for portfolio objects
  private bounds: { width: number; height: number } = { width: 800, height: 600 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
    this.performanceMonitor = new PerformanceMonitor();
    
    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.bounds = { width: rect.width, height: rect.height };
  }

  // Add object to the simulation
  addObject(object: PhysicsObject): void {
    this.objects.set(object.id, object);
    this.performanceMonitor.setObjectCount(this.objects.size);
  }

  // Remove object from simulation
  removeObject(id: string): void {
    this.objects.delete(id);
    this.performanceMonitor.setObjectCount(this.objects.size);
  }

  // Get object by ID
  getObject(id: string): PhysicsObject | undefined {
    return this.objects.get(id);
  }

  // Start the render loop
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.gameLoop();
  }

  // Stop the render loop
  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Main game loop
  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const deltaTime = this.performanceMonitor.getDeltaTime();
    
    // Update all objects
    this.updateObjects(deltaTime);
    
    // Render all objects
    this.render();
    
    // Update performance stats
    this.performanceMonitor.update();
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  // Update all physics objects
  private updateObjects(deltaTime: number): void {
    // Apply gravity to all objects
    for (const object of this.objects.values()) {
      if (!object.isStatic && this.gravity.magnitude() > 0) {
        object.applyForce(this.gravity.multiply(object.mass));
      }
      
      // Update physics
      object.update(deltaTime, this.bounds);
    }
  }

  // Render all objects
  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.bounds.width, this.bounds.height);
    
    // Render grid for reference (optional)
    this.renderGrid();
    
    // Render all objects
    for (const object of this.objects.values()) {
      this.renderObject(object);
      this.performanceMonitor.incrementDrawCalls();
    }
    
    this.performanceMonitor.resetDrawCalls();
  }

  // Render individual object
  private renderObject(object: PhysicsObject): void {
    const renderInfo = object.getRenderInfo();
    
    this.ctx.save();
    
    // Set opacity
    this.ctx.globalAlpha = renderInfo.opacity;
    
    // Set color
    this.ctx.fillStyle = renderInfo.color;
    
    // Draw object as circle
    this.ctx.beginPath();
    this.ctx.arc(renderInfo.x, renderInfo.y, renderInfo.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add velocity indicator (for debugging Newton's First Law)
    this.renderVelocityIndicator(object);
    
    this.ctx.restore();
  }

  // Render velocity indicator (shows motion direction and magnitude)
  private renderVelocityIndicator(object: PhysicsObject): void {
    if (object.velocity.magnitude() < 1) return; // Don't show for stationary objects
    
    const startX = object.position.x;
    const startY = object.position.y;
    const velocityScale = 2; // Scale factor for visibility
    
    const endX = startX + object.velocity.x * velocityScale * 0.1;
    const endY = startY + object.velocity.y * velocityScale * 0.1;
    
    this.ctx.save();
    this.ctx.strokeStyle = '#FF6B6B';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // Arrow head
    const angle = Math.atan2(object.velocity.y, object.velocity.x);
    const arrowLength = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowLength * Math.cos(angle - Math.PI / 6),
      endY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowLength * Math.cos(angle + Math.PI / 6),
      endY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
    this.ctx.restore();
  }

  // Render background grid
  private renderGrid(): void {
    this.ctx.save();
    this.ctx.strokeStyle = '#E5E7EB';
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.3;
    
    const gridSize = 50;
    
    // Vertical lines
    for (let x = 0; x <= this.bounds.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.bounds.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= this.bounds.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.bounds.width, y);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  // Apply random force to all objects (demonstrates Newton's First Law)
  applyRandomForces(): void {
    for (const object of this.objects.values()) {
      if (object.isStatic) continue;
      
      const angle = Math.random() * Math.PI * 2;
      const magnitude = Math.random() * 50 + 10; // Random force magnitude
      
      const force = new Vector2D(
        Math.cos(angle) * magnitude,
        Math.sin(angle) * magnitude
      );
      
      object.applyForce(force);
    }
  }

  // Reset all objects to stationary state
  resetAllObjects(): void {
    for (const object of this.objects.values()) {
      object.stopMotion();
    }
  }

  // Get all objects
  getAllObjects(): PhysicsObject[] {
    return Array.from(this.objects.values());
  }

  // Clear all objects
  clearAllObjects(): void {
    this.objects.clear();
    this.performanceMonitor.setObjectCount(0);
  }

  // Set gravity vector
  setGravity(gravity: Vector2D): void {
    this.gravity = gravity;
  }

  // Get performance statistics
  getPerformanceStats() {
    return this.performanceMonitor.getStats();
  }
}

// Performance Monitor Class
export class PerformanceMonitor {
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 60;
  private deltaTime: number = 0;
  private lastFrameTime: number = performance.now();
  
  // Memory tracking
  private memoryUsage: number = 0;
  private drawCalls: number = 0;
  private objectCount: number = 0;

  update(): void {
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    
    this.frameCount++;
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Check memory if available
      if ((performance as any).memory) {
        this.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576; // MB
      }
    }
  }

  getFPS(): number {
    return Math.min(this.fps, 60); // Cap at 60
  }

  getDeltaTime(): number {
    return Math.min(this.deltaTime, 0.1); // Cap to prevent spiral of death
  }

  getMemoryUsage(): number {
    return this.memoryUsage;
  }

  incrementDrawCalls(): void {
    this.drawCalls++;
  }

  resetDrawCalls(): void {
    this.drawCalls = 0;
  }

  getDrawCalls(): number {
    return this.drawCalls;
  }

  setObjectCount(count: number): void {
    this.objectCount = count;
  }

  getObjectCount(): number {
    return this.objectCount;
  }

  getStats(): {
    fps: number;
    deltaTime: number;
    memory: number;
    drawCalls: number;
    objects: number;
  } {
    return {
      fps: this.getFPS(),
      deltaTime: this.getDeltaTime(),
      memory: this.memoryUsage,
      drawCalls: this.drawCalls,
      objects: this.objectCount,
    };
  }
}
