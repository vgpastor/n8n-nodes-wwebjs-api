# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-23

### Added

- **pairedItem tracking** on all output items — n8n can now correctly link each output back to its source input, enabling expressions like `$('PreviousNode').item.json.field` in downstream nodes
- **Input data forwarding** — the original input item's JSON is merged with the API response so downstream nodes can access both. API response fields take precedence on name collisions
- 17 new tests for the `execute()` method covering pairedItem, input forwarding, multi-item processing, error handling, and edge cases

### Fixed

- Node now works correctly when receiving multiple input items (e.g., sending a message to 5 different contacts in a loop) — previously only the API response was returned without item pairing or input data

## [1.1.0] - 2026-02-19

### Added

- LLM documentation files (`llms.txt`, `llms-full.txt`) with complete API reference for AI-assisted workflow generation
- CI/CD pipeline with GitHub Actions (build, lint, test on Node 20/22/24)
- ESLint 9 flat config with typescript-eslint
- Issue templates, PR template, and repository labels
- Compatibility table for n8n and wwebjs-api versions
- Unit tests for transport utilities (40 tests) and trigger filters (47 tests)

### Changed

- Minimum Node.js version raised to 20.0.0 (Vitest 4 requirement)

## [1.0.0] - 2026-02-02

### Added

- Initial release
- **Action Node** (WWebJS API) with 7 resources and 75 operations:
  - Session: start, stop, restart, terminate, status, QR code
  - Client: send message, get chats/contacts, search, archive, mute, pin, create group
  - Message: reply, react, forward, edit, delete, download media, star
  - Chat: fetch messages, typing/recording state, clear, delete, labels
  - Group Chat: add/remove/promote/demote participants, invite, set subject/description
  - Contact: info, block/unblock, about, profile pic, common groups
  - Channel: list, info, send message, subscribe/unsubscribe, create, search, delete
- **Trigger Node** (WWebJS API Trigger) with webhook support for 20 WhatsApp events
  - Authentication: None, Header Auth, HMAC-SHA256 signature validation
  - Filters: session ID, chat ID, message body, from me, groups/individuals
- Support for 6 content types: text, media (base64), media (URL), location, contact (vCard), poll
- Input validation for all WhatsApp ID formats (chat, contact, group, channel, phone, session)
- Credentials with base URL, API key, and default session ID
