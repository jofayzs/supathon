# Example1-SupabaseConnector: Basic Database Integration

This example demonstrates how to connect Lens Studio to Supabase for basic database operations including reading, writing, and testing connectivity.

## 🎯 Overview

The SupabaseConnector provides:
- **Database Connection**: Connect to Supabase PostgreSQL database
- **CRUD Operations**: Create, Read, Update, Delete records
- **Connection Testing**: Verify connectivity and table access
- **Error Handling**: Comprehensive error reporting and logging
- **Sample Data**: Pre-configured test tables and data

## 📋 Prerequisites

### Supabase Requirements
- Supabase account and project
- Database tables created
- API credentials configured

### Lens Studio Requirements
- Lens Studio v5.3.0 or later
- Spectacles OS v5.58.6621 or later
- InternetModule added to your project
- Device Type Override set to Spectacles

## 🚀 Quick Setup

### 1. Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and sign up/sign in
2. **Click "New Project"**
3. **Configure project**:
   - Name: `Spectacles Demo` (or your preference)
   - Database Password: Choose a strong password
   - Region: Select closest to you
4. **Click "Create new project"**
5. **Wait for setup** (1-2 minutes)

### 2. Get API Credentials

1. **Go to Settings > API** in your Supabase dashboard
2. **Copy these values**:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Create Database Tables

#### Required Tables (4 total):

##### **1. test_messages** (Main test table)
```sql
CREATE TABLE test_messages (
  id BIGSERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  sender TEXT,
  timestamp TIMESTAMPTZ,
  lens_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### **2. realtime_messages** (For realtime features)
```sql
CREATE TABLE realtime_messages (
  id BIGSERIAL PRIMARY KEY,
  channel TEXT NOT NULL,
  event TEXT NOT NULL,
  payload TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### **3. user_interactions** (For user tracking)
```sql
CREATE TABLE user_interactions (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  data TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### **4. user_preferences** (For user settings)
```sql
CREATE TABLE user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  preferences JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Create via Supabase UI:**
1. **Go to Table Editor > New Table**
2. **Create each table** with the columns listed above
3. **Import sample data** from the provided CSV files (optional)

### 4. Configure Row Level Security (Optional)

For development, you can allow anonymous access:

```sql
-- Enable RLS
ALTER TABLE test_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access
CREATE POLICY "Allow anonymous access" ON test_messages
FOR ALL USING (true);
```

### 5. Lens Studio Setup

#### **Add Required Modules:**
1. **InternetModule**: For HTTP requests
2. **Add SupabaseConnector script** to a SceneObject

#### **Configure Script:**
```
Supabase URL: https://your-project-id.supabase.co
Supabase Anon Key: [Your anon public key]
Table Name: test_messages
Internet Module: [Assign InternetModule]
Channel Name: test_channel
Enable Debug Logs: ✅
```

#### **Set Device Type:**
- **In Preview Panel**: Set Device Type Override to **Spectacles**

## 🎮 Usage

### Basic Usage
1. **Run the lens** in Lens Studio preview
2. **Check console logs** for connection status
3. **Verify data** in Supabase Table Editor

### Expected Console Output
```
[SupabaseConnector] 🔧 SupabaseConnector initializing...
[SupabaseConnector] ✅ Supabase connector initialized
[SupabaseConnector] 📡 API URL: https://your-project.supabase.co/rest/v1/
[SupabaseConnector] 🔍 Testing Supabase connection...
[SupabaseConnector] ✅ Successfully connected to Supabase!
[SupabaseConnector] 📊 Table 'test_messages' is accessible
[SupabaseConnector] 📝 Inserting test record...
[SupabaseConnector] ✅ Test record inserted successfully!
[SupabaseConnector] 📚 Fetching all records...
[SupabaseConnector] ✅ Retrieved 1 records
```

### Using in Other Scripts
```typescript
@component
export class MyLensScript extends BaseScriptComponent {
  @input supabaseConnector: SupabaseConnector;

  async handleUserAction() {
    if (this.supabaseConnector.isSupabaseConnected()) {
      // Log user interaction
      await this.supabaseConnector.logUserInteraction("lens_tapped", {
        location: "main_scene",
        timestamp: Date.now()
      });

      // Insert custom data
      await this.supabaseConnector.insertIntoTable("test_messages", {
        message: "User tapped the lens!",
        sender: "Lens User",
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

## 🔧 Available Methods

### Connection Methods
- `isSupabaseConnected()`: Check connection status
- `testConnection()`: Test database connectivity
- `getTableInfo(tableName)`: Get table schema info

### Data Operations
- `insertIntoTable(table, data)`: Insert new record
- `selectFromTable(table, filters?)`: Query records
- `updateTable(table, data, filters)`: Update records
- `deleteFromTable(table, filters)`: Delete records

### Utility Methods
- `logUserInteraction(action, data)`: Log user actions
- `broadcastMessage(channel, event, payload)`: Send realtime messages
- `getConnectionStatus()`: Get detailed connection info

## 🛠️ Troubleshooting

### Common Issues

#### "Connection failed: 401"
- ✅ Check API key is correct
- ✅ Use anon public key, not service role key
- ✅ Verify key hasn't expired

#### "Connection failed: 404"
- ✅ Check Project URL format
- ✅ Ensure Device Type Override is Spectacles
- ✅ Verify project exists and is active

#### "Table doesn't exist"
- ✅ Check table name spelling (case-sensitive)
- ✅ Verify table created in correct project
- ✅ Ensure table is in public schema

#### "No response" or timeout
- ✅ Check internet connection
- ✅ Verify Spectacles has internet access
- ✅ Try different network if needed

### Debug Steps
1. **Enable debug logging** in script
2. **Check console output** for detailed errors
3. **Test API manually** with curl or Postman
4. **Verify in Supabase Dashboard** - check logs and table data

## 📊 Sample Data

The example includes sample CSV files for testing:
- `test_messages.csv` - Sample messages
- `realtime_messages.csv` - Sample realtime data
- `user_interactions.csv` - Sample user actions
- `user_preferences.csv` - Sample user settings

Import these via **Table Editor > Insert > Import from CSV**

## 🔐 Security Best Practices

### Development
- ✅ Use anon public key for client-side
- ✅ Enable RLS policies for production
- ✅ Never commit API keys to version control

### Production
- ✅ Implement proper authentication
- ✅ Use Row Level Security policies
- ✅ Monitor API usage and set limits
- ✅ Use environment variables for keys

## 📚 Additional Resources

### Supabase Documentation
- [Database Guide](https://supabase.com/docs/guides/database)
- [API Reference](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Lens Studio Documentation
- [Internet Access](https://developers.snap.com/lens-studio/references/guides/lens-features/tracking/world-tracking)
- [Scripting Guide](https://developers.snap.com/lens-studio/references/guides/lens-features/scripting)

## ✅ Setup Checklist

Before testing:
- [ ] Supabase project created
- [ ] API credentials copied
- [ ] Database tables created
- [ ] Sample data imported (optional)
- [ ] InternetModule added to Lens Studio
- [ ] SupabaseConnector script configured
- [ ] Device Type Override set to Spectacles
- [ ] Debug logging enabled

## 🎉 You're Ready!

Once setup is complete, the SupabaseConnector will automatically test the connection and insert a test record. Check both the Lens Studio console and your Supabase Table Editor to verify everything is working!

Happy database connecting! 🚀
