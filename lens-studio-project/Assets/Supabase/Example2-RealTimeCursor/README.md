# 🎯 Real-Time Cursor for Lens Studio

This example demonstrates how to create a real-time cursor system where PC mouse movements control AR objects in Lens Studio.

## 📁 Files in This Folder

### `RealtimeCursorFollower.ts`
Main component that receives cursor positions and moves AR objects accordingly.

**Features:**
- Real-time position synchronization
- Smooth movement interpolation
- Configurable sensitivity and speed
- Debug logging and status display

### `RealtimeCursorBroadcaster.ts`
Helper component for broadcasting cursor positions (advanced use).

**Features:**
- Cursor position broadcasting
- Automatic cleanup of old data
- Multi-user support
- Performance optimization

## 🚀 Quick Setup

### 1. Database Preparation

Create this table in your Supabase SQL editor:

```sql
CREATE TABLE cursor_positions (
  id BIGSERIAL PRIMARY KEY,
  room_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  color TEXT DEFAULT '#FF6B6B',
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cursor_positions_room_timestamp
ON cursor_positions(room_name, timestamp DESC);

ALTER TABLE cursor_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous access" ON cursor_positions FOR ALL USING (true);
```

### 2. Lens Studio Setup

1. **Create a cursor object** (sphere, cube, or custom 3D model)
2. **Add Internet Module** to your project
3. **Create a Scene Object** for the script
4. **Attach `RealtimeCursorFollower`** script
5. **Configure in inspector**:

```
Supabase Url: https://your-project.supabase.co
Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Room Name: spectacles-demo-room
Internet Module: [Drag Internet Module here]
Cursor Object: [Drag your cursor object here]
Movement Speed: 0.15
Movement Scale: 1.5
Height Offset: 0.0
Distance From Camera: 2.0
```

### 3. Start PC Controller

Navigate to the PC controller directory and run:

```bash
cd ../../cursor-controller
npm install
npm start
```

Open http://localhost:3000 and enter the same credentials.

### 4. Test Connection

1. **Start Lens Studio preview** (Device Type: Spectacles)
2. **Connect PC controller** with matching room name
3. **Move mouse** in the control area
4. **Watch AR object** follow your cursor!

## ⚙️ Configuration Guide

### Movement Settings

**Movement Speed** (0.05 - 1.0)
- `0.05`: Very smooth, laggy
- `0.15`: Smooth, natural (recommended)
- `0.5`: Responsive
- `1.0`: Instant, no interpolation

**Movement Scale** (0.1 - 5.0)
- `0.5`: Small movements
- `1.0`: Normal 1:1 mapping
- `1.5`: Amplified (recommended)
- `3.0`: Very sensitive

**Height Offset** (-2.0 - 2.0)
- Adjusts Y position of cursor object
- `0.0`: Center height
- `0.5`: Slightly above center
- `-0.5`: Slightly below center

**Distance From Camera** (0.5 - 10.0)
- How far the object appears
- `1.0`: Very close
- `2.0`: Comfortable distance (recommended)
- `5.0`: Far away

## 🎮 Usage Examples

### Basic Cursor Following

```typescript
// The script automatically handles cursor following
// Just assign a cursor object and configure settings
```

### Manual Position Control

```typescript
// Get reference to the cursor follower
@input cursorFollower: RealtimeCursorFollower;

// Set manual position for testing
this.cursorFollower.setTestCursorPosition(50, 50); // Center
this.cursorFollower.setTestCursorPosition(0, 0);   // Top-left
this.cursorFollower.setTestCursorPosition(100, 100); // Bottom-right
```

### Status Monitoring

```typescript
// Check connection status
if (this.cursorFollower.isCurrentlyConnected()) {
    print("✅ Receiving cursor data");
}

// Get current position
const position = this.cursorFollower.getCurrentCursorPosition();
print(`Cursor at: ${position.x}, ${position.y}, ${position.z}`);

// Monitor active users
const users = this.cursorFollower.getActiveUsers();
print(`Active users: ${users.length}`);
```

## 🔧 Troubleshooting

### Object Not Moving

**Check console for errors:**
```
[RealtimeCursor] ❌ Missing Supabase credentials
[RealtimeCursor] ❌ No cursor object assigned
[RealtimeCursor] ⚠️ Table access issue: 404
```

**Solutions:**
1. Verify Supabase URL and API key
2. Assign cursor object in inspector
3. Create cursor_positions table
4. Disable RLS or add policies

### Jerky Movement

**Common causes:**
- Movement speed too high (try 0.1-0.2)
- Network latency
- Movement scale too high

**Solutions:**
```
Movement Speed: 0.1 (smoother)
Movement Scale: 1.0 (less sensitive)
```

### No Cursor Data

**Check PC controller:**
- Browser console for connection errors
- Network connectivity
- Matching room names

**Check Lens Studio:**
- Device Type Override = Spectacles
- Internet Module assigned
- Preview mode active

## 🎯 Advanced Features

### Multiple Cursors

To support multiple users, modify the script to track multiple user IDs:

```typescript
private cursors: Map<string, SceneObject> = new Map();

private handleMultipleCursors(users: any[]) {
    users.forEach(user => {
        let cursor = this.cursors.get(user.user_id);
        if (!cursor) {
            cursor = this.createNewCursor(user.color);
            this.cursors.set(user.user_id, cursor);
        }
        this.updateCursorPosition(cursor, user.x, user.y);
    });
}
```

### Custom Cursor Objects

Create different cursor types:

```typescript
// Material-based color changing
private updateCursorColor(color: string) {
    if (this.cursorObject) {
        const material = this.cursorObject.getComponent("Component.RenderMeshVisual");
        // Apply color to material
    }
}

// Scale-based feedback
private updateCursorScale(activity: number) {
    const scale = 1.0 + (activity * 0.5);
    this.cursorObject.getTransform().setLocalScale(new vec3(scale, scale, scale));
}
```

### Data Recording

Track cursor movements for playback:

```typescript
private recordedPositions: any[] = [];

private recordPosition(x: number, y: number) {
    this.recordedPositions.push({
        x: x,
        y: y,
        timestamp: Date.now()
    });
}

private playbackRecording() {
    // Play back recorded cursor movements
}
```

## 📊 Performance Tips

### Optimize Polling

```typescript
// Adjust polling frequency based on movement
private dynamicPolling = true;
private pollInterval = 100; // Start with 100ms

private adjustPollingRate(movementSpeed: number) {
    if (movementSpeed > 0.5) {
        this.pollInterval = 50; // Faster for active movement
    } else {
        this.pollInterval = 200; // Slower for static cursor
    }
}
```

### Memory Management

```typescript
// Clean up old data
private cleanupOldUsers() {
    const now = Date.now();
    this.activeUsers.forEach((user, id) => {
        if (now - user.lastSeen > 10000) { // 10 seconds
            this.activeUsers.delete(id);
        }
    });
}
```

## 🌟 Next Steps

1. **Add haptic feedback** when cursor moves
2. **Implement gesture recognition** on PC
3. **Create cursor trails** in AR space
4. **Add sound effects** for interactions
5. **Build collaborative tools** using cursor data

---

🎉 **Your AR cursor system is ready!** Control virtual objects with precise PC input.