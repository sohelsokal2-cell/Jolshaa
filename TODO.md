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
- [x] Code-reviewed backend smoke checks (static verification, no live DB run):
  - `getMessages`: cursor-only (`before` → `createdAt: { $lt }`), no `skip` mixing, fetched desc + `.reverse()` for correct chronological order.
  - `getConversations`: single query with populated `lastMessage`, no per-conversation N+1.
  - comment restrictions/private/block scenarios enforced identically in `ensureCanLiveComment` (socket) and HTTP controller.
- [x] Code-reviewed socket smoke:
  - `io.use` auth middleware rejects banned/suspended at handshake; `connection` handler double-checks and disconnects as defense-in-depth.
  - `liveComment` calls the same `ensureCanLiveComment` checks (restrictions, post existence, blockedUsers, commentPrivacy) as HTTP.
  - Note: this is static code review, not a live curl/socket-client run against a running server+DB — recommend one live manual pass before public launch to catch runtime-only issues (env config, DB indexes, actual client behavior).
