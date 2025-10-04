/**
 * Supabase Asset Loader for Lens Studio
 *
 * This component loads 3D models, images, and audio files from Supabase Storage
 * on button interaction. It demonstrates how to:
 * - Connect to Supabase Storage API
 * - Download and load 3D models (GLTF/GLB)
 * - Download and load images as textures
 * - Download and load audio files
 * - Handle loading states and errors
 * - Apply loaded assets to scene objects
 *
 * Prerequisites:
 * 1. Add InternetModule to your project
 * 2. Add Spectacles Interaction Kit (SIK) to your project
 * 3. Configure Supabase credentials
 * 4. Upload assets to Supabase Storage
 * 5. Assign scene objects for displaying loaded assets
 * 
 * 
 * 
 * Sketchfab credits 
 * https://sketchfab.com/3d-models/fox-f25a052be431440fad238bcf736122e5
 */

import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";

@component
export class SupabaseAssetLoader extends BaseScriptComponent {

  // Supabase Configuration
  @input
  @hint("Your Supabase project URL (e.g., https://your-project.supabase.co)")
  public supabaseUrl: string = "";

  @input
  @hint("Your Supabase anon/public API key from the dashboard")
  public supabaseAnonKey: string = "";

  @input
  @hint("Use service role key to bypass RLS policies (TESTING ONLY - NOT for production)")
  public useServiceKey: boolean = false;

  @input
  @hint("Your Supabase service role key (ONLY if useServiceKey is enabled)")
  public supabaseServiceKey: string = "";

  @input
  @hint("Supabase Storage bucket name where assets are stored")
  public storageBucket: string = "specs-bucket";

  @input
  @hint("Internet Module for making HTTP requests")
  public internetModule: InternetModule;

  // Asset Configuration
  @input
  @hint("3D model filename in storage (e.g., 'fox/scene.gltf')")
  public modelFileName: string = "fox/scene.gltf";

  @input
  @hint("Image filename in storage (e.g., 'images/spectacles.jpg')")
  public imageFileName: string = "images/spectacles.jpg";

  @input
  @hint("Audio filename in storage (e.g., 'audio/chill.mp3')")
  public audioFileName: string = "audio/chill.mp3";

  // Scene Objects for Asset Display
  @input
  @hint("Scene object where the 3D model will be instantiated")
  public modelContainer: SceneObject;

  @input
  @hint("Image component to display the loaded texture")
  public imageDisplay: Image;

  @input
  @hint("Scene object with AudioComponent to play the loaded audio")
  public audioPlayer: SceneObject;

  @input
  @hint("Material to use for instantiated 3D models")
  public defaultMaterial: Material;

  // Button Configuration
  @input
  @hint("Interactable button to trigger asset loading (using Spectacles Interaction Kit)")
  public loadButton: Interactable;

  // Loading Configuration
  @input
  @hint("Show loading progress in console")
  public enableProgressLogs: boolean = true;

  @input
  @hint("Enable detailed debug logging")
  public enableDebugLogs: boolean = true;

  @input
  @hint("Position models at modelContainer location")
  public useContainerPosition: boolean = true;

  @input
  @hint("Scale factor for loaded models")
  @widget(new SliderWidget(0.1, 5.0, 0.1))
  public modelScale: number = 1.0;

  // Status Display
  @input
  @hint("Text component to display loading status (optional)")
  @allowUndefined
  public statusText: Text;

  // Private variables
  private headers: { [key: string]: string };
  private storageApiUrl: string;
  private isInitialized: boolean = false;
  private remoteServiceModule: RemoteServiceModule;
  private remoteMediaModule: RemoteMediaModule;
  private isLoading: boolean = false;
  private loadedAssets: {
    model?: SceneObject;
    texture?: Texture;
    audio?: AudioTrackAsset;
  } = {};

  onAwake() {
    this.log("🔧 SupabaseAssetLoader initializing...");
    this.checkInternetAvailability();
    this.initializeSupabase();
    this.initializeRemoteModules();
    this.setupLoadButton();
    this.updateStatus("Initialized - Ready to load assets");
  }

