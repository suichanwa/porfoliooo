import { Vector2D, BasePhysicsObject } from '../core/RenderEngine';

// ===============================================
// SPECIALIZED PHYSICS OBJECTS FOR PORTFOLIO
// ===============================================

// Diary Entry Motion - Floating, gentle movements for diary entries
export class DiaryEntryObject extends BasePhysicsObject {
  private floatPhase: number = 0;
  private floatSpeed: number = 1;
  private originalPosition: Vector2D;
  
  constructor(
    id: string,
    position: Vector2D,
    radius: number = 15,
    color: string = '#8B5CF6'
  ) {
    super(id, position, 0.5, radius, color, false);
    
    this.originalPosition = position.copy();
    this.inertia = 0.3; // Low inertia for gentle motion
    this.friction = 0.9; // High friction for smooth stopping
    this.airResistance = 0.05; // Some air resistance for realism
  }
  
  update(deltaTime: number, bounds?: { width: number; height: number }): void {
    // Apply gentle floating motion
    this.floatPhase += deltaTime * this.floatSpeed;
    const floatOffset = Math.sin(this.floatPhase) * 2;
    
    // Apply floating to position
    const targetY = this.originalPosition.y + floatOffset;
    const floatForce = new Vector2D(0, (targetY - this.position.y) * 0.1);
    
    if (Math.abs(targetY - this.position.y) > 0.1) {
      this.applyForce(floatForce);
    }
    
    // Update base physics
    super.update(deltaTime, bounds);
  }
}

// Page Flip Motion - Realistic page turning for book/diary interface
export class PageFlipObject extends BasePhysicsObject {
  private rotationAngle: number = 0;
  private rotationSpeed: number = 2;
  private isFlipping: boolean = false;
  
  constructor(
    id: string,
    position: Vector2D,
    radius: number = 20,
    color: string = '#F59E0B'
  ) {
    super(id, position, 1, radius, color, false);
    
    this.inertia = 1.5; // Higher inertia for page flip realism
    this.friction = 0.7;
    this.airResistance = 0.03;
  }
  
  startFlip(): void {
    this.isFlipping = true;
    const flipForce = new Vector2D(0, -30); // Initial upward force
    this.applyForce(flipForce);
  }
  
  update(deltaTime: number, bounds?: { width: number; height: number }): void {
    if (this.isFlipping) {
      this.rotationAngle += deltaTime * this.rotationSpeed;
      
      // Apply rotation force
      const rotationForce = new Vector2D(
        Math.cos(this.rotationAngle) * 5,
        Math.sin(this.rotationAngle) * 5
      );
      this.applyForce(rotationForce);
      
      // Stop flipping after full rotation
      if (this.rotationAngle >= Math.PI * 2) {
        this.rotationAngle = 0;
        this.isFlipping = false;
        this.stopMotion();
      }
    }
    
    super.update(deltaTime, bounds);
  }
  
  getRenderInfo() {
    const baseInfo = super.getRenderInfo();
    return {
      ...baseInfo,
      rotation: this.rotationAngle
    };
  }
}

// Project Card Motion - Bouncy, engaging motion for project showcase
export class ProjectCardObject extends BasePhysicsObject {
  private bouncePhase: number = 0;
  private hoverHeight: number = 10;
  private isHovering: boolean = true;
  private originalPosition: Vector2D;
  
  constructor(
    id: string,
    position: Vector2D,
    radius: number = 25,
    color: string = '#10B981'
  ) {
    super(id, position, 2, radius, color, false);
    
    this.originalPosition = position.copy();
    this.inertia = 2; // Medium-high inertia for satisfying bounce
    this.friction = 0.6;
    this.airResistance = 0.04;
  }
  
  setHovering(hovering: boolean): void {
    this.isHovering = hovering;
  }
  
  applyBounce(): void {
    const bounceForce = new Vector2D(0, -50);
    this.applyForce(bounceForce);
  }
  
  update(deltaTime: number, bounds?: { width: number; height: number }): void {
    if (this.isHovering) {
      this.bouncePhase += deltaTime * 1.5;
      const hoverOffset = Math.sin(this.bouncePhase) * this.hoverHeight * 0.3;
      
      const targetY = this.originalPosition.y + hoverOffset;
      const hoverForce = new Vector2D(0, (targetY - this.position.y) * 0.05);
      
      if (Math.abs(targetY - this.position.y) > 0.1) {
        this.applyForce(hoverForce);
      }
    }
    
    super.update(deltaTime, bounds);
  }
}

// Skill Badge Motion - Subtle pulsing and rotation for skill displays
export class SkillBadgeObject extends BasePhysicsObject {
  private pulsePhase: number = 0;
  private pulseSpeed: number = 3;
  private baseRadius: number;
  
