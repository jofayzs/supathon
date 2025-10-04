/**
 * RealtimeCursorBroadcaster for Lens Studio
 *
 * This component works with the PC cursor controller to enable
 * real-time cursor synchronization by writing cursor positions
 * to a Supabase table that the RealtimeCursorFollower can read.
 *
 * This creates a bridge between Supabase Realtime channels
 * and Lens Studio's HTTP-based approach.
 */

@component
export class RealtimeCursorBroadcaster extends BaseScriptComponent {

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

  // Broadcasting Configuration
  @input
  @hint("Broadcast interval in seconds")
  @widget(new SliderWidget(0.1, 2.0, 0.1))
  public broadcastInterval: number = 0.2;

  @input
  @hint("Enable automatic cleanup of old cursor data")
  public enableCleanup: boolean = true;

  @input
  @hint("Maximum age of cursor data in seconds before cleanup")
  public maxDataAge: number = 30;

  // Control Mode
  @input
  @hint("Control button for Spectacles to take control")
  public takeControlButton: SceneObject;

  // Cursor Object to Track
  @input
  @hint("The cursor object to track and broadcast position")
  public cursorObject: SceneObject;

  // Status Display
  @input
  @hint("Text component to display status and logs")
  public statusText: SceneObject;

  // Debug
  @input
  @hint("Show debug information in console")
  public enableDebugLogs: boolean = true;

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
  @hint("Scale factor for coordinate conversion")
  @widget(new SliderWidget(0.1, 50.0, 0.1))
  public coordinateScale: number = 10.0;

  @input
  @hint("Perspective scaling factor")
  @widget(new SliderWidget(0.1, 20.0, 0.1))
  public perspectiveScale: number = 10.0;

  @input
  @hint("Invert X axis mapping")
  public invertX: boolean = false;

  @input
  @hint("Invert Y axis mapping")
  public invertY: boolean = false;

  // Debug Visualization
  @input
  @hint("Show coordinate values in every broadcast log")
  public verboseLogging: boolean = false;

  @input
  @hint("Log broadcast frequency (every N broadcasts)")
  @widget(new SliderWidget(1, 100, 1))
  public logFrequency: number = 10;

  // Private variables
  private headers: { [key: string]: string };
  private apiUrl: string;
  private cleanupTimer: any;
  private isInitialized: boolean = false;
  private userId: string;
  private userColor: string;
  private lastBroadcastTime: number = 0;
  private isSpectaclesLeader: boolean = false;
  private currentControlMode: string = "pc_leader";
  private statusMessages: string[] = [];
  private maxStatusLines: number = 8;

  onAwake() {
    this.log("🔧 RealtimeCursorBroadcaster awakening...");
    this.initializeSupabase();
    this.setupButtonInteraction();

    this.createEvent("OnStartEvent").bind(() => {
      this.startBroadcastService();
    });

    this.createEvent("OnDestroyEvent").bind(() => {
      this.stopBroadcastService();
    });
  }

  /**
   * Initialize Supabase connection parameters
   */
  private initializeSupabase() {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      this.log("❌ Missing Supabase credentials");
      return;
    }

    this.apiUrl = this.supabaseUrl.replace(/\/$/, '') + "/rest/v1/";

    this.headers = {
      "Content-Type": "application/json",
      "apikey": this.supabaseAnonKey,
      "Authorization": `Bearer ${this.supabaseAnonKey}`,
      "Prefer": "return=representation"
    };

    // Initialize user data
    this.userId = "spectacles_" + Math.random().toString(36).substr(2, 9);
    this.userColor = "#4ECDC4"; // Spectacles default color