  /**
   * Check internet availability
   */
  private checkInternetAvailability() {
    const isInternetAvailable = global.deviceInfoSystem.isInternetAvailable();
    this.log(`🌐 Internet available: ${isInternetAvailable}`);
    
    if (!isInternetAvailable) {
      this.log("❌ No internet connection - asset loading will fail");
      this.updateStatus("❌ No internet connection");
    }

    // Listen for internet status changes
    global.deviceInfoSystem.onInternetStatusChanged.add((args) => {
      this.log(`🌐 Internet status changed: ${args.isInternetAvailable}`);
      if (args.isInternetAvailable) {
        this.updateStatus("🌐 Internet connected");
      } else {
        this.updateStatus("❌ Internet disconnected");
      }
    });
  }

  /**
   * Initialize Supabase connection parameters
   */
  private initializeSupabase() {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      this.log("❌ Missing Supabase credentials");
      this.updateStatus("❌ Missing Supabase credentials");
      return;
    }

    // Check if using service key for bypassing RLS
    if (this.useServiceKey && !this.supabaseServiceKey) {
      this.log("❌ Service key enabled but not provided");
      this.updateStatus("❌ Missing service key");
      return;
    }

    // Supabase Storage API URL format
    this.storageApiUrl = this.supabaseUrl.replace(/\/$/, '') + "/storage/v1/object/public/";

    // Use service key if enabled (bypasses RLS policies)
    const apiKey = this.useServiceKey ? this.supabaseServiceKey : this.supabaseAnonKey;
    
    this.headers = {
      "Content-Type": "application/json",
      "apikey": apiKey,
      "Authorization": `Bearer ${apiKey}`
    };

    this.isInitialized = true;
    this.log("✅ Supabase asset loader initialized");
    this.log(`📁 Storage URL: ${this.storageApiUrl}`);
    this.log(`🔑 Using ${this.useServiceKey ? 'SERVICE' : 'ANON'} key`);
    