  constructor(
    id: string,
    position: Vector2D,
    radius: number = 12,
    color: string = '#EF4444'
  ) {
    super(id, position, 0.8, radius, color, false);
    this.baseRadius = radius;
    
    this.inertia = 0.8;
    this.friction = 0.85;
    this.airResistance = 0.02;
  }
  
  update(deltaTime: number, bounds?: { width: number; height: number }): void {
    this.pulsePhase += deltaTime * this.pulseSpeed;
    
    // Pulse effect
    const pulseFactor = 1 + Math.sin(this.pulsePhase) * 0.2;
    this.radius = this.baseRadius * pulseFactor;
    
    super.update(deltaTime, bounds);
  }
}

// Navigation Dot Motion - Smooth traversal for navigation elements
export class NavigationDotObject extends BasePhysicsObject {
  private pathProgress: number = 0;
  private pathSpeed: number = 1;
  private waypoints: Vector2D[] = [];
  private currentWaypoint: number = 0;
  
  constructor(
    id: string,
    position: Vector2D,
    waypoints: Vector2D[],
    radius: number = 8,
    color: string = '#3B82F6'
  ) {
    super(id, position, 0.3, radius, color, false);
    
    this.waypoints = waypoints;
    this.inertia = 0.4; // Low inertia for smooth navigation
    this.friction = 0.95; // High friction for controlled movement
    this.airResistance = 0.01;
  }
  
  nextWaypoint(): void {
    this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
    this.moveToWaypoint();
  }
  
  private moveToWaypoint(): void {
    const target = this.waypoints[this.currentWaypoint];
    const direction = target.subtract(this.position).normalize();
    const distance = this.position.distanceTo(target);
    
    // Calculate force based on distance
    const forceMagnitude = Math.min(distance * 2, 30);
    const moveForce = direction.multiply(forceMagnitude);
    
    this.applyForce(moveForce);
  }
  
  update(deltaTime: number, bounds?: { width: number; height: number }): void {
    super.update(deltaTime, bounds);
    
    // Check if we've reached the current waypoint
    const target = this.waypoints[this.currentWaypoint];
    if (this.position.distanceTo(target) < 5) {
      // Small delay before moving to next waypoint
      setTimeout(() => this.nextWaypoint(), 500);
    }
  }
}

// ===============================================
// MOTION BEHAVIORS
// ===============================================

// Behavior for smooth entry animations
export class SmoothEntryBehavior {
  private duration: number = 2;
  private elapsed: number = 0;
  private startPosition: Vector2D;
  private targetPosition: Vector2D;
  
  constructor(startPosition: Vector2D, targetPosition: Vector2D, duration: number = 2) {
    this.startPosition = startPosition;
    this.targetPosition = targetPosition;
    this.duration = duration;
  }
  
  update(object: BasePhysicsObject, deltaTime: number): boolean {
    this.elapsed += deltaTime;
    const progress = Math.min(this.elapsed / this.duration, 1);
    
    // Ease-out function
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    const currentPosition = this.startPosition.copy().add(
      this.targetPosition.copy().subtract(this.startPosition).multiply(easeProgress)
    );
    
    // Apply force towards target
    const direction = currentPosition.subtract(object.position);
    const force = direction.multiply(0.1);
    object.applyForce(force);
    
    return progress >= 1;
  }
}

// Behavior for orbital motion (for decorative elements)
export class OrbitalBehavior {
  private center: Vector2D;
  private radius: number;
  private speed: number;
  private angle: number = 0;
  
  constructor(center: Vector2D, radius: number = 50, speed: number = 1) {
    this.center = center;
    this.radius = radius;
    this.speed = speed;
  }
  
  update(object: BasePhysicsObject, deltaTime: number): void {
    this.angle += deltaTime * this.speed;
    
    const targetX = this.center.x + Math.cos(this.angle) * this.radius;
    const targetY = this.center.y + Math.sin(this.angle) * this.radius;
    
    const targetPosition = new Vector2D(targetX, targetY);
    const direction = targetPosition.subtract(object.position);
    
    const force = direction.multiply(0.05);
    object.applyForce(force);
  }
}

// Behavior for attraction/repulsion forces
export class ForceFieldBehavior {
  private strength: number;
  private radius: number;
  private isAttraction: boolean = true;
  
  constructor(strength: number = 10, radius: number = 100, isAttraction: boolean = true) {
    this.strength = strength;
    this.radius = radius;
    this.isAttraction = isAttraction;
  }
  
  applyTo(object: BasePhysicsObject, centerPosition: Vector2D): void {
    const distance = object.position.distanceTo(centerPosition);
    
    if (distance < this.radius) {
      const direction = centerPosition.subtract(object.position).normalize();
      const forceMagnitude = this.strength * (1 - distance / this.radius);
      
      const force = direction.multiply(forceMagnitude * (this.isAttraction ? 1 : -1));
      object.applyForce(force);
    }
  }
}
