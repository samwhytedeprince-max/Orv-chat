# Chatteme - Free Messaging App Setup

Chatteme is a modern, internet-based messaging application with support for text, voice notes, photos, videos, and calls. No SMS or airtime required—just data!

## Environment Variables

Add your Supabase credentials to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Project Structure

```
src/
├── lib/
│   ├── supabase.js          # Supabase client & auth functions
│   ├── authStore.js         # Authentication state management
│   └── messageStore.js      # Messaging state & operations
├── components/
│   ├── Auth.jsx             # Login/signup form
│   ├── ChatList.jsx         # Conversation list
│   ├── ChatWindow.jsx       # Message display & input
│   ├── Sidebar.jsx          # Navigation & user menu
│   └── AddContactModal.jsx  # Contact search & add
├── pages/
│   └── AppPage.jsx          # Main app container
├── App.jsx                  # Routing setup
└── main.jsx                 # Entry point
```

## Key Features

- **Real-time Messaging**: Instant message delivery with live updates
- **Contact Management**: Search and add contacts by username or phone
- **Message Types**: Text, images, videos, and voice notes
- **Call Support**: Voice and video call logs
- **Beautiful UI**: Modern gradient design with smooth animations
- **Authentication**: Secure email/password auth via Supabase

## Database Schema

### Tables
- `profiles` - User information and status
- `contacts` - User's contact list
- `conversations` - One-on-one chat threads
- `messages` - Individual messages with media support
- `media` - File uploads (images, videos, voice)
- `call_logs` - Voice/video call history

All tables include Row Level Security (RLS) policies ensuring users can only access their own data.

## Copy-Paste Code Snippets

### Send a Text Message

```javascript
import { supabase } from './lib/supabase';
import { useMessageStore } from './lib/messageStore';

const { sendMessage } = useMessageStore();

// Send message
const { data, error } = await sendMessage(
  conversationId,
  userId,
  'Hello!',
  'text'
);
```

### Get Messages for Conversation

```javascript
import { supabase } from './lib/supabase';

const { data: messages, error } = await supabase
  .from('messages')
  .select(`
    *,
    sender:profiles(id, display_name, avatar_url),
    media(*)
  `)
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });
```

### Create or Get Conversation

```javascript
import { useMessageStore } from './lib/messageStore';

const { createOrGetConversation } = useMessageStore();

const { data: conversation, error } = await createOrGetConversation(
  currentUserId,
  otherUserId
);
```

### Add Contact

```javascript
import { useMessageStore } from './lib/messageStore';

const { addContact } = useMessageStore();

const { data, error } = await addContact(
  userId,
  contactUserId,
  phoneNumber
);
```

### Search for Users

```javascript
import { supabase } from './lib/supabase';

const { data: users, error } = await supabase
  .from('profiles')
  .select('id, username, display_name, avatar_url, phone_number')
  .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
  .limit(10);
```

### Mark Message as Read

```javascript
import { supabase } from './lib/supabase';

const { error } = await supabase
  .from('messages')
  .update({
    is_read: true,
    read_at: new Date().toISOString()
  })
  .eq('id', messageId);
```

### Log a Call

```javascript
import { supabase } from './lib/supabase';

const { data, error } = await supabase
  .from('call_logs')
  .insert({
    conversation_id: conversationId,
    caller_id: userId,
    call_type: 'voice', // or 'video'
    status: 'completed', // or 'missed', 'declined'
    duration_seconds: 300,
    ended_at: new Date().toISOString()
  });
```

### Real-Time Message Subscription

```javascript
import { supabase } from './lib/supabase';

const subscription = supabase
  .channel(`messages:${conversationId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();

// Unsubscribe when done
supabase.removeChannel(subscription);
```

### Get User Profile

```javascript
import { supabase } from './lib/supabase';

const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .maybeSingle();
```

### Update Profile

```javascript
import { useAuthStore } from './lib/authStore';

const { updateProfile } = useAuthStore();

const { data, error } = await updateProfile(userId, {
  display_name: 'New Name',
  avatar_url: 'https://...',
  bio: 'My bio'
});
```

### Listen for Auth State Changes

```javascript
import { supabase } from './lib/supabase';

const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (session) {
      console.log('User logged in:', session.user);
    } else {
      console.log('User logged out');
    }
  }
);

// Cleanup
subscription?.unsubscribe();
```

## Running the App

```bash
npm run dev    # Start development server
npm run build  # Build for production
```

## Component Customization

### Change Gradient Colors
Edit `src/components/Auth.jsx` and `src/components/ChatWindow.jsx`:

```jsx
// From
className="bg-gradient-to-r from-blue-600 to-cyan-600"

// To your colors
className="bg-gradient-to-r from-green-600 to-emerald-600"
```

### Modify Button Styles
Update classes in components:

```jsx
// Rounded buttons
className="rounded-full"  // More rounded

// Squared buttons
className="rounded-lg"    // Less rounded
```

## Troubleshooting

**Messages not appearing?**
- Check that conversations exist between users
- Verify RLS policies allow access to messages table
- Ensure users are authenticated

**Real-time updates not working?**
- Check Supabase realtime is enabled in project settings
- Verify subscription channels match table names
- Check browser console for errors

**Images not loading?**
- Ensure avatar URLs are valid
- Check Supabase storage policies if using bucket
- Use fallback avatar URLs as backup
