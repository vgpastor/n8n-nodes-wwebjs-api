# n8n-nodes-wwebjs-api

[![npm version](https://img.shields.io/npm/v/n8n-nodes-wwebjs-api.svg)](https://www.npmjs.com/package/n8n-nodes-wwebjs-api)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub](https://img.shields.io/github/stars/vgpastor/n8n-nodes-wwebjs-api?style=social)](https://github.com/vgpastor/n8n-nodes-wwebjs-api)

n8n community node for **[WWebJS REST API](https://github.com/avoylenko/wwebjs-api)** — automate WhatsApp Web messaging from n8n.

This node provides a bridge between n8n and WhatsApp Web, powered by the excellent [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) library.

## Architecture

```
┌─────────┐     ┌──────────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   n8n   │────▶│  n8n-nodes-wwebjs-api │────▶│   wwebjs-api    │────▶│ whatsapp-web.js │
│         │◀────│    (this package)     │◀────│  (REST server)  │◀────│   (library)     │
└─────────┘     └──────────────────────┘     └─────────────────┘     └──────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │ WhatsApp Web │
                                              └──────────────┘
```

- **[whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)** - A WhatsApp client library for NodeJS that connects through the WhatsApp Web browser app
- **[wwebjs-api](https://github.com/avoylenko/wwebjs-api)** - REST API wrapper that exposes whatsapp-web.js functionality via HTTP endpoints
- **n8n-nodes-wwebjs-api** (this package) - n8n nodes that integrate with wwebjs-api

## Features

This package provides two nodes:

- **WWebJS API** — Action node with 7 resources and 60+ operations
- **WWebJS API Trigger** — Webhook trigger for incoming WhatsApp events with advanced filtering

### Highlights

- Send text, media, location, contacts, and polls
- Manage multiple WhatsApp sessions
- Group management (add/remove participants, admin controls)
- Channel support (WhatsApp Channels/Newsletters)
- Message reactions, replies, forwards, and edits
- Webhook trigger with filters (session, chat, content, sender)
- Webhook authentication (Header Auth, HMAC signature)
- Input validation with descriptive error messages

## Prerequisites

1. **WWebJS API instance** running and accessible — [Setup instructions](https://github.com/avoylenko/wwebjs-api#installation)
2. **n8n** v1.0.0+ instance

### Quick start with Docker Compose

```yaml
version: '3.8'
services:
  wwebjs-api:
    image: avoylenko/wwebjs-api:latest
    ports:
      - "3000:3000"
    environment:
      - API_KEY=your-secret-api-key
      - BASE_WEBHOOK_URL=http://n8n:5678/webhook/whatsapp
    volumes:
      - wwebjs_sessions:/app/sessions

  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  wwebjs_sessions:
  n8n_data:
```

## Installation

### Option A: Community Nodes (Recommended)

1. Go to **Settings → Community Nodes**
2. Click **Install a community node**
3. Enter: `n8n-nodes-wwebjs-api`
4. Click **Install**
5. Restart n8n if prompted

### Option B: Install from GitHub

```bash
cd ~/.n8n
npm install github:vgpastor/n8n-nodes-wwebjs-api

# Or with a specific version/tag
npm install github:vgpastor/n8n-nodes-wwebjs-api#v1.0.0
```

### Option C: Install from npm

```bash
cd ~/.n8n
npm install n8n-nodes-wwebjs-api
```

### Option D: Local development

```bash
# Clone and build
git clone https://github.com/vgpastor/n8n-nodes-wwebjs-api.git
cd n8n-nodes-wwebjs-api
npm install
npm run build
npm link

# Link to n8n
cd ~/.n8n
npm link n8n-nodes-wwebjs-api
```

After installation, restart n8n and the nodes will appear in the node palette.

## Configuration

### 1. Set up WWebJS API credentials

In n8n, go to **Settings → Credentials → Add Credential → WWebJS API** and configure:

| Field              | Description                                           | Example                 |
| ------------------ | ----------------------------------------------------- | ----------------------- |
| Base URL           | URL of your WWebJS API instance                       | `http://localhost:3000` |
| API Key            | The `API_KEY` env var from your WWebJS API            | `my-secret-key`         |
| Default Session ID | Default session to use when not specified in the node | `main-session`          |

### 2. Configure webhook URL in WWebJS API

Set the `BASE_WEBHOOK_URL` env var in your WWebJS API instance to point to your n8n webhook URL:

```env
BASE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/whatsapp
```

You can find the exact URL in the **WWebJS API Trigger** node settings.

## Resources & Operations

### Session

| Operation          | Description                  |
| ------------------ | ---------------------------- |
| Start              | Start a new WhatsApp session |
| Stop               | Stop a session               |
| Get Status         | Get session status           |
| Get QR Code        | Get QR code for login        |
| Get QR Image       | Get QR as PNG image          |
| Restart            | Restart a session            |
| Terminate          | Terminate and delete session |
| Terminate All      | Terminate all sessions       |
| Terminate Inactive | Terminate inactive sessions  |
| Get All Sessions   | List all active sessions     |

### Client (core messaging)

| Operation            | Description                                  |
| -------------------- | -------------------------------------------- |
| Send Message         | Send text, media, location, contact, or poll |
| Get Chats            | Get all current chats                        |
| Get Chat By ID       | Get a specific chat                          |
| Get Contacts         | Get all contacts                             |
| Get Contact By ID    | Get a specific contact                       |
| Search Messages      | Search for messages                          |
| Is Registered User   | Check if a number is on WhatsApp             |
| Get Number ID        | Get the WhatsApp ID for a number             |
| Get Connection State | Get the client connection state              |
| Send Seen            | Mark a chat as seen                          |
| Set Status           | Update your status message                   |
| Get Profile Pic URL  | Get a contact's profile picture              |
| Archive/Unarchive    | Archive or unarchive a chat                  |
| Mute/Unmute          | Mute or unmute a chat                        |
| Pin/Unpin            | Pin or unpin a chat                          |
| Get Blocked          | Get blocked contacts                         |

### Message

| Operation      | Description                 |
| -------------- | --------------------------- |
| Reply          | Reply to a specific message |
| React          | React with an emoji         |
| Forward        | Forward to another chat     |
| Edit           | Edit a sent message         |
| Delete         | Delete a message            |
| Download Media | Download attached media     |
| Get Info       | Get message delivery info   |
| Star/Unstar    | Star or unstar a message    |

### Chat

| Operation            | Description              |
| -------------------- | ------------------------ |
| Fetch Messages       | Load messages from chat  |
| Get Contact          | Get contact for a chat   |
| Get Info             | Get chat details         |
| Get Labels           | Get labels for a chat    |
| Send Typing State    | Show typing indicator    |
| Send Recording State | Show recording indicator |
| Send Seen            | Mark messages as seen    |
| Mark Unread          | Mark chat as unread      |
| Clear Messages       | Clear all messages       |
| Delete               | Delete a chat            |

### Group Chat

| Operation            | Description              |
| -------------------- | ------------------------ |
| Get Info             | Get group details        |
| Add Participants     | Add members to group     |
| Remove Participants  | Remove members from group|
| Promote Participants | Promote to admin         |
| Demote Participants  | Demote from admin        |
| Get Invite Code      | Get group invite link    |
| Leave                | Leave the group          |
| Revoke Invite        | Invalidate invite code   |
| Set Subject          | Update group name        |
| Set Description      | Update group description |

### Contact

| Operation        | Description              |
| ---------------- | ------------------------ |
| Get Info         | Get contact details      |
| Block            | Block a contact          |
| Unblock          | Unblock a contact        |
| Get About        | Get contact status text  |
| Get Chat         | Get chat for a contact   |
| Get Profile Pic  | Get profile picture URL  |
| Get Common Groups| Get groups in common     |

### Channel (WhatsApp Newsletters)

| Operation      | Description                 |
| -------------- | --------------------------- |
| Get All        | Get all subscribed channels |
| Get Info       | Get channel details         |
| Send Message   | Send message to a channel   |
| Fetch Messages | Load channel messages       |
| Create         | Create a new channel        |
| Subscribe      | Subscribe to a channel      |
| Unsubscribe    | Unsubscribe from a channel  |
| Search         | Search public channels      |
| Delete         | Delete a channel you own    |

## Trigger Events

The **WWebJS API Trigger** node can listen for these events:

| Event                     | Description                               |
| ------------------------- | ----------------------------------------- |
| `message`                 | New incoming message received             |
| `message_create`          | Any message created (including sent)      |
| `message_ack`             | Message status (sent/delivered/read)      |
| `message_revoke_everyone` | Message deleted for everyone              |
| `message_revoke_me`       | Message deleted for me                    |
| `qr`                      | QR code for authentication                |
| `authenticated`           | Client authenticated                      |
| `auth_failure`            | Authentication failed                     |
| `ready`                   | Client ready                              |
| `disconnected`            | Client disconnected                       |
| `change_state`            | Connection state changed                  |
| `group_join`              | Someone joined a group                    |
| `group_leave`             | Someone left a group                      |
| `group_update`            | Group info updated                        |
| `call`                    | Incoming call                             |

### Trigger Filters

Filter incoming events to only trigger workflows when conditions are met:

| Filter                    | Description                                      |
| ------------------------- | ------------------------------------------------ |
| Session ID                | Only events from a specific session              |
| Chat ID Contains          | Filter by phone number or chat type (`@g.us`)    |
| Body Contains             | Filter by message content (e.g., `/command`)     |
| From Me Only              | Only messages sent by you                        |
| Exclude From Me           | Only messages from others                        |
| Groups Only               | Only group chat messages                         |
| Individuals Only          | Only individual chat messages                    |

### Trigger Authentication

Secure your webhook endpoint:

| Method         | Description                                    |
| -------------- | ---------------------------------------------- |
| None           | No authentication (not recommended)            |
| Header Auth    | Validate a custom header token                 |
| HMAC Signature | Validate SHA-256 signature (timing-safe)       |

## Usage Examples

### Send a WhatsApp message

1. Add **WWebJS API** node
2. Select **Client → Send Message**
3. Set **Session ID** = `my-session`
4. Set **Chat ID** = `34612345678@c.us`
5. Set **Content Type** = `Text`
6. Set **Message Text** = `Hello from n8n!`

### Auto-reply to incoming messages

1. Add **WWebJS API Trigger** node with event `message`
2. Set filter: **Exclude From Me** = `true`
3. Add **IF** node to check message content
4. Add **WWebJS API** node with **Client → Send Message**
5. Use expression `{{ $json.data.from }}` for Chat ID

### Send media from URL

1. Add **WWebJS API** node
2. Select **Client → Send Message**
3. Set **Content Type** = `Media (URL)`
4. Set **Content (JSON)**:
```json
{
  "url": "https://example.com/image.jpg",
  "caption": "Check out this image!"
}
```

### Forward messages to another chat

1. Add **WWebJS API Trigger** with filter **Body Contains** = `/forward`
2. Add **WWebJS API** node with **Message → Forward**
3. Use `{{ $json.data.id._serialized }}` for Message ID
4. Set destination Chat ID

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode
npm run dev
```

## Related Projects

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - The underlying WhatsApp Web client library
- [wwebjs-api](https://github.com/avoylenko/wwebjs-api) - REST API server that this node connects to
- [n8n](https://github.com/n8n-io/n8n) - Workflow automation platform

## Disclaimer

This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or affiliates. The official WhatsApp website can be found at https://whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.

Use this software at your own risk. The authors are not responsible for any bans or restrictions imposed by WhatsApp.

## Author

**Victor García Pastor** - [@vgpastor](https://github.com/vgpastor)

## License

Apache-2.0 - See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
