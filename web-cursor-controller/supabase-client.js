/**
 * Enhanced Supabase client for real-time cursor broadcasting
 * This version writes cursor positions to a database table AND
 * uses Supabase Realtime channels for maximum compatibility
 */

// Use the global supabase object from CDN

class SpectaclesCursorClient {
    constructor() {
        this.supabase = null;
        this.channel = null;
        this.isConnected = false;
        this.userId = this.generateUserId();
        this.userColor = this.generateRandomColor();
        this.lastBroadcastTime = 0;
        this.broadcastThrottleMs = 50; // 20 FPS max
    }

    generateUserId() {
        return 'pc_' + Math.random().toString(36).substr(2, 9);
    }

    generateRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    async connect(supabaseUrl, supabaseKey, roomName, userName) {
        try {
            // Create Supabase client using global supabase from CDN
            this.supabase = supabase.createClient(supabaseUrl, supabaseKey);
            this.roomName = roomName;
            this.userName = userName;

            // Test connection by checking if cursor_positions table exists
            const { data, error } = await this.supabase
                .from('cursor_positions')
                .select('id')
                .limit(1);

            if (error && error.code === '42P01') {
                // Table doesn't exist
                console.warn('cursor_positions table does not exist. Please create it using the provided SQL schema.');
                throw new Error('Database table not found. Please create the cursor_positions table first.');
            }

            // Create realtime channel for immediate feedback
            this.channel = this.supabase.channel(`cursor-room-${roomName}`, {
                config: {
                    broadcast: { self: false } // Don't broadcast to self
                }
            });

            // Listen for other cursors (optional - for future multi-user support)
            this.channel.on('broadcast', { event: 'cursor-move' }, (payload) => {
                console.log('Other user cursor movement:', payload);
            });

            // Subscribe to the channel
            const subscription = await this.channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    this.isConnected = true;
                    console.log('✅ Connected to Supabase Realtime');
                    return true;
                } else if (status === 'CHANNEL_ERROR') {
                    throw new Error('Failed to subscribe to realtime channel');
                }
            });

            return true;

        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }

    async broadcastCursorPosition(x, y) {
        if (!this.isConnected || !this.supabase) {
            return false;
        }

        const now = Date.now();

        // Throttle broadcasts
        if (now - this.lastBroadcastTime < this.broadcastThrottleMs) {
            return false;
        }

        this.lastBroadcastTime = now;

        const cursorData = {
            room_name: this.roomName,
            user_id: this.userId,
            user_name: this.userName,
            x: x,
            y: y,
            color: this.userColor,
            timestamp: now
        };

        try {
            // Method 1: Write to database table (for Lens Studio to read)
            const { data, error } = await this.supabase
                .from('cursor_positions')
                .insert(cursorData);

            if (error) {
                console.error('Database write error:', error);
                return false;
            }

            // Method 2: Broadcast via Realtime channel (for web clients)
            if (this.channel) {
                this.channel.send({
                    type: 'broadcast',
                    event: 'cursor-move',
                    payload: cursorData
                });
            }

            console.log(`📡 Broadcasted cursor: (${x.toFixed(1)}, ${y.toFixed(1)})`);
            return true;

        } catch (error) {
            console.error('Broadcast error:', error);
            return false;
        }
    }

    async cleanupOldPositions() {
        if (!this.supabase) return;

        try {
            const cutoffTime = Date.now() - (30 * 1000); // 30 seconds ago

            const { error } = await this.supabase
                .from('cursor_positions')
                .delete()
                .lt('timestamp', cutoffTime);

            if (!error) {
                console.log('🧹 Cleaned up old cursor positions');
            }
        } catch (error) {
            console.warn('Cleanup error:', error);
        }
    }

    async sendUserPresence(status) {
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: status === 'enter' ? 'cursor-enter' : 'cursor-leave',
            payload: {
                user_id: this.userId,
                user_name: this.userName,
                color: this.userColor,
                timestamp: Date.now()
            }
        });
    }

    disconnect() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.supabase = null;
        this.isConnected = false;
        console.log('📱 Disconnected from Supabase');
    }

    isClientConnected() {
        return this.isConnected;
    }

    getUserInfo() {
        return {
            id: this.userId,
            name: this.userName,
            color: this.userColor
        };
    }

    async setControlMode(mode) {
        // Store control mode in database for Lens Studio to read
        if (!this.supabase) return;

        try {
            const { error } = await this.supabase
                .from('cursor_positions')
                .insert({
                    room_name: this.roomName,
                    user_id: this.userId + '_control',
                    user_name: this.userName + ' (control)',
                    x: 0,
                    y: 0,
                    color: this.userColor,
                    timestamp: Date.now()
                });

            if (!error) {
                console.log(`🎮 Control mode set to: ${mode}`);
            }
        } catch (error) {
            console.warn('Control mode error:', error);
        }
    }

    async getSpectaclesCursor() {
        // Get latest cursor from Spectacles (device_type = 'spectacles')
        if (!this.supabase) return null;

        try {
            console.log(`🔎 Searching for Spectacles cursor in room: "${this.roomName}"`);
            console.log(`🔎 Looking for user_id pattern: "spectacles_%"`);

            // First, let's see ALL data in the room to debug
            const { data: allData, error: allError } = await this.supabase
                .from('cursor_positions')
                .select('*')
                .eq('room_name', this.roomName)
                .order('timestamp', { ascending: false })
                .limit(5);

            if (!allError && allData) {
                console.log(`📊 Found ${allData.length} total records in room:`, allData.map(d => ({
                    user_id: d.user_id,
                    user_name: d.user_name,
                    x: d.x,
                    y: d.y,
                    timestamp: d.timestamp
                })));
            }

            // Now search specifically for Spectacles data
            const { data, error } = await this.supabase
                .from('cursor_positions')
                .select('*')
                .eq('room_name', this.roomName)
                .like('user_id', 'spectacles_%')
                .order('timestamp', { ascending: false })
                .limit(1);

            if (error) {
                console.warn('Get Spectacles cursor error:', error);
                return null;
            }

            if (data.length > 0) {
                console.log('🎯 Found Spectacles cursor data:', data[0]);
                return data[0];
            } else {
                console.log('🔍 No Spectacles cursor data found in room:', this.roomName);
                console.log('🔍 Searched for user_id LIKE "spectacles_%"');
            }
        } catch (error) {
            console.warn('Get Spectacles cursor error:', error);
        }

        return null;
    }
}

// Make it globally available
window.SpectaclesCursorClient = SpectaclesCursorClient;