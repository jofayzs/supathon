/**
 * SimpleCursorBroadcaster for Lens Studio
 * 
 * A simplified version that just tracks a cursor object's world position,
 * converts it to 2D screen coordinates, and broadcasts to Supabase.
 * 
 * This version removes all the complex control modes and just focuses on
 * getting the cursor position and sending it to the web app.
 */

@component
export class SimpleCursorBroadcaster extends BaseScriptComponent {

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

  // Cursor Object to Track
  @input
  @hint("The cursor object to track and broadcast position")
  public cursorObject: SceneObject;

  // Broadcasting Configuration
  @input
  @hint("Broadcast interval in seconds")
  @widget(new SliderWidget(0.05, 1.0, 0.05))
  public broadcastInterval: number = 0.1; // 10 FPS

  @input
  @hint("Enable automatic broadcasting on start")
  public autoStart: boolean = true;

  @input
  @hint("Scale factor for position mapping (higher = more sensitive)")
  @widget(new SliderWidget(0.1, 10.0, 0.1))
  public positionScale: number = 20.0;

  // Status Display
  @input
  @allowUndefined
  @hint("Text component to display status and logs")
  public logText: Text;

  // Debug
  @input
  @hint("Show debug information in console")
  public enableDebugLogs: boolean = true;

  // Private variables
  private headers: { [key: string]: string };
  private apiUrl: string;
  private isInitialized: boolean = false;
  private isBroadcasting: boolean = false;
  private userId: string;
  private broadcastTimer: any;
  private logMessages: string[] = [];
  private maxLogMessages: number = 10;

