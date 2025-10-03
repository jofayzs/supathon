/**
 * RealtimeCursorFollower for Lens Studio
 *
 * This component receives real-time cursor positions from a PC client
 * and moves a 3D object in AR space to follow the cursor movements.
 *
 * Prerequisites:
 * 1. Add InternetModule to your project
 * 2. Configure Supabase credentials
 * 3. Assign a Scene Object to follow cursor movements
 */

@component
export class RealtimeCursorFollower extends BaseScriptComponent {

  // Supabase Configuration
  @input
  @hint("Your Supabase project URL (e.g., https://your-project.supabase.co)")
  public supabaseUrl: string = "";

  @input
  @hint("Your Supabase anon/public API key from the dashboard")
  public supabaseAnonKey: string = "";

  @input
  @hint("Room name for cursor synchronization")
  public roomName: string = "spectacles-demo-room";

  @input
  @hint("Internet Module for making HTTP requests")
  public internetModule: InternetModule;

  // Cursor Object Configuration
  @input
  @hint("Scene object that will follow the cursor position")
  public cursorObject: SceneObject;

  @input
  @hint("Movement speed/smoothing factor (0.1 = smooth, 1.0 = instant)")
  @widget(new SliderWidget(0.05, 1.0, 0.1))
  public movementSpeed: number = 0.15;

  @input
  @hint("Scale factor for cursor movements (1.0 = normal, 2.0 = double movement)")
  @widget(new SliderWidget(0.1, 50, 0.1))
  public movementScale: number = 1.5;

  @input
  @hint("Height offset for the cursor object (Y position)")
  @widget(new SliderWidget(-2.0, 2.0, 0.1))
  public heightOffset: number = 0.0;

  @input
  @hint("Distance from camera (Z position)")
  @widget(new SliderWidget(0.5, 10.0, 0.1))
  public distanceFromCamera: number = 2.0;

  // Visual Feedback
  @input
  @hint("Show debug information in console")
  public enableDebugLogs: boolean = true;

  @input
  @hint("Text object to display cursor status (optional)")
  @allowUndefined
  public statusText: Text;

  // Coordinate Mapping Parameters
  @input
  @hint("Lens Studio X coordinate range (from -lsXRange to +lsXRange)")
  @widget(new SliderWidget(10, 200, 1))
  public lsXRange: number = 50;

  @input
  @hint("Lens Studio Y coordinate range (from -lsYRange to +lsYRange)")
  @widget(new SliderWidget(10, 200, 1))
  public lsYRange: number = 30;

  @input
  @hint("Invert X axis mapping")
  public invertX: boolean = false;

  @input
  @hint("Invert Y axis mapping")
  public invertY: boolean = false;

  // Private variables
  private isConnected: boolean = false;
  private targetPosition: vec3 = vec3.zero();
  private currentPosition: vec3 = vec3.zero();
  private lastCursorUpdate: number = 0;
  private cameraTransform: Transform;
  private activeUsers: Map<string, any> = new Map();

  onAwake() {
    if (this.cursorObject) {
      this.currentPosition = this.cursorObject.getTransform().getLocalPosition();
      this.targetPosition = this.currentPosition;
    }

    // Get camera reference
    this.cameraTransform = this.getSceneObject().getParent()?.getTransform() ||
                          this.getSceneObject().getTransform();

    this.createEvent("OnStartEvent").bind(() => {
      this.initializeConnection();
    });

    this.createEvent("UpdateEvent").bind(() => {
      this.updateCursorPosition();
    });

    this.updateStatusText("🔄 Initializing...");
  }

  /**
   * Initialize connection to Supabase Realtime
   */
  private async initializeConnection() {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      this.log("❌ Missing Supabase credentials");
      this.updateStatusText("❌ Missing Supabase credentials");
      return;
    }

    if (!this.cursorObject) {
      this.log("❌ No cursor object assigned");
      this.updateStatusText("❌ No cursor object assigned");
      return;
    }

    this.log("🔄 Connecting to Supabase Realtime...");
    this.updateStatusText("🔄 Connecting to Supabase...");

