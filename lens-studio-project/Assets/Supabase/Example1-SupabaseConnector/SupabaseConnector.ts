/**
 * SupabaseConnector for Lens Studio
 *
 * This script provides a simple interface to connect Lens Studio with Supabase
 * for basic database operations and realtime features.
 *
 * Prerequisites:
 * 1. Add InternetModule to your project
 * 2. Get your Supabase project URL and API key from the dashboard
 * 3. Create a simple table in your Supabase database for testing
 */

import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";

@component
export class SupabaseConnector extends BaseScriptComponent {
  // Supabase Configuration - Get these from your Supabase Dashboard
  @input
  @hint("Your Supabase project URL (e.g., https://your-project.supabase.co)")
  public supabaseUrl: string = "";

  @input
  @hint("Your Supabase anon/public API key from the dashboard")
  public supabaseAnonKey: string = "";

  @input
  @hint("Table name to test database operations")
  public tableName: string = "test_messages";

  @input
  @hint("Internet Module for making HTTP requests")
  public internetModule: InternetModule;

  // Realtime configuration
  @input
  @hint("Channel name for realtime messaging")
  public channelName: string = "test_channel";

  // Interactive Elements
  @input
  @allowUndefined
  @hint("Optional: Button or interactable to trigger data retrieval")
  public dataRetrievalButton: Interactable;

  @input
  @allowUndefined
  @hint("Optional: Text component to display logs on device")
  public logText: Text;

  

  private apiUrl: string;
  private headers: { [key: string]: string };
  private isConnected: boolean = false;
  private logMessages: string[] = [];
  private maxLogMessages: number = 20;

  onAwake() {
    this.initializeSupabase();
    this.setupInteractions();
    this.createEvent("OnStartEvent").bind(() => {
      this.testConnection();
    });
  }

  /**
   * Custom logging method that outputs to both console and UI text
   */
  private log(message: string) {
    // Always log to console
    print(message);
    
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
   * Clear the log display
   */
  public clearLogs() {
    this.logMessages = [];
    if (this.logText) {
      this.logText.text = "";
    }
  }

  /**
   * Initialize Supabase connection parameters
   */
  private initializeSupabase() {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      this.log("ERROR: Please set your Supabase URL and API key in the inspector");
      return;
    }

    // Ensure URL has no trailing slash
    this.apiUrl = this.supabaseUrl.replace(/\/$/, '') + "/rest/v1/";

    // Set up common headers for Supabase requests
    this.headers = {
      "Content-Type": "application/json",
      "apikey": this.supabaseAnonKey,
      "Authorization": `Bearer ${this.supabaseAnonKey}`,
      "Prefer": "return=representation"
    };

    this.log("✅ Supabase connector initialized");
    this.log(`📡 API URL: ${this.apiUrl}`);
  }

  /**
   * Setup interactive elements (button only)
   */
  private setupInteractions() {
    // Setup button interaction if provided
    if (this.dataRetrievalButton) {
      const onButtonTrigger = (event: InteractorEvent) => {
        this.log("🔘 Data retrieval button pressed!");
        this.retrieveLatestData();
      };
      this.dataRetrievalButton.onInteractorTriggerStart(onButtonTrigger);
      this.log("✅ Button interaction configured");
    } else {
      this.log("ℹ️ No data retrieval button assigned. You can manually call retrieveLatestData()");
    }
  }