  onAwake() {
    this.log("🔧 SimpleCursorBroadcaster starting...");
    this.initializeSupabase();

    this.createEvent("OnStartEvent").bind(() => {
      if (this.autoStart) {
        this.startBroadcasting();
      }
    });

    this.createEvent("OnDestroyEvent").bind(() => {
      this.stopBroadcasting();
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

    if (!this.cursorObject) {
      this.log("❌ No cursor object assigned to track!");
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

    this.isInitialized = true;
    this.log("✅ Supabase broadcaster initialized");
    this.log(`👤 User ID: ${this.userId}`);
    this.log(`📡 Room: ${this.roomName}`);
  }

  /**
   * Start broadcasting cursor positions
   */
  public startBroadcasting() {
    if (!this.isInitialized) {
      this.log("❌ Cannot start broadcasting - not initialized");
      return;
    }

    if (this.isBroadcasting) {
      this.log("⚠️ Already broadcasting");
      return;
    }

    this.log("🚀 Starting cursor broadcasting...");
    this.isBroadcasting = true;

    // Create broadcast timer
    this.broadcastTimer = this.createEvent("DelayedCallbackEvent");
    
    const broadcast = async () => {
      if (this.isBroadcasting && this.cursorObject) {
        await this.broadcastCurrentPosition();
        this.broadcastTimer.reset(this.broadcastInterval);
      }
    };

    this.broadcastTimer.bind(broadcast);
    broadcast(); // Start immediately

    this.log("✅ Broadcasting started!");
  }

  /**
   * Stop broadcasting cursor positions
   */
  public stopBroadcasting() {
    if (!this.isBroadcasting) {
      return;
    }

    this.isBroadcasting = false;
    
    if (this.broadcastTimer) {
      this.broadcastTimer.enabled = false;
    }

    this.log("🛑 Broadcasting stopped");
  }

  /**
   * Get current cursor position and broadcast it
   */
  private async broadcastCurrentPosition() {
    if (!this.cursorObject) {
      return;
    }

    // Get the cursor's world position
    const transform = this.cursorObject.getTransform();
    const worldPos = transform.getWorldPosition();

    // Convert world position to screen coordinates (0-100 range)
    const screenPos = this.worldToScreen(worldPos);

    // Broadcast the position
    await this.broadcastCursorPosition(
      this.userId,
      "Spectacles User",
      screenPos.x,
      screenPos.y,
      "#4ECDC4" // Spectacles color
    );
  }

  /**
   * Convert world position to screen coordinates (0-100 range)
   * This is a simplified conversion that you can adjust based on your scene setup
   */
  private worldToScreen(worldPos: vec3): {x: number, y: number} {
    // Get camera transform (use main camera or scene object's parent)
    const cameraTransform = this.getSceneObject().getParent()?.getTransform() || 
                           this.getSceneObject().getTransform();
    
    const cameraPos = cameraTransform.getWorldPosition();
    
    // Calculate relative position
    const relativePos = worldPos.sub(cameraPos);
    
    // Simple mapping: use X and Y components directly
    // Scale and offset to map to 0-100 range
    const x = 50 + (relativePos.x * this.positionScale);
    const y = 50 - (relativePos.y * this.positionScale); // Flip Y for screen coords
    
    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    // Log occasionally for debugging
    if (Math.random() < 0.1) { // 10% of the time
      this.log(`📍 World: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);
      this.log(`📱 Screen: (${clampedX.toFixed(1)}, ${clampedY.toFixed(1)})`);
    }
    
    return { x: clampedX, y: clampedY };
  }

  /**
   * Broadcast cursor position to Supabase
   */
  private async broadcastCursorPosition(
    userId: string,
    userName: string,
    x: number,
    y: number,
    color: string
  ): Promise<boolean> {
    if (!this.isInitialized) {
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
        timestamp: Date.now(),
        device_type: "spectacles"
      };

      const url = `${this.apiUrl}cursor_positions`;

      const request = new Request(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(cursorData)
      });

      const response = await this.internetModule.fetch(request);

      if (response.ok) {
        // Log success occasionally to avoid spam
        if (Math.random() < 0.05) { // 5% of the time
          this.log(`📡 Sent: (${x.toFixed(1)}, ${y.toFixed(1)})`);
        }
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
   * Test broadcast functionality
   */
  public async testBroadcast() {
    const testX = Math.random() * 100;
    const testY = Math.random() * 100;

    const success = await this.broadcastCursorPosition(
      "test-spectacles",
      "Test User",
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
   * Logging helper with UI text update
   */
  private log(message: string) {
    // Always log to console
    if (this.enableDebugLogs) {
      print(`[SimpleCursorBroadcaster] ${message}`);
    }
    
    // Also log to UI if text component is available
    if (this.logText) {
      this.logMessages.push(message);
      
      // Keep only the most recent messages
      if (this.logMessages.length > this.maxLogMessages) {
        this.logMessages = this.logMessages.slice(-this.maxLogMessages);
      }
      
      // Update the text component
      this.logText.text = this.logMessages.join('\n');
    }
  }

  /**
   * Public getters and controls
   */
  public isCurrentlyBroadcasting(): boolean {
    return this.isBroadcasting;
  }

  public getRoomName(): string {
    return this.roomName;
  }

  public getUserId(): string {
    return this.userId;
  }

  /**
   * Toggle broadcasting on/off
   */
  public toggleBroadcasting() {
    if (this.isBroadcasting) {
      this.stopBroadcasting();
    } else {
      this.startBroadcasting();
    }
  }
}

/**
 * Usage Instructions:
 * 
 * 1. Create a Scene Object to act as your cursor (sphere, cube, etc.)
 * 2. Attach this script to any Scene Object
 * 3. Configure in inspector:
 *    - Set Supabase URL and API key
 *    - Set room name (must match web app)
 *    - Assign cursor object to track
 *    - Adjust position scale if needed
 * 4. The script will automatically start broadcasting when the scene starts
 * 5. Move your cursor object around and watch it appear in the web app!
 * 
 * Tips:
 * - Start with positionScale = 20.0 and adjust based on your scene
 * - Lower broadcastInterval = more responsive but more network usage
 * - Check the logs to see if positions are being sent successfully
 */