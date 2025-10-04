# Example3-LoadAssets: Supabase Asset Loader

This example demonstrates how to load 3D models, images, and audio files from Supabase Storage into Lens Studio on pinch button click.

## 🎯 Features

- **3D Model Loading**: Load GLTF/GLB models from Supabase Storage
- **Image Loading**: Load images as textures and apply to materials
- **Audio Loading**: Load audio files and play them through AudioComponent
- **Pinch Button Trigger**: Load assets on user interaction
- **Progress Tracking**: Monitor loading progress with detailed logs
- **Error Handling**: Comprehensive error handling and status reporting
- **Asset Management**: Clear and manage loaded assets
- **Animation Support**: Automatically detect and play model animations
- **Auto-positioning**: Automatically position models in front of camera

## 📋 Prerequisites

### Lens Studio Requirements
- Lens Studio v5.3.0 or later
- Spectacles OS v5.58.6621 or later
- InternetModule added to your project

### Supabase Requirements
- Supabase project with Storage enabled
- Public storage bucket for assets
- Proper bucket policies for public access

## 🚀 Quick Setup

### 1. Supabase Storage Setup

#### Create Storage Bucket
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Storage** in the sidebar
3. Click **"New bucket"**
4. Configure bucket:
   - **Name**: `assets` (or your preferred name)
   - **Public bucket**: ✅ Enable this
   - **File size limit**: 50MB (default)
5. Click **"Create bucket"**

#### Upload Your Assets
Create the following folder structure in your bucket:

```
assets/
├── models/
│   ├── character.glb
│   ├── prop.gltf
│   └── animated_model.glb
├── images/
│   ├── texture.png
│   ├── background.jpg
│   └── material.jpeg
└── audio/
    ├── sound_effect.mp3
    ├── background_music.wav
    └── voice_clip.ogg
```

**Upload Steps:**
1. Click on your `assets` bucket
2. Click **"Upload file"** or **"Create folder"**
3. Create folders: `models`, `images`, `audio`
4. Upload your files to appropriate folders
5. Ensure files are marked as **public**

#### Set Bucket Policies
1. Go to **Storage > Policies**
2. Click **"New policy"**
3. Select **"For full customization"**
4. Use this policy for public read access:

```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');
```

Or use the policy editor:
- **Policy name**: `Public Access`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**: `bucket_id = 'assets'`

### 2. Lens Studio Setup

#### Add Required Modules
1. In Lens Studio, go to **Project Panel**
2. Right-click and select **"Add Module"**
3. Add **InternetModule**

#### Create Scene Objects
Create the following scene objects in your hierarchy:

1. **Model Container**: Empty SceneObject for 3D models
2. **Image Display**: SceneObject with RenderMeshVisual (e.g., Plane)
3. **Audio Player**: SceneObject for audio playback
4. **Pinch Button**: SceneObject with TouchComponent
5. **Status Text** (optional): Text component for status display

#### Configure Materials
1. Create a **Material** for 3D models
2. Assign appropriate **Mesh** to Image Display object
3. Ensure Image Display has **RenderMeshVisual** component

#### Add the Script
1. Create a new SceneObject (or use existing one)
2. Add **"SupabaseAssetLoader"** script component
3. Configure all input parameters in the Inspector

### 3. Script Configuration

#### Supabase Settings
- **Supabase URL**: `https://your-project.supabase.co`
- **Supabase Anon Key**: Your public API key from Dashboard > Settings > API
- **Storage Bucket**: `assets` (or your bucket name)

#### Asset File Names
- **Model File Name**: `models/character.glb`
- **Image File Name**: `images/texture.png`
- **Audio File Name**: `audio/sound.mp3`

#### Scene Object Assignments
- **Model Container**: Your empty SceneObject for models
- **Image Display**: Your plane/quad with RenderMeshVisual
- **Audio Player**: Your SceneObject for audio
- **Default Material**: Material for 3D models
- **Pinch Button**: Button with TouchComponent

#### Loading Settings
- **Enable Progress Logs**: ✅ (for debugging)
- **Enable Debug Logs**: ✅ (for debugging)
- **Auto Position Models**: ✅ (positions in front of camera)
- **Model Distance**: `200` cm from camera
- **Model Scale**: `1.0` (adjust as needed)

## 📁 Supported File Formats

### 3D Models
- **.glb** (recommended) - Binary GLTF with embedded textures
- **.gltf** - Text-based GLTF with separate texture files

### Images
- **.png** (recommended) - Supports transparency
- **.jpg/.jpeg** - Good for photos, no transparency
- **.webp** - Modern format with good compression

### Audio
- **.mp3** (recommended) - Good compression, wide support
- **.wav** - Uncompressed, high quality
- **.ogg** - Open source, good compression

## 🎮 Usage