    this.isInitialized = true;
    this.log("✅ Supabase broadcaster initialized");
    this.updateCurrentStatus("Initialized");
  }

  /**
   * Start the broadcast service
   */
  private startBroadcastService() {
    if (!this.isInitialized) {
      this.log("❌ Cannot start service - not initialized");
      return;
    }

    this.log("🚀 Starting cursor broadcast service...");
    
    // Auto-start as Spectacles leader if cursor object is assigned
    if (this.cursorObject) {
      this.log("🎯 Cursor object detected - auto-starting as Spectacles leader");
      this.becomeSpectaclesLeader();
    } else {
      this.updateCurrentStatus("Active - PC Leader Mode");
    }

    // Start cleanup timer if enabled
    if (this.enableCleanup) {
      this.startCleanupTimer();
    }

    // Start status update timer
    this.startStatusUpdateTimer();

    // Test table existence
    this.testTableAccess();
  }

  /**
   * Stop the broadcast service
   */
  private stopBroadcastService() {
    if (this.cleanupTimer) {
      this.cleanupTimer.enabled = false;
    }
    this.log("🛑 Cursor broadcast service stopped");
  }

  /**
   * Test if the cursor_positions table exists and is accessible
   */
  private async testTableAccess() {
    try {
      const url = `${this.apiUrl}cursor_positions?limit=1`;

      const request = new Request(url, {
        method: "GET",
        headers: this.headers
      });

      const response = await this.internetModule.fetch(request);

      if (response.ok) {
        this.log("✅ cursor_positions table is accessible");
      } else {
        const errorText = await response.text();
        this.log(`⚠️ Table access issue: ${response.status} - ${errorText}`);
        this.log("💡 Create the cursor_positions table using the provided SQL schema");
      }
    } catch (error) {
      this.log(`❌ Table access error: ${error}`);
    }
  }

  /**
   * Broadcast a cursor position update
   * This method can be called by other scripts to send cursor positions
   */
  public async broadcastCursorPosition(
    userId: string,
    userName: string,
    x: number,
    y: number,
    color: string = "#FF6B6B"
  ): Promise<boolean> {
    if (!this.isInitialized) {
      this.log("❌ Cannot broadcast - not initialized");
      return false;
    }

    try {
      const cursorData = {
        room_name: this.roomName,
        user_id: userId,
        user_name: userName,
        x: x,
        y: y,
        color: color,
        timestamp: Date.now()
      };

      const url = `${this.apiUrl}cursor_positions`;

      const request = new Request(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(cursorData)
      });

      const response = await this.internetModule.fetch(request);

      if (response.ok) {
        this.log(`📡 Broadcasted cursor: ${userName} (${x.toFixed(1)}, ${y.toFixed(1)})`);
        return true;
      } else {
        const errorText = await response.text();
        this.log(`❌ Broadcast failed: ${response.status} - ${errorText}`);
        return false;
      }
    } catch (error) {
      this.log(`❌ Broadcast error: ${error}`);
      return false;
    }
  }

  /**
   * Start automatic cleanup of old cursor data
   */
  private startCleanupTimer() {
    this.cleanupTimer = this.createEvent("DelayedCallbackEvent");

    const cleanup = () => {
      this.cleanupOldCursorData();
      this.cleanupTimer.reset(10); // Cleanup every 10 seconds
    };

    this.cleanupTimer.bind(cleanup);
    cleanup(); // Start immediately
  }

  /**
   * Clean up old cursor data from the database
   */
  private async cleanupOldCursorData() {
    try {
      const cutoffTime = Date.now() - (this.maxDataAge * 1000);
      const url = `${this.apiUrl}cursor_positions?timestamp=lt.${cutoffTime}`;

      const request = new Request(url, {
        method: "DELETE",
        headers: this.headers
      });

      const response = await this.internetModule.fetch(request);

      if (response.ok) {
        this.log(`🧹 Cleaned up old cursor data (older than ${this.maxDataAge}s)`);
      }
    } catch (error) {
      this.log(`⚠️ Cleanup error: ${error}`);
    }
  }

  /**
   * Get recent cursor positions for debugging
   */
  public async getRecentCursorPositions(limit: number = 5): Promise<any[]> {
    try {
      const url = `${this.apiUrl}cursor_positions?room_name=eq.${this.roomName}&order=timestamp.desc&limit=${limit}`;

      const request = new Request(url, {
        method: "GET",
        headers: this.headers
      });

      const response = await this.internetModule.fetch(request);

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      this.log(`❌ Error fetching cursor positions: ${error}`);
    }

    return [];
  }

  /**
   * Test broadcast functionality
   */
  public async testBroadcast() {
    const testX = Math.random() * 100;
    const testY = Math.random() * 100;

    const success = await this.broadcastCursorPosition(
      "test-user-lens",
      "Lens Test User",
      testX,
      testY,
      "#00FF00"
    );

    if (success) {
      this.log(`✅ Test broadcast successful: (${testX.toFixed(1)}, ${testY.toFixed(1)})`);
    } else {
      this.log("❌ Test broadcast failed");
    }

    return success;
  }

  /**
   * Setup button interaction for control mode switching
   */
  private setupButtonInteraction() {
    this.log("🔘 Setting up button interaction...");

    if (!this.takeControlButton) {
      this.log("⚠️ No take control button assigned");
      this.log("💡 You can also call becomeSpectaclesLeader() manually");
      return;
    }

    this.log(`🔘 Button assigned: ${this.takeControlButton.name}`);

    // Get the TouchComponent from the button
    const touchComponent = this.takeControlButton.getComponent("TouchComponent");
    if (!touchComponent) {
      this.log("❌ Take control button needs a TouchComponent");
      return;
    }

    this.log("🔘 TouchComponent found, setting up tap handler...");

    // Listen for tap events
    touchComponent.onTouchStart.add(() => {
      this.log("🔥 TAKE CONTROL BUTTON PRESSED!");
      this.toggleSpectaclesControl();
    });

    this.log("✅ Button interaction setup complete");
  }

  /**
   * Toggle between Spectacles leader and PC follower modes
   */
  private toggleSpectaclesControl() {
    if (this.isSpectaclesLeader) {
      this.resignSpectaclesLeader();
    } else {
      this.becomeSpectaclesLeader();
    }
  }

  /**
   * Stop being the leader and let PC take control
   */
  private resignSpectaclesLeader() {
    this.isSpectaclesLeader = false;
    this.currentControlMode = "pc_leader";

    this.log("🤝 Spectacles releasing control back to PC");
    this.updateCurrentStatus("Active - PC Leader Mode");

    // Notify PC that it should lead again
    this.broadcastControlSignal("pc_leader");
  }

  /**
   * Make Spectacles the leader (broadcasts cursor positions)
   */
  private async becomeSpectaclesLeader() {
    this.log("🚀 becomeSpectaclesLeader() called!");

    this.isSpectaclesLeader = true;
    this.currentControlMode = "spectacles_leader";

    this.log("👑 Spectacles taking control!");
    this.updateCurrentStatus("Active - Spectacles Leader Mode");

    // Notify PC that Spectacles is now leader
    this.log("📡 Broadcasting control signal...");
    await this.broadcastControlSignal("spectacles_leader");

    // Start broadcasting Spectacles cursor position
    this.log("🎯 Starting Spectacles cursor broadcast...");
    this.startSpectaclesCursorBroadcast();
  }

  /**
   * Broadcast control mode change
   */
  private async broadcastControlSignal(mode: string) {
    if (!this.isInitialized) return;

    const controlData = {
      room_name: this.roomName,
      user_id: this.userId + "_control",
      user_name: "Spectacles Controller",
      x: 0,
      y: 0,
      color: this.userColor,
      timestamp: Date.now()
    };

    try {
      const url = `${this.apiUrl}cursor_positions`;
      const request = new Request(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(controlData)
      });

      const response = await this.internetModule.fetch(request);

      if (response.ok) {
        this.log(`🎮 Control signal sent: ${mode}`);
      }
    } catch (error) {
      this.log(`❌ Control signal failed: ${error}`);
    }
  }

  /**
   * Start broadcasting Spectacles cursor position
   * This reads the actual position of the cursor object
   */
  private startSpectaclesCursorBroadcast() {
    this.log("🎯 Setting up Spectacles cursor broadcast from actual object...");

    if (!this.cursorObject) {
      this.log("❌ No cursor object assigned to track!");
      this.log("⚠️ Please assign a cursor object in the inspector");
      return;
    }

    const broadcastPattern = this.createEvent("DelayedCallbackEvent");
    let broadcastCount = 0;

    const broadcast = async () => {
      if (this.isSpectaclesLeader && this.cursorObject) {
        // Get the actual world position of the cursor object
        const transform = this.cursorObject.getTransform();
        const worldPos = transform.getWorldPosition();

        // Get camera transform for relative positioning
        // Use the scene object's parent as camera reference, or fallback to scene object itself
        const cameraTransform = this.getSceneObject().getParent()?.getTransform() ||
                               this.getSceneObject().getTransform();
        const cameraPos = cameraTransform.getWorldPosition();
        const cameraForward = cameraTransform.forward;
        const cameraRight = cameraTransform.right;
        const cameraUp = cameraTransform.up;

        // Calculate position relative to camera
        const toObject = worldPos.sub(cameraPos);

        // Project onto camera's right and up vectors to get 2D position
        const rightComponent = toObject.dot(cameraRight);
        const upComponent = toObject.dot(cameraUp);
        const forwardComponent = toObject.dot(cameraForward);

        // Convert from Lens Studio coordinate system to web percentage
        // Using configurable parameters for coordinate mapping
        // LS: X: -lsXRange to +lsXRange, Y: -lsYRange to +lsYRange
        // Web: 0-100% (top-left to bottom-right)
        
        // Use configurable mapping based on the relative position
        const screenScale = this.perspectiveScale / Math.max(Math.abs(forwardComponent), 1.0); // Perspective scaling
        let lsX = rightComponent * screenScale * this.coordinateScale; // LS X coordinate
        let lsY = upComponent * screenScale * this.coordinateScale;    // LS Y coordinate
        
        // Apply axis inversion if enabled
        if (this.invertX) lsX = -lsX;
        if (this.invertY) lsY = -lsY;
        
        // Convert LS coordinates to web percentage using configurable ranges
        const webX = ((lsX + this.lsXRange) / (this.lsXRange * 2)) * 100;  // -lsXRange to +lsXRange -> 0 to 100%
        const webY = ((this.lsYRange - lsY) / (this.lsYRange * 2)) * 100;   // +lsYRange to -lsYRange -> 0 to 100% (flip Y)

        // Clamp to valid range
        const clampedX = Math.max(0, Math.min(100, webX));
        const clampedY = Math.max(0, Math.min(100, webY));

        broadcastCount++;

        // Log based on frequency setting or verbose mode
        if (this.verboseLogging || (broadcastCount % this.logFrequency === 0)) {
          this.log(`🔄 Broadcasting #${broadcastCount}: LS(${lsX.toFixed(1)}, ${lsY.toFixed(1)}) -> Web(${clampedX.toFixed(1)}, ${clampedY.toFixed(1)})`);
          if (this.verboseLogging) {
            this.log(`📍 World: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);
            this.log(`🎯 Components: right=${rightComponent.toFixed(2)}, up=${upComponent.toFixed(2)}, forward=${forwardComponent.toFixed(2)}`);
            this.log(`⚙️ Scales: screen=${screenScale.toFixed(2)}, coord=${this.coordinateScale}, perspective=${this.perspectiveScale}`);
          }
        }

        await this.broadcastSpectaclesCursor(this.userId, "Spectacles", clampedX, clampedY, this.userColor);

        broadcastPattern.reset(this.broadcastInterval);
      } else {
        this.log("⏹️ Stopping broadcast - no longer leader or no cursor object");
      }
    };

    broadcastPattern.bind(broadcast);

    this.log("▶️ Starting first broadcast...");
    broadcast();

    this.log("🚀 Started Spectacles cursor broadcast from actual object");
  }

  /**
   * Enhanced broadcast method with device type for Spectacles
   */
  private async broadcastSpectaclesCursor(userId: string, userName: string, x: number, y: number, color: string) {
    if (!this.isInitialized) return false;

    const now = Date.now();

    // Throttle broadcasts
    if (now - this.lastBroadcastTime < (this.broadcastInterval * 1000)) {
      return false;
    }

    this.lastBroadcastTime = now;

    const cursorData = {
      room_name: this.roomName,
      user_id: userId,
      user_name: userName,
      x: x,
      y: y,
      color: color,
      timestamp: now
    };

    // Debug log the data being sent
    this.log(`📤 Sending cursor data: room="${cursorData.room_name}", user_id="${cursorData.user_id}", pos=(${x.toFixed(1)}, ${y.toFixed(1)})`);

    try {
      const url = `${this.apiUrl}cursor_positions`;
      const request = new Request(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(cursorData)
      });

      const response = await this.internetModule.fetch(request);

      if (response.ok) {
        // Only log every 20th successful broadcast to avoid spam
        if (Math.random() < 0.05) { // 5% chance = roughly every 20 broadcasts
          this.log(`📡 Broadcasting at (${x.toFixed(1)}, ${y.toFixed(1)})`);
        }
        return true;
      } else {
        const errorText = await response.text();
        this.log(`❌ Broadcast failed: ${response.status} - ${errorText}`);
        this.log(`📋 Data sent: ${JSON.stringify(cursorData)}`);
        return false;
      }
    } catch (error) {
      this.log(`❌ Broadcast error: ${error}`);
      return false;
    }
  }

  /**
   * Logging helper with status text update
   */
  private log(message: string) {
    if (this.enableDebugLogs) {
      print(`[CursorBroadcaster] ${message}`);
    }

    this.updateStatusText(message);
  }

  /**
   * Update status text display
   */
  private updateStatusText(message: string) {
    if (!this.statusText) return;

    // Add timestamp to message
    const timestamp = new Date().toLocaleTimeString();
    const fullMessage = `[${timestamp}] ${message}`;

    // Add to messages array
    this.statusMessages.push(fullMessage);

    // Keep only recent messages
    if (this.statusMessages.length > this.maxStatusLines) {
      this.statusMessages = this.statusMessages.slice(-this.maxStatusLines);
    }

    // Update the text component
    const textComponent = this.statusText.getComponent("Component.Text");
    if (textComponent) {
      textComponent.text = this.statusMessages.join('\n');
    } else {
      this.statusMessages.push("❌ Status object needs Text component");
    }
  }

  /**
   * Update current status display
   */
  private updateCurrentStatus(status: string) {
    if (!this.statusText) return;

    const textComponent = this.statusText.getComponent("Component.Text");
    if (textComponent) {
      const statusHeader = `🎮 Broadcaster Status: ${status}\n` +
                          `👤 User: ${this.userId}\n` +
                          `📡 Room: ${this.roomName}\n` +
                          `🔄 Mode: ${this.currentControlMode}\n` +
                          `---Recent Logs---\n`;

      textComponent.text = statusHeader + this.statusMessages.slice(-5).join('\n');
    }
  }

  /**
   * Start periodic status updates
   */
  private startStatusUpdateTimer() {
    const statusTimer = this.createEvent("DelayedCallbackEvent");

    const updateStatus = () => {
      if (this.isSpectaclesLeader) {
        this.updateCurrentStatus("🎯 Broadcasting Spectacles Cursor");
      } else {
        this.updateCurrentStatus("⏳ Waiting for PC Control");
      }

      statusTimer.reset(5.0); // Update every 5 seconds
    };

    statusTimer.bind(updateStatus);
    updateStatus(); // Start immediately
  }

  /**
   * Public getters
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  public getRoomName(): string {
    return this.roomName;
  }
}

/**
 * Database Table Schema (run this in your Supabase SQL editor):
 *
 * CREATE TABLE cursor_positions (
 *   id BIGSERIAL PRIMARY KEY,
 *   room_name TEXT NOT NULL,
 *   user_id TEXT NOT NULL,
 *   user_name TEXT NOT NULL,
 *   x FLOAT NOT NULL,
 *   y FLOAT NOT NULL,
 *   color TEXT DEFAULT '#FF6B6B',
 *   timestamp BIGINT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Create index for performance
 * CREATE INDEX idx_cursor_positions_room_timestamp
 * ON cursor_positions(room_name, timestamp DESC);
 *
 * -- Enable Row Level Security (optional)
 * ALTER TABLE cursor_positions ENABLE ROW LEVEL SECURITY;
 *
 * -- Allow anonymous access (for development)
 * CREATE POLICY "Allow anonymous access" ON cursor_positions
 * FOR ALL USING (true);
 */