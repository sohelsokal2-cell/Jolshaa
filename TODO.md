# Fix scope (confirmed): security-critical + pagination correctness + performance

## Step 1 (Backend - socket security)
- [x] Update `backend/socket.js` auth middleware to enforce:
  - banned / suspended checks after JWT verify.
- [x] Add basic socket rate limiting for:
  - typing
  - sendMessage
  - sendNotification
  - liveComment

## Step 2 (Backend - socket authorization/consistency)
- [x] Harden `sendNotification`:
  - add whitelist for `type`
  - validate required ids presence when applicable (as best-effort based on existing models/fields)
- [x] Fix conversation access casting:
  - ensure `ensureConversationAccess` query uses ObjectId safely.

## Step 3 (Backend - liveComment parity)
- [x] Update `backend/socket.js` `liveComment` to apply the same critical checks as HTTP:
  - comment restrictions
  - post exists
  - blockedUsers checks
  - post privacy / commentPrivacy checks
  - reject missing/invalid text

## Step 4 (Backend - pagination correctness)
- [x] Update `backend/controllers/conversationController.js` `getMessages`:
  - remove/avoid mixing cursor (`before`) with `skip`
  - return messages in correct chronological order.

## Step 5 (Backend - performance)
- [x] Update `backend/controllers/conversationController.js` `getConversations` to remove N+1 lastMessage queries (batch/aggregate approach).

## Step 6 (Verification)
- [ ] Run backend smoke checks (manual/curl):
  - auth/me
  - create/list conversations
  - get messages with before cursor
  - comment restrictions/private/block scenarios
- [ ] Run socket smoke:
  - banned/suspended user cannot connect or cannot execute events
  - liveComment enforces same checks