### Basic Usage
1. **Setup**: Complete all setup steps above
2. **Test**: Run the lens in Lens Studio preview
3. **Load**: Pinch the assigned button to load assets
4. **Observe**: Watch console logs for loading progress

### Advanced Usage

#### Manual Asset Loading
```typescript
// Get the script component
const assetLoader = mySceneObject.getComponent("SupabaseAssetLoader");

// Load all assets programmatically
assetLoader.loadAllAssets();

// Test URL accessibility
assetLoader.testAssetUrls();

// Clear loaded assets
assetLoader.clearLoadedAssets();

// Check loading status
const status = assetLoader.getLoadingStatus();
```

#### Custom Asset Paths
Update the file name properties to load different assets:
```typescript
assetLoader.modelFileName = "models/new_character.glb";
assetLoader.imageFileName = "images/new_texture.png";
assetLoader.audioFileName = "audio/new_sound.mp3";
```

## 🔧 Troubleshooting

### Common Issues

#### "Missing Supabase credentials"
- ✅ Check Supabase URL format: `https://your-project.supabase.co`
- ✅ Verify API key from Dashboard > Settings > API
- ✅ Ensure anon/public key, not service role key

#### "Failed to create resource from URL"
- ✅ Verify file exists in Supabase Storage
- ✅ Check file path matches exactly (case-sensitive)
- ✅ Ensure bucket is public
- ✅ Test URL in browser: `https://your-project.supabase.co/storage/v1/object/public/assets/models/your-file.glb`

#### "HTTP 403 Forbidden"
- ✅ Check bucket policies allow public access
- ✅ Ensure bucket is marked as public
- ✅ Verify file is not in a private folder

#### "No TouchComponent found"
- ✅ Add TouchComponent to your pinch button
- ✅ Ensure button SceneObject is assigned correctly
- ✅ Check TouchComponent is enabled

#### "No RenderMeshVisual found"
- ✅ Add RenderMeshVisual component to image display object
- ✅ Assign a mesh (plane, quad, etc.)
- ✅ Assign a material to the RenderMeshVisual

### Debug Steps

1. **Enable Verbose Logging**:
   ```typescript
   enableDebugLogs = true
   enableProgressLogs = true
   ```

2. **Test URLs Manually**:
   ```typescript
   assetLoader.testAssetUrls();
   ```

3. **Check Console Output**:
   - Look for `[SupabaseAssetLoader]` messages
   - Check for HTTP status codes
   - Verify file paths and URLs

4. **Verify Internet Connection**:
   ```typescript
   const hasInternet = global.deviceInfoSystem.isInternetAvailable();
   print("Internet available: " + hasInternet);
   ```

## 📊 File Size Guidelines

### Recommended Sizes
- **3D Models**: < 10MB for good performance
- **Images**: < 2MB (1024x1024 max recommended)
- **Audio**: < 5MB for sound effects, < 20MB for music

### Optimization Tips
- **Models**: Use GLB format with compressed textures
- **Images**: Use PNG for transparency, JPG for photos
- **Audio**: Use MP3 with 128-192 kbps for good quality/size balance

## 🔐 Security Considerations

### Public vs Private Assets
- **Public Bucket**: Assets accessible to anyone with URL
- **Private Bucket**: Requires authentication (signed URLs)
- **Recommendation**: Use public bucket for non-sensitive assets

### API Key Security
- ✅ Use anon/public key (safe for client-side)
- ❌ Never use service role key in Lens Studio
- ✅ Rotate keys if compromised

## 🚀 Performance Tips

### Loading Optimization
1. **Parallel Loading**: Assets load in parallel by default
2. **Preload Critical Assets**: Load important assets first
3. **Asset Caching**: Lens Studio caches downloaded assets
4. **Progressive Loading**: Load low-res first, then high-res

### Runtime Optimization
1. **Model LOD**: Use different detail levels for distance
2. **Texture Compression**: Use compressed texture formats
3. **Audio Compression**: Balance quality vs file size
4. **Memory Management**: Clear unused assets with `clearLoadedAssets()`

## 📚 Additional Resources

### Supabase Documentation
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage-createbucket)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Lens Studio Documentation
- [Internet Access](https://developers.snap.com/lens-studio/references/guides/lens-features/tracking/world-tracking)
- [Remote Media Module](https://developers.snap.com/lens-studio/references/guides/lens-features/machine-learning/ml-component)
- [GLTF Assets](https://developers.snap.com/lens-studio/references/guides/adding-content/3d/3d-assets)

### Example Assets
You can find example assets for testing at:
- [Sketchfab](https://sketchfab.com/features/free-3d-models) - Free 3D models
- [Freesound](https://freesound.org/) - Free audio files
- [Unsplash](https://unsplash.com/) - Free images

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Enable debug logging and check console output
3. Verify all setup steps are completed
4. Test with simple assets first (small files)
5. Check Supabase Dashboard for storage usage and errors

Happy asset loading! 🎉
