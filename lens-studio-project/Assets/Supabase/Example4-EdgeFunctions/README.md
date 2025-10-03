# Example4-EdgeFunctions: Supabase Edge Function Integration

This example demonstrates how to call Supabase Edge Functions from Lens Studio, specifically showcasing image processing using ImageMagick.

## 🎯 Overview

This example connects to a deployed Supabase Edge Function that:
- **Receives**: Image files via multipart form data
- **Processes**: Resizes images to 500x300 pixels and applies blur effect
- **Returns**: Processed PNG image data

## 📋 Prerequisites

### Supabase Requirements
- Supabase project with Edge Functions enabled
- Deployed Edge Function (specs-example-function)
- Supabase anon/public API key

### Lens Studio Requirements
- Lens Studio v5.3.0 or later
- Spectacles OS v5.58.6621 or later
- InternetModule added to your project
- Spectacles Interaction Kit (SIK) added to your project

## 🚀 Quick Setup

### 1. Edge Function Setup (Already Deployed)

Your `specs-example-function` is already deployed with this code:

```typescript
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  ImageMagick,
  initializeImageMagick,
} from "npm:@imagemagick/magick-wasm@0.0.30"

await initializeImageMagick()

Deno.serve(async (req) => {
  const formData = await req.formData()
  const file = formData.get('file')
  const content = await file.arrayBuffer()
  const result = await ImageMagick.read(new Uint8Array(content), (img) => {
    img.resize(500, 300)
    img.blur(60, 5)
    return img.write(data => data)
  })
  return new Response(
    result,
    { headers: { 'Content-Type': 'image/png' }}
  )
})
```

**Function Details:**
- **Name**: `specs-example-function`
- **Input**: Image file via FormData
- **Processing**: Resize (500x300) + Blur (radius: 60, sigma: 5)
- **Output**: Processed PNG image

### 2. Lens Studio Setup

#### Add Required Modules
1. **InternetModule**: For HTTP requests
2. **Spectacles Interaction Kit**: For button interactions

#### Create Scene Objects
1. **Process Button**: SceneObject with Interactable component
2. **Input Image**: Texture asset or Image component
3. **Output Image**: Image component to display processed result

#### Configure the Script
1. **Add EdgeFunctionCall script** to a SceneObject
2. **Configure parameters** in the inspector:

```
Endpoint URL: https://mhuywfpdvmnethlhfaek.supabase.co/functions/v1/specs-example-function
Public Key: [Your Supabase anon key]
Input Image: [Assign Texture to process]
Output Image: [Assign Image component]
Process Button: [Assign Interactable button]
Enable Debug Logs: ✅
```

## 🎮 Usage

### Basic Usage
1. **Setup**: Complete all setup steps above
2. **Assign**: Set input image and output image components
3. **Test**: Press the process button to call the Edge Function
4. **Observe**: Watch console logs and output image

### Manual Usage
```typescript
// Get the script component
const edgeFunction = mySceneObject.getComponent("EdgeFunctionCall");

// Call function manually
edgeFunction.callFunction();

// Call with different image
edgeFunction.callFunctionWithImage(myTexture);
```

## 🔧 Configuration

### Script Parameters

#### **Supabase Settings**
- **Endpoint URL**: Your Edge Function endpoint
- **Public Key**: Supabase anon/public API key (NOT service role key)

#### **Image Processing**
- **Input Image**: Texture to be processed
- **Output Image**: Image component to display result

#### **Interaction**
- **Process Button**: Interactable button to trigger processing
- **Enable Debug Logs**: Show detailed processing logs

### Expected Console Output
```
[EdgeFunctionCall] 🔧 EdgeFunctionCall initializing...
[EdgeFunctionCall] ✅ Edge Function service initialized
[EdgeFunctionCall] 🔗 Endpoint: https://mhuywfpdvmnethlhfaek.supabase.co/functions/v1/specs-example-function
[EdgeFunctionCall] 🔘 Process button assigned: ProcessButton
[EdgeFunctionCall] ✅ Process button interaction setup complete
[EdgeFunctionCall] 🚀 PROCESS BUTTON PRESSED!
[EdgeFunctionCall] 🖼️ Processing image with Edge Function...
[EdgeFunctionCall] 📤 Sending image to: https://mhuywfpdvmnethlhfaek.supabase.co/functions/v1/specs-example-function
[EdgeFunctionCall] 🔄 Converting texture to bytes...
[EdgeFunctionCall] 📤 Sending multipart form data to Edge Function...
[EdgeFunctionCall] 📡 Response Status: 200
[EdgeFunctionCall] ✅ Image processed successfully by Edge Function
[EdgeFunctionCall] 🖼️ Converting processed image to texture...
[EdgeFunctionCall] ✅ Processed image ready for display
```

## 🛠️ Current Limitations

### Texture-to-Bytes Conversion
The current implementation uses placeholder bytes for texture conversion. A complete implementation would need:

```typescript
// Proper texture-to-bytes conversion (complex in Lens Studio)
// This would require:
// 1. Rendering texture to a render target
// 2. Reading pixel data
// 3. Encoding as PNG/JPEG bytes
// 4. Handling different texture formats
```

### Binary Response Handling
The response processing is currently simplified. A complete implementation would:

