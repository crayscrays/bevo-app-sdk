# @bevo/app-sdk

Build mini-apps that run inside the Bevo mobile app. Access the signed-in user's profile, wallet balances, and agent wallet — all injected by the Bevo host app into `window.BevoContext`.

## Installation

```bash
npm install @bevo/app-sdk
```

## Quick start

```ts
import { BevoMiniApp } from "@bevo/app-sdk";

// Initialize once at app startup
const bevo = BevoMiniApp.init();

// User profile — available immediately
console.log(bevo.user.displayName); // "Alice"
console.log(bevo.user.walletAddress); // "0x..."

// Balances — null on first load, populated ~1-2s later
console.log(bevo.balances); // { eth: null, usdc: null, usdt: null }

// Wait for balances to arrive
const balances = await bevo.waitForBalances();
console.log(`ETH: ${balances.eth}, USDC: ${balances.usdc}`);

// Agent wallet — also populated async
const agent = await bevo.waitForAgent();
console.log(`Agent wallet: ${agent.walletAddress}`);

// React to updates (balances + agent arrive ~1-2s after page load)
bevo.onUpdate((ctx) => {
  renderBalances(ctx.balances);
});
```

## Local development

During development outside the Bevo app, use `BevoMiniApp.mock()`:

```ts
const bevo = BevoMiniApp.isInsideBevo
  ? BevoMiniApp.init()
  : BevoMiniApp.mock({
      displayName: "Dev Alice",
      walletAddress: "0xabc123",
      balances: { eth: 0.5, usdc: 100, usdt: 0 },
    });
```

## Calling the Bevo API

`bevo.api` is a pre-authenticated client. Use it to interact with any Bevo endpoint:

```ts
// Get user's DM conversations
const conversations = await bevo.api.getConversations();

// Send a DM
const convId = await bevo.api.createOrGetConversation(peerPrincipalId);
await bevo.api.sendMessage(convId, "Hello from my mini-app!");

// Get the user's groups
const groups = await bevo.api.getMyGroups();

// Request a token transfer (requires wallet.send permission)
const tx = await bevo.api.transferTokens({
  toUserHandle: "bob",
  amountEth: 5.0,
  token: "USDC",
});
console.log(`Tx hash: ${tx.txHash}`);

// Raw fetch for any endpoint
const data = await bevo.api.request<MyType>("/api/some/endpoint", {
  method: "POST",
  body: JSON.stringify({ foo: "bar" }),
});
```

## BevoContext shape

The host app injects `window.BevoContext` with the following fields:

```ts
interface BevoContext {
  // Auth (for calling the Bevo backend directly)
  authToken: string;      // Privy JWT — use as Authorization: Bearer <token>
  apiBase: string;        // Backend base URL, e.g. https://api.bevo.app

  // User identity
  principalId: string;    // User's UUID on Bevo
  walletAddress: string;  // User's EVM wallet (0x...)
  displayName: string;
  username: string;
  avatar: string;

  // Wallet balances — null until fetched from chain (~1-2s after page load)
  balances: {
    eth: number | null;
    usdc: number | null;
    usdt: number | null;
  };

  // Hosted agent wallet — null until fetched
  agentWalletAddress: string | null;
  agentPrincipalId: string | null;
}
```

Balances and agent fields arrive asynchronously. Subscribe with `bevo.onUpdate()` or await `bevo.waitForBalances()` / `bevo.waitForAgent()`.

## React example

```tsx
import { useEffect, useState } from "react";
import { BevoMiniApp, type WalletBalances } from "@bevo/app-sdk";

const bevo = BevoMiniApp.isInsideBevo ? BevoMiniApp.init() : BevoMiniApp.mock();

function App() {
  const [user] = useState(bevo.user);
  const [balances, setBalances] = useState<WalletBalances>(bevo.balances);

  useEffect(() => {
    return bevo.onUpdate((ctx) => setBalances(ctx.balances));
  }, []);

  return (
    <div>
      <h1>Welcome, {user.displayName}</h1>
      {balances.usdc !== null ? (
        <p>USDC Balance: {balances.usdc.toFixed(2)}</p>
      ) : (
        <p>Loading balances...</p>
      )}
    </div>
  );
}
```

## API reference

### `BevoMiniApp.init()`

Reads `window.BevoContext` and returns a `BevoMiniApp` instance. Throws if not inside the Bevo host app — use `BevoMiniApp.isInsideBevo` to check first.

### `BevoMiniApp.mock(overrides?)`

Returns a `BevoMiniApp` with mock context for local development.

### `bevo.user` → `UserProfile`

```ts
{ principalId, walletAddress, displayName, username, avatar }
```

### `bevo.balances` → `WalletBalances`

```ts
{ eth: number | null, usdc: number | null, usdt: number | null }
```

### `bevo.agent` → `AgentInfo | null`

```ts
{ walletAddress: string, principalId: string }
```

### `bevo.onUpdate(callback)` → `() => void`

Subscribe to context updates dispatched as `bevo:context-updated` CustomEvents. Returns an unsubscribe function.

### `bevo.waitForBalances(timeoutMs?)` → `Promise<WalletBalances>`

Resolves when balances are populated. Rejects after `timeoutMs` (default 10 s).

### `bevo.waitForAgent(timeoutMs?)` → `Promise<AgentInfo>`

Resolves when the agent wallet is available. Rejects after `timeoutMs` (default 10 s).

### `bevo.api` — `BevoApiClient`

| Method | Description |
|--------|-------------|
| `request<T>(path, init?)` | Authenticated fetch to any Bevo endpoint |
| `getMyProfile()` | `GET /api/users/me` |
| `updateProfile(data)` | `PATCH /api/users/profile` |
| `searchUsers(query)` | `GET /api/users/search?q=` |
| `getConversations()` | `GET /api/chat/conversations` |
| `createOrGetConversation(peerId)` | `POST /api/chat/conversations` |
| `getMessages(convId, after?)` | `GET /api/chat/conversations/:id/messages` |
| `sendMessage(convId, content)` | `POST /api/chat/conversations/:id/messages` |
| `markRead(convId)` | `POST /api/chat/conversations/:id/read` |
| `getMyGroups()` | `GET /api/groups/by-principal/:principalId` |
| `searchGroups(query)` | `GET /api/groups/search?q=` |
| `getApps(params?)` | `GET /api/apps` |
| `getApp(slug)` | `GET /api/apps/:slug` |
| `transferTokens(params)` | `POST /api/wallet/transfer` — requires `wallet.send` permission |

## Registering your mini-app on Bevo

1. Log in to the [Bevo Developer Portal](https://devportal.bevo.app).
2. Click **New App** → fill in slug, name, description, and category.
3. Enable **Mini-app** and set `Entry URL` to your app's URL (must be `https://`).
4. Add the permissions your app needs under **Permissions**.
5. Submit for review.

Users will see a permission prompt before your mini-app opens. The granted permissions are stored server-side and available via `GET /api/apps/:slug`.

## Well-known manifest (optional)

Host a `/.well-known/bevo.json` at your app's root for auto-discovery in the devportal:

```json
{
  "app": {
    "name": "My Mini-App",
    "description": "Does useful things inside Bevo",
    "iconUrl": "https://my-app.com/icon.png",
    "permissions": ["user.read", "wallet.read"],
    "category": "defi"
  }
}
```