    if (this.useServiceKey) {
      this.log("⚠️ WARNING: Using service key - bypasses all RLS policies!");
    }
  }

  /**
   * Initialize remote service modules for media loading
   */
  private initializeRemoteModules() {
    try {
      this.remoteServiceModule = require('LensStudio:RemoteServiceModule');
      this.remoteMediaModule = require('LensStudio:RemoteMediaModule');
      
      if (!this.remoteServiceModule || !this.remoteMediaModule) {
        this.log("❌ Remote modules not available");
        return;
      }
      
      this.log("✅ Remote modules initialized");
    } catch (error) {
      this.log(`❌ Error initializing remote modules: ${error}`);
    }
  }

  /**
   * Setup load button interaction using Spectacles Interaction Kit
   */
  private setupLoadButton() {
    if (!this.loadButton) {
      this.log("⚠️ No load button assigned");
      this.log("💡 You can also call loadAllAssets() manually");
      return;
    }

    this.log(`🔘 Load button assigned: ${this.loadButton.name}`);

    // Create event callback function for the load button
    const onTriggerStartCallback = (event: InteractorEvent) => {
      this.log("🚀 LOAD BUTTON PRESSED!");
      this.loadAllAssets();
    };

    // Add the event listener to the load button onInteractorTriggerStart
    this.loadButton.onInteractorTriggerStart(onTriggerStartCallback);

    this.log("✅ Load button interaction setup complete");
  }

  /**
   * Load all assets (3D model, image, and audio)
   */
  public async loadAllAssets() {
    if (!this.isInitialized) {
      this.log("❌ Cannot load assets - not initialized");
      this.updateStatus("❌ Not initialized");
      return;
    }

    if (this.isLoading) {
      this.log("⏳ Assets are already loading...");
      return;
    }

    // Check internet connectivity first
    if (!global.deviceInfoSystem.isInternetAvailable()) {
      this.log("❌ No internet connection available");
      this.updateStatus("❌ No internet connection");
      return;
    }

    this.isLoading = true;
    this.updateStatus("🔄 Loading assets...");
    this.log("🚀 Starting asset loading process...");

    // Test URLs first to debug connectivity issues
    await this.testAssetUrls();

    try {
      // Load assets in parallel for better performance
      const loadPromises = [];

      if (this.modelFileName && this.modelContainer) {
        loadPromises.push(this.load3DModel());
      }

      if (this.imageFileName && this.imageDisplay) {
        loadPromises.push(this.loadImage());
      }

      if (this.audioFileName && this.audioPlayer) {
        loadPromises.push(this.loadAudio());
      }

      // Wait for all assets to load (using Promise.all with manual error handling)
      let successCount = 0;
      let failureCount = 0;
      const totalAssets = loadPromises.length;
      
      // Handle each promise individually to avoid Promise.allSettled compatibility issues
      for (let i = 0; i < loadPromises.length; i++) {
        try {
          await loadPromises[i];
          successCount++;
          this.log(`✅ Asset ${i + 1}/${totalAssets} loaded successfully`);
        } catch (error) {
          failureCount++;
          this.log(`❌ Asset ${i + 1}/${totalAssets} failed: ${error}`);
        }
      }

      this.log(`✅ Asset loading complete: ${successCount} succeeded, ${failureCount} failed`);
      this.updateStatus(`✅ Loaded ${successCount}/${totalAssets} assets`);

    } catch (error) {
      this.log(`❌ Asset loading error: ${error}`);
      this.updateStatus("❌ Loading failed");
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load a 3D model from Supabase Storage
   */
  private async load3DModel(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.log(`📦 Loading 3D model: ${this.modelFileName}`);
        
        const modelUrl = `${this.storageApiUrl}${this.storageBucket}/${this.modelFileName}`;
        this.log(`🔗 Model URL: ${modelUrl}`);

        // Create resource from URL
        const resource = this.remoteServiceModule.makeResourceFromUrl(modelUrl);
        
        if (!resource) {
          reject("Failed to create resource from model URL");
          return;
        }

        // Load as GLTF asset
        this.remoteMediaModule.loadResourceAsGltfAsset(
          resource,
          (gltfAsset) => {
            this.log("📦 GLTF asset loaded, instantiating...");
            
            // Create GLTF settings
            const gltfSettings = GltfSettings.create();
            gltfSettings.convertMetersToCentimeters = true;

            // Instantiate the GLTF asset using simpler method
            try {
              const sceneObj = gltfAsset.tryInstantiate(this.modelContainer, this.defaultMaterial);
              
              if (sceneObj) {
                this.log("✅ 3D model instantiated successfully");
                
                // Set as child of modelContainer and inherit its transform
                sceneObj.setParent(this.modelContainer);
                
                // Set to same world position and rotation as modelContainer
                const containerTransform = this.modelContainer.getTransform();
                sceneObj.getTransform().setWorldPosition(containerTransform.getWorldPosition());
                sceneObj.getTransform().setWorldRotation(containerTransform.getWorldRotation());

                // Scale the model
                const transform = sceneObj.getTransform();
                const currentScale = transform.getLocalScale();
                transform.setLocalScale(currentScale.uniformScale(this.modelScale));
                
                // Store reference
                this.loadedAssets.model = sceneObj;
                
                this.log("✅ 3D model loaded and positioned successfully");
                resolve();
              } else {
                this.log("❌ Failed to instantiate GLTF asset - returned null");
                reject("Failed to instantiate GLTF asset");
              }
            } catch (instantiateError) {
              this.log(`❌ Error during instantiation: ${instantiateError}`);
              reject(instantiateError);
            }
          },
          (error) => {
            this.log(`❌ Error loading GLTF asset: ${error}`);
            reject(error);
          }
        );
      } catch (error) {
        this.log(`❌ Error in load3DModel: ${error}`);
        reject(error);
      }
    });
  }

  /**
   * Load an image from Supabase Storage
   */
  private async loadImage(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.log(`🖼️ Loading image: ${this.imageFileName}`);
        
        const imageUrl = `${this.storageApiUrl}${this.storageBucket}/${this.imageFileName}`;
        this.log(`🔗 Image URL: ${imageUrl}`);

        // Create resource from URL
        const resource = this.remoteServiceModule.makeResourceFromUrl(imageUrl);
        
        if (!resource) {
          reject("Failed to create resource from image URL");
          return;
        }

        // Load as image texture
        this.remoteMediaModule.loadResourceAsImageTexture(
          resource,
          (texture) => {
            this.log("✅ Image texture loaded successfully");
            
            // Apply texture to the display object
            this.applyTextureToObject(texture);
            
            // Store reference
            this.loadedAssets.texture = texture;
            
            resolve();
          },
          (error) => {
            this.log(`❌ Error loading image texture: ${error}`);
            reject(error);
          }
        );
      } catch (error) {
        this.log(`❌ Error in loadImage: ${error}`);
        reject(error);
      }
    });
  }

  /**
   * Load audio from Supabase Storage
   */
  private async loadAudio(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.log(`🔊 Loading audio: ${this.audioFileName}`);
        
        const audioUrl = `${this.storageApiUrl}${this.storageBucket}/${this.audioFileName}`;
        this.log(`🔗 Audio URL: ${audioUrl}`);

        // Create resource from URL
        const resource = this.remoteServiceModule.makeResourceFromUrl(audioUrl);
        
        if (!resource) {
          reject("Failed to create resource from audio URL");
          return;
        }

        // Load as audio track asset
        this.remoteMediaModule.loadResourceAsAudioTrackAsset(
          resource,
          (audioAsset) => {
            this.log("✅ Audio asset loaded successfully");
            
            // Apply audio to the player object
            this.applyAudioToObject(audioAsset);
            
            // Store reference
            this.loadedAssets.audio = audioAsset;
            
            resolve();
          },
          (error) => {
            this.log(`❌ Error loading audio asset: ${error}`);
            reject(error);
          }
        );
      } catch (error) {
        this.log(`❌ Error in loadAudio: ${error}`);
        reject(error);
      }
    });
  }


  /**
   * Apply loaded texture to the image display component
   * Using the same pattern as AI Playground ImageGenerator
   */
  private applyTextureToObject(texture: Texture) {
    try {
      if (!this.imageDisplay) {
        this.log("⚠️ No image display component assigned");
        return;
      }

      // Enable the image component and set the texture (AI Playground pattern)
      this.imageDisplay.enabled = true;
      this.imageDisplay.mainPass.baseTex = texture;
      
      this.log("✅ Texture applied to Image component");
    } catch (error) {
      this.log(`❌ Error applying texture: ${error}`);
    }
  }

  /**
   * Apply loaded audio to the audio player object
   */
  private applyAudioToObject(audioAsset: AudioTrackAsset) {
    try {
      let audioComponent = this.audioPlayer.getComponent("Component.AudioComponent");
      
      if (!audioComponent) {
        // Create AudioComponent if it doesn't exist
        audioComponent = this.audioPlayer.createComponent("Component.AudioComponent");
        this.log("📢 Created AudioComponent on audio player object");
      }

      // Set the audio track
      audioComponent.audioTrack = audioAsset;
      
      // Configure audio settings
      audioComponent.volume = 0.8;
      audioComponent.play(1);
      
      this.log("✅ Audio applied and playing on audio player object");
    } catch (error) {
      this.log(`❌ Error applying audio: ${error}`);
    }
  }


  /**
   * Test asset URLs accessibility
   */
  public async testAssetUrls() {
    if (!this.isInitialized) {
      this.log("❌ Cannot test URLs - not initialized");
      return;
    }

    this.log("🧪 Testing asset URL accessibility...");

    // Try both URL formats
    const baseUrl = this.supabaseUrl.replace(/\/$/, '');
    const altStorageUrl = baseUrl.replace('.supabase.co', '.storage.supabase.co');

    const urls = [
      { name: "3D Model", url: `${this.storageApiUrl}${this.storageBucket}/${this.modelFileName}` },
      { name: "3D Model (Alt)", url: `${altStorageUrl}/${this.storageBucket}/${this.modelFileName}` },
      { name: "Image", url: `${this.storageApiUrl}${this.storageBucket}/${this.imageFileName}` },
      { name: "Image (Alt)", url: `${altStorageUrl}/${this.storageBucket}/${this.imageFileName}` },
      { name: "Audio", url: `${this.storageApiUrl}${this.storageBucket}/${this.audioFileName}` },
      { name: "Audio (Alt)", url: `${altStorageUrl}/${this.storageBucket}/${this.audioFileName}` }
    ];

    for (const asset of urls) {
      try {
        this.log(`🔍 Testing: ${asset.url}`);
        
        // Try GET request instead of HEAD for better compatibility
        const request = new Request(asset.url, {
          method: "GET"
          // Don't include auth headers for public storage
        });

        const response = await this.internetModule.fetch(request);
        
        if (response.ok) {
          const contentLength = response.headers.get("content-length");
          this.log(`✅ ${asset.name} accessible (${response.status}) - Size: ${contentLength || 'unknown'} bytes`);
        } else {
          const errorText = await response.text();
          this.log(`❌ ${asset.name} not accessible (${response.status}): ${errorText}`);
          this.log(`🔗 URL: ${asset.url}`);
        }
      } catch (error) {
        this.log(`❌ Error testing ${asset.name} URL: ${error}`);
        this.log(`🔗 Failed URL: ${asset.url}`);
      }
    }
  }

  /**
   * Clear all loaded assets
   */
  public clearLoadedAssets() {
    this.log("🧹 Clearing loaded assets...");

    // Remove loaded 3D model
    if (this.loadedAssets.model) {
      this.loadedAssets.model.destroy();
      this.loadedAssets.model = undefined;
        this.log("🗑️ 3D model cleared");
    }

    // Clear texture (note: texture cleanup is handled by Lens Studio)
    if (this.loadedAssets.texture) {
      this.loadedAssets.texture = undefined;
      this.log("🗑️ Texture reference cleared");
    }

    // Stop and clear audio
    if (this.loadedAssets.audio) {
      const audioComponent = this.audioPlayer ? this.audioPlayer.getComponent("Component.AudioComponent") : null;
      if (audioComponent) {
        audioComponent.stop(true);
        audioComponent.audioTrack = null;
      }
      this.loadedAssets.audio = undefined;
      this.log("🗑️ Audio cleared");
    }

    this.updateStatus("🧹 Assets cleared");
  }

  /**
   * Get loading status
   */
  public getLoadingStatus(): string {
    if (!this.isInitialized) return "Not initialized";
    if (this.isLoading) return "Loading...";
    
    const loadedCount = Object.values(this.loadedAssets).filter(asset => asset !== undefined).length;
    return `${loadedCount} assets loaded`;
  }

  /**
   * Logging helper
   */
  private log(message: string) {
    if (this.enableDebugLogs) {
      print(`[SupabaseAssetLoader] ${message}`);
    }
  }

  /**
   * Update status text if available
   */
  private updateStatus(status: string) {
    if (this.statusText) {
      this.statusText.text = status;
    }
  }

  /**
   * Public getters
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  public getStorageBucket(): string {
    return this.storageBucket;
  }

  public getLoadedAssets() {
    return { ...this.loadedAssets };
  }
}

/**
 * SUPABASE STORAGE SETUP INSTRUCTIONS:
 * 
 * 1. CREATE STORAGE BUCKET:
 *    - Go to Supabase Dashboard > Storage
 *    - Click "New bucket"
 *    - Name: "assets" (or your preferred name)
 *    - Make it public: Enable "Public bucket"
 *    - Click "Create bucket"
 * 
 * 2. UPLOAD YOUR ASSETS:
 *    Create folder structure in your bucket:
 *    assets/
 *    ├── models/
 *    │   ├── character.glb
 *    │   └── prop.gltf
 *    ├── images/
 *    │   ├── texture.png
 *    │   └── background.jpg
 *    └── audio/
 *        ├── sound.mp3
 *        └── music.wav
 * 
 * 3. SET BUCKET POLICIES:
 *    Go to Storage > Policies and create a policy:
 *    ```sql
 *    CREATE POLICY "Public Access" ON storage.objects
 *    FOR SELECT USING (bucket_id = 'assets');
 *    ```
 * 
 * 4. GET PUBLIC URLS:
 *    Your assets will be accessible at:
 *    https://your-project.supabase.co/storage/v1/object/public/assets/models/character.glb
 * 
 * 5. SUPPORTED FILE FORMATS:
 *    - 3D Models: .glb, .gltf
 *    - Images: .png, .jpg, .jpeg
 *    - Audio: .mp3, .wav, .ogg
 * 
 * 6. FILE SIZE LIMITS:
 *    - Free tier: 1GB total storage
 *    - Individual files: up to 50MB
 *    - For larger files, consider using signed URLs
 * 
 * 7. LENS STUDIO SETUP:
 *    - Add InternetModule to your project
 *    - Create scene objects for model container, image display, audio player
 *    - Assign this script to a scene object
 *    - Configure all input parameters in the inspector
 *    - Add a pinch button with TouchComponent
 */