```typescript
// Convert binary PNG response back to Texture
// This would require:
// 1. Receiving binary data from Edge Function
// 2. Converting bytes to Texture using RemoteMediaModule
// 3. Applying processed texture to output Image component
```

## 🔍 Troubleshooting

### Common Issues

#### "Missing endpoint URL or API key"
- ✅ Check Supabase project URL format
- ✅ Verify API key from Dashboard > Settings > API
- ✅ Ensure using anon/public key, not service role key

#### "No input image assigned"
- ✅ Assign a Texture to the Input Image field
- ✅ Ensure texture is valid and loaded
- ✅ Check texture is not null

#### "No process button assigned"
- ✅ Create SceneObject with Interactable component
- ✅ Add Spectacles Interaction Kit to project
- ✅ Configure Interactable for tap/pinch interaction

#### Edge Function Errors
- ✅ Check function is deployed and accessible
- ✅ Test function URL in browser or Postman
- ✅ Verify function accepts multipart form data
- ✅ Check Supabase project has Edge Functions enabled

### Debug Steps

1. **Enable Debug Logs**: Set `enableDebugLogs = true`
2. **Check Console Output**: Look for detailed request/response logs
3. **Test Function Separately**: Use curl or Postman to test Edge Function
4. **Verify Internet Connection**: Ensure Spectacles has internet access
5. **Check API Key**: Verify key has proper permissions

## 🌐 Testing Edge Function Manually

You can test your Edge Function outside of Lens Studio:

### Using curl
```bash
curl -X POST \
  https://mhuywfpdvmnethlhfaek.supabase.co/functions/v1/specs-example-function \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -F "file=@your-image.jpg"
```

### Using Postman
1. **Method**: POST
2. **URL**: `https://mhuywfpdvmnethlhfaek.supabase.co/functions/v1/specs-example-function`
3. **Headers**:
   - `Authorization: Bearer YOUR_ANON_KEY`
   - `apikey: YOUR_ANON_KEY`
4. **Body**: Form-data with key `file` and image file

## 🔐 Security Considerations

### API Key Usage
- ✅ Use anon/public key for client-side calls
- ❌ Never use service_role key in Lens Studio
- ✅ Store keys securely (not in version control)

### Edge Function Security
- ✅ Edge Functions run in secure Deno environment
- ✅ Automatic scaling and isolation
- ✅ Built-in request validation

## 📊 Performance & Limits

### Edge Function Limits
- **Execution Time**: 150 seconds max
- **Memory**: 512MB max
- **Request Size**: 50MB max
- **Concurrent Executions**: Based on plan

### Optimization Tips
- **Image Size**: Smaller input images process faster
- **Batch Processing**: Process multiple images in single call
- **Caching**: Cache processed results when possible
- **Error Handling**: Implement retry logic for network issues

## 🚀 Advanced Usage

### Custom Image Processing
Modify the Edge Function to support different operations:

```typescript
// Add parameters for different processing options
const { operation, width, height, blur } = await req.json()

// Support different operations
switch(operation) {
  case 'resize':
    img.resize(width, height)
    break
  case 'blur':
    img.blur(blur.radius, blur.sigma)
    break
  case 'both':
    img.resize(width, height)
    img.blur(blur.radius, blur.sigma)
    break
}
```

### Multiple Image Formats
Support different input/output formats:

```typescript
// Detect input format
const contentType = file.type
const outputFormat = req.headers.get('accept') || 'image/png'

// Process based on format
return new Response(result, {
  headers: { 'Content-Type': outputFormat }
})
```

## 📚 Additional Resources

### Supabase Documentation
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Edge Functions API Reference](https://supabase.com/docs/reference/javascript/functions-invoke)
- [Deno Runtime APIs](https://supabase.com/docs/guides/functions/runtime-apis)

### ImageMagick Documentation
- [ImageMagick WASM](https://github.com/dlemstra/magick-wasm)
- [ImageMagick Operations](https://imagemagick.org/script/command-line-processing.php)

### Lens Studio Documentation
- [Internet Access](https://developers.snap.com/lens-studio/references/guides/lens-features/tracking/world-tracking)
- [Spectacles Interaction Kit](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-interaction-kit)

## 🎉 Example Use Cases

### Image Filters
- Apply artistic effects to camera captures
- Create Instagram-style filters
- Process user-uploaded images

### Image Optimization
- Resize images for different display sizes
- Compress images for better performance
- Convert between image formats

### Batch Processing
- Process multiple images simultaneously
- Create image galleries with effects
- Generate thumbnails from full-size images

## ✅ Setup Checklist

Before testing:
- [ ] Edge Function deployed to Supabase
- [ ] InternetModule added to Lens Studio project
- [ ] Spectacles Interaction Kit added to project
- [ ] Process button created with Interactable component
- [ ] Input and output Image components created
- [ ] Script configured with correct endpoint URL and API key
- [ ] Debug logging enabled for testing
- [ ] Internet connection available on Spectacles

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Enable debug logging and check console output
3. Test Edge Function manually with curl/Postman
4. Verify all setup steps are completed
5. Check Supabase Dashboard for function logs and errors

Happy Edge Function processing! 🚀
