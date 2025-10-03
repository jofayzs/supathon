
/**
 * Edge Function Call Example for Lens Studio
 * 
 * This component demonstrates how to call Supabase Edge Functions
 * from Lens Studio using the InternetModule.
 * 
 * Prerequisites:
 * 1. Add InternetModule to your project
 * 2. Add Spectacles Interaction Kit (SIK) to your project
 * 3. Deploy an Edge Function to your Supabase project
 * 4. Configure the endpoint URL and API key
 */

import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";

@component
export class EdgeFunctionCall extends BaseScriptComponent {

  // Supabase Configuration
  @input
  @hint("Internet Module for making HTTP requests")
  public internetModule: InternetModule;

  @input
  @hint("Supabase Edge Function endpoint URL")
  public endpointUrl: string = "https://mhuywfpdvmnethlhfaek.supabase.co/functions/v1/specs-example-function";

  @input
  @hint("Your Supabase anon/public API key")
  public publicKey: string = "";

  // Function Parameters
  @input
  @hint("Input image to process (will be resized and blurred)")
  public inputImage: Texture;

  @input
  @hint("Output image component to display processed result")
  public outputImage: Image;

  @input
  @hint("Test image URL from your Supabase Storage")
  public testImageUrl: string = "https://mhuywfpdvmnethlhfaek.supabase.co/storage/v1/object/public/specs-bucket/public/images/spectacles.jpg";

  @input
  @hint("Limit image size to prevent timeouts (bytes)")
  @widget(new SliderWidget(50000, 500000, 10000))
  public maxImageSize: number = 200000;

  // Button Configuration
  @input
  @hint("Interactable button to trigger Edge Function call (using Spectacles Interaction Kit)")
  public processButton: Interactable;

  @input
  @hint("Enable debug logging")
  public enableDebugLogs: boolean = true;

  onAwake() {
    this.log("🔧 EdgeFunctionCall initializing...");
    this.initializeService();
    this.setupProcessButton();
  }

  /**
   * Initialize the Edge Function service
   */
  private initializeService() {
    if (!this.internetModule) {
      this.log("❌ InternetModule not assigned");
      return;
    }

    if (!this.endpointUrl || !this.publicKey) {
      this.log("❌ Missing endpoint URL or API key");
      return;
    }

    this.log("✅ Edge Function service initialized");
    this.log(`🔗 Endpoint: ${this.endpointUrl}`);
  }

  /**
   * Setup process button interaction using Spectacles Interaction Kit
   */
  private setupProcessButton() {
    if (!this.processButton) {
      this.log("⚠️ No process button assigned");
      this.log("💡 You can also call callFunction() manually");
      return;
    }

    this.log(`🔘 Process button assigned: ${this.processButton.name}`);

    // Create event callback function for the process button
    const onTriggerStartCallback = (event: InteractorEvent) => {
      this.log("🚀 PROCESS BUTTON PRESSED!");
      this.callEdgeFunction();
    };

    // Add the event listener to the process button onInteractorTriggerStart
    this.processButton.onInteractorTriggerStart(onTriggerStartCallback);

    this.log("✅ Process button interaction setup complete");
  }

  /**
   * Call the Supabase Edge Function with image processing
   */
  private callEdgeFunction() {
    try {
      this.log("🖼️ Processing image with Edge Function...");
      this.log(`📤 Sending request to: ${this.endpointUrl}`);

      // For now, let's use a simple approach - download an image from Supabase Storage
      // and send it to the Edge Function for processing
      this.downloadAndProcessImage();

    } catch (error) {
      this.log(`❌ Error preparing image: ${error}`);
    }
  }

