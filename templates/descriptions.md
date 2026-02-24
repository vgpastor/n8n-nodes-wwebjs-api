# Workflow Template Descriptions for n8n Creator Portal

Copy each description into the Creator Dashboard "Description" field.

---

## Template 1: Auto-reply to incoming WhatsApp messages with WWebJS API

**⚠️ This workflow uses a community node (`n8n-nodes-wwebjs-api`) and is only compatible with self-hosted n8n.**

![workflow-preview](REPLACE_WITH_SCREENSHOT_URL)

## Who is this for

Customer-facing teams, small businesses, and solopreneurs who want instant auto-replies on WhatsApp without building a full chatbot. Ideal for handling after-hours messages or providing quick self-service options.

## How it works

1. The **WWebJS API Trigger** receives a webhook every time a new WhatsApp message arrives (own messages and group chats are filtered out).
2. A **Set** node extracts the sender name, chat ID, message body, and session ID into clean fields.
3. A **Switch** node routes the message by keyword — greetings (`hi`, `hello`, `hey`), help requests (`help`, `support`), or everything else.
4. Each branch sends a different auto-reply through the **WWebJS API** send-message action.

## How to set up

1. Install the `n8n-nodes-wwebjs-api` community node on your self-hosted n8n instance.
2. Deploy a [wwebjs-api](https://github.com/avoylenko/wwebjs-api) server and start a WhatsApp session (scan the QR code).
3. Add your WWebJS API credentials in n8n (base URL of your wwebjs-api server + optional API key).
4. In your wwebjs-api configuration, set the webhook URL to the trigger URL shown in the WWebJS API Trigger node.
5. Activate the workflow and send a test message from another phone.

## Requirements

- Self-hosted n8n (v1.0.0+)
- A running [wwebjs-api](https://github.com/avoylenko/wwebjs-api) instance (v1.34+)
- A WhatsApp account with an active session

## How to customize the workflow

- Edit the reply messages in the three "Reply" nodes to match your brand voice.
- Add more keyword branches in the Switch node (e.g., `pricing`, `hours`, `location`).
- Connect an **AI Agent** or **OpenAI** node to generate dynamic replies instead of static text.
- Add a **Google Sheets** node after each reply to log conversations.

---

## Template 2: Log incoming WhatsApp messages to Google Sheets with WWebJS API

**⚠️ This workflow uses a community node (`n8n-nodes-wwebjs-api`) and is only compatible with self-hosted n8n.**

![workflow-preview](REPLACE_WITH_SCREENSHOT_URL)

## Who is this for

Teams that need a searchable log of all incoming WhatsApp messages — for compliance, CRM enrichment, lead tracking, or customer support analytics.

## How it works

1. The **WWebJS API Trigger** fires on every incoming WhatsApp message (your own outgoing messages are excluded).
2. A **Set** node extracts and normalizes the key fields: timestamp, sender number, sender name, chat ID, message body, message type, media flag, and whether it is a group message.
3. The **Google Sheets** node appends a new row for each message to your chosen spreadsheet.

## How to set up

1. Install the `n8n-nodes-wwebjs-api` community node on your self-hosted n8n instance.
2. Deploy a [wwebjs-api](https://github.com/avoylenko/wwebjs-api) server and start a WhatsApp session.
3. Create a Google Sheet with these exact column headers: `timestamp`, `from`, `senderName`, `chatId`, `messageBody`, `messageType`, `hasMedia`, `isGroup`, `sessionId`.
4. Connect your Google Sheets OAuth2 credentials and select the spreadsheet + sheet in the "Append to Google Sheets" node.
5. Set the wwebjs-api webhook URL to point to this trigger, then activate the workflow.

## Requirements

- Self-hosted n8n (v1.0.0+)
- A running [wwebjs-api](https://github.com/avoylenko/wwebjs-api) instance (v1.34+)
- A Google account with Sheets access
- A WhatsApp account with an active session

## How to customize the workflow

- Add a **Filter** node before the sheet to log only group messages, only individual chats, or messages containing a specific keyword.
- Add a **Slack** or **Email** node after the sheet to get real-time notifications about new messages.
- Use **Airtable** or **Notion** instead of Google Sheets as your logging destination.
- Add a **WWebJS API → Send Message** node to auto-reply with a confirmation after logging.

---

## Template 3: Monitor WhatsApp session status and send Slack alerts with WWebJS API

**⚠️ This workflow uses a community node (`n8n-nodes-wwebjs-api`) and is only compatible with self-hosted n8n.**

![workflow-preview](REPLACE_WITH_SCREENSHOT_URL)

## Who is this for

DevOps engineers, automation managers, and anyone running WhatsApp bots in production who needs uptime monitoring. Get notified the moment a session drops so you can reconnect before users are affected.

## How it works

1. A **Schedule Trigger** runs every 5 minutes (configurable).
2. The **WWebJS API** node fetches all sessions from your wwebjs-api server along with their current status.
3. An **If** node checks whether each session is in `WORKING` state.
4. Sessions that are **not** healthy (e.g., `STOPPED`, `SCAN_QR_CODE`, `FAILED`) trigger a **Slack** message to your monitoring channel with the session ID and status.
5. Healthy sessions are silently passed to a No-Op node.

## How to set up

1. Install the `n8n-nodes-wwebjs-api` community node on your self-hosted n8n instance.
2. Deploy a [wwebjs-api](https://github.com/avoylenko/wwebjs-api) server with at least one active session.
3. Connect your Slack OAuth credentials and paste the target channel ID into the "Send Slack Alert" node.
4. Optionally adjust the schedule interval (default: every 5 minutes).
5. Activate the workflow.

## Requirements

- Self-hosted n8n (v1.0.0+)
- A running [wwebjs-api](https://github.com/avoylenko/wwebjs-api) instance (v1.34+)
- A Slack workspace with bot permissions to post messages

## How to customize the workflow

- Replace Slack with **Email**, **Telegram**, or **Discord** for alerts on a different platform.
- Add a **WWebJS API → Start Session** node after the Slack alert to automatically restart stopped sessions.
- Use a **Filter** node to monitor only specific session IDs.
- Reduce the schedule interval to 1 minute for critical production environments.
