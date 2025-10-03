# 🎯 Spectacles Real-Time Cursor Controller

A real-time cursor synchronization system that allows you to control AR objects in Lens Studio from your PC using mouse movements.

## 🌟 Features

- **Real-time cursor synchronization** between PC and Spectacles
- **Smooth movement interpolation** in AR space
- **Multi-user support** with unique colors and IDs
- **Automatic cleanup** of old cursor data
- **Web-based controller** with beautiful UI
- **Room-based isolation** for multiple sessions

## 🚀 Quick Start

### 1. Database Setup

First, create the required table in your Supabase database:

```sql
-- Create the cursor_positions table
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

-- Create index for performance
CREATE INDEX idx_cursor_positions_room_timestamp
ON cursor_positions(room_name, timestamp DESC);

-- Enable Row Level Security (optional)
ALTER TABLE cursor_positions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (for development)
CREATE POLICY "Allow anonymous access" ON cursor_positions
FOR ALL USING (true);
```

### 2. Start PC Controller

```bash
# Install dependencies
npm install

# Start the web server
npm start

# Or use the shortcut
npm run dev
```

Open http://localhost:3000 in your browser.

### 3. Configure Lens Studio

1. **Import the cursor scripts** to your Lens Studio project
2. **Create a Scene Object** to act as the cursor (e.g., a sphere)
3. **Attach `RealtimeCursorFollower`** script to any Scene Object
4. **Configure the script** in the inspector:
   - Supabase URL and API key
   - Room name (must match PC controller)
   - Assign the cursor object
   - Adjust movement settings

### 4. Connect and Test

1. **Enter your Supabase credentials** in the PC controller
2. **Set the same room name** in both PC and Lens Studio
3. **Click "Connect to Spectacles"**
4. **Move your mouse** in the control area
5. **Watch the AR object** follow your cursor in Lens Studio!

## 🛠️ Configuration

### PC Controller Settings

- **Supabase URL**: Your project URL from the Supabase dashboard
- **Supabase Anon Key**: Public API key from your dashboard
- **Room Name**: Unique identifier for your session
- **User Name**: Display name for this cursor

### Lens Studio Settings

- **Movement Speed**: How smoothly the object follows (0.1 = smooth, 1.0 = instant)
- **Movement Scale**: Amplifies cursor movements (1.0 = normal, 2.0 = double)
- **Height Offset**: Y-axis offset for the cursor object
- **Distance From Camera**: How far the object appears from the user

## 📁 Project Structure

```
cursor-controller/
├── index.html              # Main web interface
├── supabase-client.js      # Enhanced Supabase client
├── package.json            # NPM configuration
└── README.md              # This file

MyProject/Assets/Supabase/Example2-RealTimeCursor/
├── RealtimeCursorFollower.ts    # Main cursor follower
├── RealtimeCursorBroadcaster.ts # Helper broadcaster
└── README.md                    # Lens Studio setup
```

## 🎮 How It Works

### Data Flow

1. **PC Controller** captures mouse movements
2. **Cursor positions** are stored in Supabase database
3. **Lens Studio** polls for position updates
4. **AR object** smoothly moves to follow cursor

### Technical Architecture

```
PC Browser → Supabase Database → Lens Studio
    ↓              ↓                ↓
Mouse Move   cursor_positions   AR Object
```

### Real-time Communication

- **PC Side**: Uses Supabase Realtime channels + database writes
- **Lens Side**: HTTP polling for maximum compatibility
- **Throttling**: 20 FPS max to optimize performance
- **Cleanup**: Automatic removal of old cursor data

## 🔧 Troubleshooting

### Common Issues

**"Database table not found"**
- Make sure you created the `cursor_positions` table
- Check that RLS policies allow anonymous access

**"Object not moving smoothly"**
- Increase the movement speed setting
- Check network connectivity
- Verify room names match

**"Connection failed"**
- Verify Supabase URL and API key
- Check browser console for errors
- Ensure internet access in Lens Studio preview

**"Object moving too fast/slow"**
- Adjust `movementScale` for sensitivity
- Modify `movementSpeed` for smoothness
- Check `distanceFromCamera` setting

### Debug Mode

Enable debug logs in both PC controller and Lens Studio to see:
- Connection status
- Cursor position data
- Database operations
- Error messages

## 🌟 Advanced Features

### Multi-User Support

The system supports multiple users in the same room:
- Each user gets a unique ID and color
- Collision detection possible
- Room-based isolation

### Custom Mappings

You can modify the coordinate mapping:
- **Linear**: Direct 1:1 mapping
- **Exponential**: Accelerated movements
- **Constrained**: Limited movement area

### Integration Examples

```typescript
// Manual cursor position setting
cursorFollower.setTestCursorPosition(50, 75); // x: 50%, y: 75%

// Get current cursor position
const position = cursorFollower.getCurrentCursorPosition();

// Check active users
const users = cursorFollower.getActiveUsers();
```

## 📚 API Reference

### RealtimeCursorFollower

**Public Methods:**
- `setTestCursorPosition(x, y)` - Manual position setting
- `getCurrentCursorPosition()` - Get current AR position
- `getActiveUsers()` - List of active user IDs
- `isCurrentlyConnected()` - Connection status

**Configuration:**
- `movementSpeed` - Interpolation speed
- `movementScale` - Sensitivity multiplier
- `heightOffset` - Y-axis adjustment
- `distanceFromCamera` - Z-depth positioning

### PC Controller API

**Connection:**
- `connect(url, key, room, user)` - Connect to Supabase
- `disconnect()` - Close connection
- `isClientConnected()` - Check status

**Broadcasting:**
- `broadcastCursorPosition(x, y)` - Send position
- `sendUserPresence(status)` - Enter/leave events
- `cleanupOldPositions()` - Database maintenance

## 🎯 Use Cases

### Gaming
- Real-time strategy games
- Puzzle games with PC assistance
- Multiplayer AR experiences

### Productivity
- 3D modeling guidance
- Presentation controls
- Collaborative design

### Education
- Interactive lessons
- Virtual labs
- Guided tutorials

## 🔮 Future Enhancements

- **WebSocket support** for lower latency
- **Voice control** integration
- **Gesture recognition** on PC side
- **Multiple object control**
- **Recording and playback**

---

🎉 **Happy Cursor Controlling!** Your AR objects are now under precise PC control!