  /**
   * Send image URL to Edge Function for processing
   */
  private async downloadAndProcessImage() {
    try {
      this.log(`🔗 Sending image URL to Edge Function: ${this.testImageUrl}`);

      // Send just the URL to the Edge Function - let it download the image
      const payload = {
        imageUrl: this.testImageUrl
      };

      const request = RemoteServiceHttpRequest.create();
      request.url = this.endpointUrl;
      request.headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.publicKey}`,
        "apikey": this.publicKey
      };
      request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
      request.body = JSON.stringify(payload);

      this.log("📤 Sending image URL to Edge Function...");

      this.internetModule.performHttpRequest(request, (response) => {
        this.log(`📡 Response Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
          this.log("✅ Edge Function processed image successfully");
          this.log("🖼️ Processed image received");
          // The response.body contains the processed image as binary data
        } else {
          this.log(`❌ Edge Function Error (${response.statusCode}): ${response.body}`);
        }
      });

    } catch (error) {
      this.log(`❌ Error calling Edge Function: ${error}`);
    }
  }

  /**
   * Convert texture to bytes for Edge Function
   */
  private convertTextureToBytes(callback: (bytes: Uint8Array) => void) {
    try {
      // Note: Texture-to-bytes conversion is complex in Lens Studio
      // This is a placeholder implementation
      this.log("🔄 Converting texture to bytes...");
      this.log("⚠️ Using placeholder bytes - texture conversion needs proper implementation");
      
      // Create a simple PNG header as placeholder
      // In production, you'd need to properly convert the texture to image bytes
      const placeholderBytes = new Uint8Array([
        137, 80, 78, 71, 13, 10, 26, 10, // PNG signature
        0, 0, 0, 13, 73, 72, 68, 82     // IHDR chunk start
      ]);
      
      callback(placeholderBytes);
      
    } catch (error) {
      this.log(`❌ Error converting texture: ${error}`);
    }
  }

  /**
   * Send real image bytes to Edge Function
   */
  private sendImageBytesToEdgeFunction(imageBytes: Uint8Array) {
    try {
      this.log("📤 Preparing to send image bytes to Edge Function...");
      
      // Use the older RemoteServiceHttpRequest approach for better compatibility
      const request = RemoteServiceHttpRequest.create();
      request.url = this.endpointUrl;
      
      // Convert bytes to base64 for sending as string body
      const base64Image = this.bytesToBase64(imageBytes);
      
      // Create a simple JSON payload with base64 image
      const payload = {
        imageData: base64Image,
        format: "jpg"
      };

      request.headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.publicKey}`,
        "apikey": this.publicKey
      };

      request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
      request.body = JSON.stringify(payload);

      this.log("📤 Sending base64 image data to Edge Function...");

      this.internetModule.performHttpRequest(request, (response) => {
        this.log(`📡 Response Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
          this.log("✅ Edge Function processed image successfully");
          this.log(`📥 Response: ${response.body}`);
        } else {
          this.log(`❌ Edge Function Error (${response.statusCode}): ${response.body}`);
        }
      });

    } catch (error) {
      this.log(`❌ Error sending image: ${error}`);
    }
  }

  /**
   * Create multipart form data for image upload
   */
  private createMultipartFormData(imageBytes: Uint8Array, boundary: string): string {
    const encoder = new TextEncoder();
    const CRLF = '\r\n';
    
    let formData = '';
    formData += `--${boundary}${CRLF}`;
    formData += `Content-Disposition: form-data; name="file"; filename="image.png"${CRLF}`;
    formData += `Content-Type: image/png${CRLF}${CRLF}`;
    
    // Note: This is simplified - in production you'd need proper binary handling
    formData += `[IMAGE_BYTES_PLACEHOLDER]${CRLF}`;
    formData += `--${boundary}--${CRLF}`;
    
    return formData;
  }

  /**
   * Handle the Edge Function response (for image processing)
   */
  private handleImageResponse(response: any) {
    this.log(`📡 Response Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      this.log("✅ Image processed successfully by Edge Function");
      // Response handled in sendImageBytesToEdgeFunction method
    } else {
      this.log(`❌ Edge Function Error (${response.statusCode}): ${response.body}`);
      this.onError(response.statusCode, response.body);
    }
  }

  /**
   * Handle processed image bytes from Edge Function
   */
  private handleProcessedImageBytes(processedBytes: Uint8Array) {
    try {
      this.log("🖼️ Converting processed image bytes to texture...");
      
      // Convert bytes back to base64 for texture creation
      const base64String = this.bytesToBase64(processedBytes);
      
      // Use Base64.decodeTextureAsync to create texture from processed image
      Base64.decodeTextureAsync(
        base64String,
        (texture) => {
          this.log("✅ Processed image converted to texture");
          this.applyProcessedTexture(texture);
        },
        () => {
          this.log("❌ Failed to decode processed image from base64");
        }
      );
      
    } catch (error) {
      this.log(`❌ Error handling processed image: ${error}`);
    }
  }

  /**
   * Convert bytes to base64 string (Lens Studio compatible)
   */
  private bytesToBase64(bytes: Uint8Array): string {
    // Simple base64 encoding for Lens Studio
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    // Use a simple base64 encoding approach
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < binary.length) {
      const a = binary.charCodeAt(i++);
      const b = i < binary.length ? binary.charCodeAt(i++) : 0;
      const c = i < binary.length ? binary.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  }

  /**
   * Apply processed texture to output image
   */
  private applyProcessedTexture(texture: Texture) {
    try {
      if (this.outputImage) {
        this.outputImage.enabled = true;
        this.outputImage.mainPass.baseTex = texture;
        this.log("✅ Processed image applied to output component");
      } else {
        this.log("⚠️ No output image component assigned");
      }
    } catch (error) {
      this.log(`❌ Error applying processed texture: ${error}`);
    }
  }

  /**
   * Handle successful response
   */
  private onSuccess(responseBody: string) {
    try {
      // Try to parse JSON response
      const data = JSON.parse(responseBody);
      this.log(`🎉 Parsed response data: ${JSON.stringify(data)}`);
    } catch (parseError) {
      // If not JSON, just log the raw response
      this.log(`📄 Raw response: ${responseBody}`);
    }
  }

  /**
   * Handle error response
   */
  private onError(statusCode: number, errorBody: string) {
    this.log(`🚨 Edge Function call failed with status ${statusCode}`);
    this.log(`📄 Error details: ${errorBody}`);
  }

  /**
   * Public method to call the function manually
   */
  public callFunction() {
    this.callEdgeFunction();
  }

  /**
   * Call function with different image
   */
  public callFunctionWithImage(image: Texture) {
    this.inputImage = image;
    this.callEdgeFunction();
  }

  /**
   * Logging helper
   */
  private log(message: string) {
    if (this.enableDebugLogs) {
      print(`[EdgeFunctionCall] ${message}`);
    }
  }
}

/**
 * EDGE FUNCTION SETUP INSTRUCTIONS:
 * 
 * This script is configured for the "specs-example-function" that processes images
 * using ImageMagick (resize to 500x300 and apply blur effect).
 * 
 * 1. EDGE FUNCTION CODE (already deployed):
 *    ```typescript
 *    import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 *    import { ImageMagick, initializeImageMagick } from "npm:@imagemagick/magick-wasm@0.0.30"
 *    
 *    await initializeImageMagick()
 *    
 *    Deno.serve(async (req) => {
 *      const formData = await req.formData()
 *      const file = formData.get('file')
 *      const content = await file.arrayBuffer()
 *      const result = await ImageMagick.read(new Uint8Array(content), (img) => {
 *        img.resize(500, 300)
 *        img.blur(60, 5)
 *        return img.write(data => data)
 *      })
 *      return new Response(
 *        result,
 *        { headers: { 'Content-Type': 'image/png' }}
 *      )
 *    })
 *    ```
 * 
 * 2. FUNCTION DETAILS:
 *    - Name: specs-example-function
 *    - Input: Image file via FormData
 *    - Processing: Resize (500x300) + Blur (60, 5)
 *    - Output: Processed PNG image
 * 
 * 3. ENDPOINT URL:
 *    - https://mhuywfpdvmnethlhfaek.supabase.co/functions/v1/specs-example-function
 * 
 * 4. CONFIGURE SCRIPT:
 *    - Input Image: Assign a Texture to process
 *    - Output Image: Assign an Image component to display result
 *    - Public Key: Your anon/public API key
 * 
 * 5. LIMITATIONS:
 *    - Texture-to-bytes conversion needs proper implementation
 *    - Binary response handling needs enhancement
 *    - Currently shows placeholder implementation
 */