  /**
   * Test the connection to Supabase
   */
  public async testConnection() {
    this.log("🔍 Testing Supabase connection...");

    try {
      // Try to fetch from the main table (this will work even if table is empty)
      const response = await this.selectFromTable(this.tableName, "*", "limit=1");

      if (response.ok) {
        this.isConnected = true;
        this.log("✅ Successfully connected to Supabase!");
        this.log(`📊 Table '${this.tableName}' is accessible`);

        // Test inserting a sample record
        await this.insertTestRecord();

        // Test selecting records
        await this.getAllRecords();

        // Test all other tables
        await this.testAllTables();

      } else {
        this.log(`❌ Connection failed: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        this.log(`Error details: ${errorText}`);
      }
    } catch (error) {
      this.log(`❌ Connection error: ${error}`);
    }
  }

  /**
   * Test all tables to verify they exist and are accessible
   */
  public async testAllTables() {
    this.log("🔍 Testing all database tables...");

    const tables = ["realtime_messages", "user_interactions", "user_preferences"];

    for (const table of tables) {
      try {
        const response = await this.selectFromTable(table, "*", "limit=3");

        if (response.ok) {
          const records = await response.json();
          this.log(`✅ Table '${table}': ${records.length} records found`);

          // Show sample data if available
          if (records.length > 0) {
            const sample = records[0];
            const keys = Object.keys(sample).slice(0, 3); // Show first 3 columns
            this.log(`   Sample: ${keys.map(key => `${key}=${JSON.stringify(sample[key]).substring(0, 30)}`).join(', ')}`);
          }
        } else {
          this.log(`⚠️  Table '${table}': ${response.status} - May not exist or need RLS policies`);
        }
      } catch (error) {
        this.log(`❌ Table '${table}': Error - ${error}`);
      }
    }

    // Test inserting into other tables
    await this.testOtherTableInserts();
  }

  /**
   * Test inserting data into other tables
   */
  public async testOtherTableInserts() {
    this.log("📝 Testing inserts into other tables...");

    // Test realtime_messages
    try {
      await this.sendRealtimeMessage("test_channel", "lens_test", {
        message: "Test from Lens Studio",
        timestamp: Date.now()
      });
    } catch (error) {
      this.log(`❌ Realtime message test failed: ${error}`);
    }

    // Test user_interactions
    try {
      await this.logUserInteraction("test_connection", {
        source: "supabase_connector",
        test: true
      });
    } catch (error) {
      this.log(`❌ User interaction test failed: ${error}`);
    }

    // Test user_preferences (if not exists, create sample)
    try {
      const testUserId = `test_user_${Date.now()}`;
      const preferences = {
        audio: { volume: 0.7, sound_effects: true },
        display: { brightness: 0.8, color_mode: "vivid" },
        test_mode: true
      };

      const response = await this.insertIntoTable("user_preferences", {
        user_id: testUserId,
        preferences: JSON.stringify(preferences),
        updated_at: new Date().toISOString()
      });

      if (response.ok) {
        this.log(`✅ User preferences test: Sample user created`);
      } else {
        this.log(`⚠️  User preferences test: ${response.status}`);
      }
    } catch (error) {
      this.log(`❌ User preferences test failed: ${error}`);
    }
  }

  /**
   * Insert a test record to verify database write access
   */
  public async insertTestRecord() {
    this.log("📝 Inserting test record...");

    const testData = {
      message: "Hello from Lens Studio!",
      sender: "Spectacles User",
      timestamp: new Date().toISOString(),
      lens_session_id: `session_${Date.now()}`
    };

    try {
      const response = await this.insertIntoTable(this.tableName, testData);

      if (response.ok) {
        const result = await response.json();
        this.log("✅ Test record inserted successfully!");
        this.log(`📄 Inserted data: ${JSON.stringify(result)}`);
      } else {
        this.log(`❌ Insert failed: ${response.status}`);
        const errorText = await response.text();
        this.log(`Error: ${errorText}`);
      }
    } catch (error) {
      this.log(`❌ Insert error: ${error}`);
    }
  }

  /**
   * Retrieve all records from the test table
   */
  public async getAllRecords() {
    this.log("📚 Fetching all records...");

    try {
      const response = await this.selectFromTable(this.tableName, "*", "order=timestamp.desc&limit=5");

      if (response.ok) {
        const records = await response.json();
        this.log(`✅ Retrieved ${records.length} records:`);

        records.forEach((record: any, index: number) => {
          this.log(`  ${index + 1}. ${record.message} (${record.sender})`);
        });
      } else {
        this.log(`❌ Select failed: ${response.status}`);
        const errorText = await response.text();
        this.log(`   Error details: ${errorText}`);
      }
    } catch (error) {
      this.log(`❌ Select error: ${error}`);
    }
  }

  /**
   * Generic method to insert data into any table
   */
  public async insertIntoTable(table: string, data: any): Promise<Response> {
    const url = `${this.apiUrl}${table}`;

    const request = new Request(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(data)
    });

    return await this.internetModule.fetch(request);
  }

  /**
   * Generic method to select data from any table
   */
  public async selectFromTable(table: string, columns: string = "*", query: string = ""): Promise<Response> {
    let url = `${this.apiUrl}${table}?select=${columns}`;

    if (query) {
      url += `&${query}`;
    }

    const request = new Request(url, {
      method: "GET",
      headers: this.headers
    });

    return await this.internetModule.fetch(request);
  }

  /**
   * Generic method to update data in any table
   */
  public async updateTable(table: string, data: any, condition: string): Promise<Response> {
    const url = `${this.apiUrl}${table}?${condition}`;

    const request = new Request(url, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(data)
    });

    return await this.internetModule.fetch(request);
  }

  /**
   * Generic method to delete data from any table
   */
  public async deleteFromTable(table: string, condition: string): Promise<Response> {
    const url = `${this.apiUrl}${table}?${condition}`;

    const request = new Request(url, {
      method: "DELETE",
      headers: this.headers
    });

    return await this.internetModule.fetch(request);
  }

  /**
   * Send a realtime message using Supabase Realtime
   * Note: This is a basic implementation for sending messages to a broadcast channel
   */
  public async sendRealtimeMessage(channel: string, event: string, payload: any) {
    this.log(`📡 Sending realtime message to channel: ${channel}`);

    // For basic realtime messaging, we can use the REST API to insert into a messages table
    // and use Supabase's realtime subscriptions on the frontend
    const messageData = {
      channel: channel,
      event: event,
      payload: JSON.stringify(payload),
      sent_at: new Date().toISOString()
    };

    try {
      const response = await this.insertIntoTable("realtime_messages", messageData);

      if (response.ok) {
        this.log("✅ Realtime message sent successfully!");
      } else {
        this.log(`❌ Failed to send realtime message: ${response.status}`);
      }
    } catch (error) {
      this.log(`❌ Realtime message error: ${error}`);
    }
  }

  /**
   * Example: Log user interaction for analytics
   */
  public async logUserInteraction(action: string, data: any = {}) {
    const interactionData = {
      action: action,
      data: JSON.stringify(data),
      timestamp: new Date().toISOString(),
      session_id: `lens_${Date.now()}`
    };

    try {
      await this.insertIntoTable("user_interactions", interactionData);
      this.log(`📊 Logged interaction: ${action}`);
    } catch (error) {
      this.log(`❌ Failed to log interaction: ${error}`);
    }
  }

  /**
   * Example: Get user preferences
   */
  public async getUserPreferences(userId: string): Promise<any> {
    try {
      const response = await this.selectFromTable("user_preferences", "*", `user_id=eq.${userId}`);

      if (response.ok) {
        const preferences = await response.json();
        return preferences.length > 0 ? preferences[0] : null;
      }
    } catch (error) {
      this.log(`❌ Failed to get user preferences: ${error}`);
    }

    return null;
  }

  /**
   * Retrieve and display latest data from all tables (triggered by button/pinch)
   */
  public async retrieveLatestData() {
    if (!this.isConnected) {
      this.log("❌ Not connected to Supabase. Cannot retrieve data.");
      return;
    }

    this.log("🔍 Retrieving latest data from all tables...");

    // Get latest messages
    await this.getLatestMessages();

    // Get recent user interactions
    await this.getRecentInteractions();

    // Get latest realtime messages
    await this.getLatestRealtimeMessages();

    // Get user preferences
    await this.getRandomUserPreferences();

    this.log("✅ Data retrieval completed!");
  }

  /**
   * Get latest messages from test_messages table
   */
  private async getLatestMessages() {
    try {
      const response = await this.selectFromTable("test_messages", "*", "order=timestamp.desc&limit=3");

      if (response.ok) {
        const messages = await response.json();
        this.log(`📝 Latest Messages (${messages.length}):`);

        messages.forEach((msg: any, index: number) => {
          this.log(`  ${index + 1}. "${msg.message}" by ${msg.sender || 'Unknown'}`);
        });
      } else {
        this.log(`⚠️ Could not retrieve messages: ${response.status}`);
        const errorText = await response.text();
        this.log(`   Error details: ${errorText}`);
      }
    } catch (error) {
      this.log(`❌ Error retrieving messages: ${error}`);
    }
  }

  /**
   * Get recent user interactions
   */
  private async getRecentInteractions() {
    try {
      const response = await this.selectFromTable("user_interactions", "*", "order=timestamp.desc&limit=3");

      if (response.ok) {
        const interactions = await response.json();
        this.log(`📊 Recent Interactions (${interactions.length}):`);

        interactions.forEach((interaction: any, index: number) => {
          this.log(`  ${index + 1}. ${interaction.action} at ${interaction.timestamp}`);
        });
      } else {
        this.log(`⚠️ Could not retrieve interactions: ${response.status}`);
        if (response.status === 404) {
          this.log(`   💡 Create the 'user_interactions' table using the provided CSV data`);
        }
      }
    } catch (error) {
      this.log(`❌ Error retrieving interactions: ${error}`);
    }
  }

  /**
   * Get latest realtime messages
   */
  private async getLatestRealtimeMessages() {
    try {
      const response = await this.selectFromTable("realtime_messages", "*", "order=sent_at.desc&limit=3");

      if (response.ok) {
        const messages = await response.json();
        this.log(`📡 Latest Realtime Events (${messages.length}):`);

        messages.forEach((msg: any, index: number) => {
          this.log(`  ${index + 1}. [${msg.channel}] ${msg.event}`);
        });
      } else {
        this.log(`⚠️ Could not retrieve realtime messages: ${response.status}`);
        const errorText = await response.text();
        this.log(`   Error details: ${errorText}`);
      }
    } catch (error) {
      this.log(`❌ Error retrieving realtime messages: ${error}`);
    }
  }

  /**
   * Get a random user's preferences
   */
  private async getRandomUserPreferences() {
    try {
      const response = await this.selectFromTable("user_preferences", "*", "limit=1");

      if (response.ok) {
        const users = await response.json();
        if (users.length > 0) {
          const user = users[0];
          this.log(`⚙️ Sample User Preferences:`);
          this.log(`  User: ${user.user_id}`);

          try {
            const prefs = JSON.parse(user.preferences);
            if (prefs.audio) {
              this.log(`  Audio: Volume ${prefs.audio.volume}, SFX ${prefs.audio.sound_effects}`);
            }
            if (prefs.display) {
              this.log(`  Display: Brightness ${prefs.display.brightness}, Mode ${prefs.display.color_mode}`);
            }
          } catch (parseError) {
            this.log(`  Preferences: ${user.preferences.substring(0, 100)}...`);
          }
        } else {
          this.log(`⚠️ No user preferences found`);
        }
      } else {
        this.log(`⚠️ Could not retrieve user preferences: ${response.status}`);
      }
    } catch (error) {
      this.log(`❌ Error retrieving user preferences: ${error}`);
    }
  }

  /**
   * Public methods for external scripts to use
   */
  public isSupabaseConnected(): boolean {
    return this.isConnected;
  }

  public getApiUrl(): string {
    return this.apiUrl;
  }

  public getHeaders(): { [key: string]: string } {
    return { ...this.headers }; // Return a copy
  }

  /**
   * Public method to manually trigger data retrieval
   */
  public async manualDataRetrieval() {
    await this.retrieveLatestData();
  }

  /**
   * Get current log messages as a string
   */
  public getLogMessages(): string {
    return this.logMessages.join('\n');
  }
}

/**
 * Usage Example:
 *
 * 1. Attach this script to a Scene Object
 * 2. Assign the InternetModule in the inspector
 * 3. Set your Supabase URL and API key
 * 4. Set the table name you want to test with
 * 5. Optional: Assign an Interactable button for data retrieval
 * 6. Optional: Assign a Text component to display logs on device
 * 7. The script will automatically test the connection on start
 *
 * Interactive Features:
 * - Button press: Retrieves latest data from all tables
 * - Manual call: supabaseConnector.manualDataRetrieval()
 *
 * To use from other scripts:
 *
 * @input supabaseConnector: SupabaseConnector;
 *
 * // In your script:
 * if (this.supabaseConnector.isSupabaseConnected()) {
 *   // Log interactions
 *   await this.supabaseConnector.logUserInteraction("button_pressed", {button: "start"});
 *
 *   // Manually retrieve data
 *   await this.supabaseConnector.manualDataRetrieval();
 *
 *   // Insert custom data
 *   await this.supabaseConnector.insertIntoTable("test_messages", {
 *     message: "Custom message",
 *     sender: "My Script"
 *   });
 * }
 */