    // Start polling for cursor updates
    // Note: This is a simplified approach for Lens Studio
    // In a production app, you might want to use WebSocket connections
    this.startCursorPolling();
  }

  /**
   * Start polling for cursor updates using HTTP requests
   * This simulates real-time updates for Lens Studio
   */
  private startCursorPolling() {
    const pollInterval = this.createEvent("DelayedCallbackEvent");

    const poll = () => {
      this.checkForCursorUpdates();
      pollInterval.reset(0.1); // Poll every 100ms
    };

    pollInterval.bind(poll);
    poll(); // Start immediately

    this.isConnected = true;
    this.log("✅ Connected! Listening for cursor movements...");
    this.updateStatusText("✅ Connected! Waiting for cursor...");
  }

  /**
   * Check for cursor updates from PC client
   * This would ideally use Supabase Realtime, but for simplicity
   * we'll simulate it with stored cursor data
   */
  private async checkForCursorUpdates() {
    // For this demo, we'll check a simple table for cursor positions
    // In reality, you'd use Supabase Realtime channels

    if (this.enableDebugLogs) {
      this.log(`🔍 Polling for cursor data in room: ${this.roomName}`);
    }

    try {
      // Filter for PC cursor data only (user_id starts with 'pc_')
      // This prevents the follower from following Spectacles cursor data
      const url = `${this.supabaseUrl.replace(/\/$/, '')}/rest/v1/cursor_positions?room_name=eq.${this.roomName}&user_id=like.pc_%25&order=timestamp.desc&limit=1`;

      const headers = {
        "Content-Type": "application/json",
        "apikey": this.supabaseAnonKey,
        "Authorization": `Bearer ${this.supabaseAnonKey}`
      };

      const request = new Request(url, {
        method: "GET",
        headers: headers
      });

      const response = await this.internetModule.fetch(request);

      if (response.ok) {
        const data = await response.json();

        if (this.enableDebugLogs) {
          this.log(`📊 Received ${data.length} cursor records`);
        }

        if (data.length > 0) {
          const cursorData = data[0];
          if (this.enableDebugLogs) {
            this.log(`📍 PC Cursor data: x=${cursorData.x}, y=${cursorData.y}, user=${cursorData.user_name}`);
          }
          this.handleCursorUpdate(cursorData);
        } else {
          if (this.enableDebugLogs) {
            this.log(`⚠️ No PC cursor data found for room: ${this.roomName}`);
          }
          this.updateStatusText("✅ Connected! Waiting for PC cursor...");
        }
      } else {
        if (this.enableDebugLogs) {
          this.log(`❌ HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      // Silently handle errors to avoid spam
      if (this.enableDebugLogs) {
        this.log(`Polling error: ${error}`);
      }
    }
  }

  /**
   * Handle incoming cursor position data
   */
  private handleCursorUpdate(cursorData: any) {
    const timestamp = cursorData.timestamp || Date.now();

    // Ignore old updates
    if (timestamp <= this.lastCursorUpdate) {
      return;
    }

    this.lastCursorUpdate = timestamp;

    // Convert web percentage (0-100) to Lens Studio coordinate system
    // Web: 0-100% (top-left to bottom-right)
    // LS:  X: -lsXRange to +lsXRange, Y: -lsYRange to +lsYRange
    let lsX = (cursorData.x / 100) * (this.lsXRange * 2) - this.lsXRange; // 0-100% -> -lsXRange to +lsXRange
    let lsY = this.lsYRange - (cursorData.y / 100) * (this.lsYRange * 2);  // 0-100% -> +lsYRange to -lsYRange (flip Y)
    
    // Apply axis inversion if enabled
    if (this.invertX) lsX = -lsX;
    if (this.invertY) lsY = -lsY;

    // Calculate new target position relative to camera
    this.targetPosition = new vec3(
      (lsX / this.lsXRange) * this.movementScale,  // Normalize to -1 to +1 range for movement
      (lsY / this.lsYRange) * this.movementScale + this.heightOffset,  // Normalize to -1 to +1 range for movement
      this.distanceFromCamera
    );

    this.log(`📍 Cursor: ${cursorData.user_name} -> Web(${cursorData.x.toFixed(1)}, ${cursorData.y.toFixed(1)}) -> LS(${lsX.toFixed(1)}, ${lsY.toFixed(1)})`);
    this.updateStatusText(`📍 Following: ${cursorData.user_name}`);

    // Store user info
    this.activeUsers.set(cursorData.user_id, {
      name: cursorData.user_name,
      color: cursorData.color,
      lastSeen: timestamp
    });
  }

  /**
   * Smoothly update cursor object position
   */
  private updateCursorPosition() {
    if (!this.cursorObject || !this.isConnected) {
      return;
    }

    // Smoothly interpolate to target position
    this.currentPosition = vec3.lerp(
      this.currentPosition,
      this.targetPosition,
      this.movementSpeed
    );

    // Apply position relative to camera
    const cameraPos = this.cameraTransform.getWorldPosition();
    const cameraRot = this.cameraTransform.getWorldRotation();

    // Transform relative position to world space
    const worldPosition = cameraPos.add(cameraRot.multiplyVec3(this.currentPosition));

    this.cursorObject.getTransform().setWorldPosition(worldPosition);
  }

  /**
   * Logging helper
   */
  private log(message: string) {
    if (this.enableDebugLogs) {
      print(`[RealtimeCursor] ${message}`);
    }
  }

  /**
   * Update status text if available
   */
  private updateStatusText(status: string) {
    if (this.statusText) {
      this.statusText.text = status;
    }
  }

  /**
   * Public methods for external control
   */
  public getActiveUsers(): string[] {
    return Array.from(this.activeUsers.keys());
  }

  public getUserInfo(userId: string): any {
    return this.activeUsers.get(userId);
  }

  public isCurrentlyConnected(): boolean {
    return this.isConnected;
  }

  public getCurrentCursorPosition(): vec3 {
    return this.currentPosition;
  }

  /**
   * Manual cursor position for testing
   */
  public setTestCursorPosition(x: number, y: number) {
    this.handleCursorUpdate({
      user_id: 'test-user',
      user_name: 'Test User',
      x: x,
      y: y,
      color: '#FF6B6B',
      timestamp: Date.now()
    });
  }
}

/**
 * Usage Instructions:
 *
 * 1. Create a Scene Object for the cursor (e.g., a sphere or 3D pointer)
 * 2. Attach this script to any Scene Object
 * 3. Configure Supabase credentials in the inspector
 * 4. Assign the cursor object to follow
 * 5. Create the cursor_positions table in Supabase (see documentation)
 * 6. Run the PC cursor controller to send cursor data
 *
 * Database Table Schema:
 * CREATE TABLE cursor_positions (
 *   id BIGSERIAL PRIMARY KEY,
 *   room_name TEXT NOT NULL,
 *   user_id TEXT NOT NULL,
 *   user_name TEXT NOT NULL,
 *   x FLOAT NOT NULL,
 *   y FLOAT NOT NULL,
 *   color TEXT,
 *   timestamp BIGINT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */