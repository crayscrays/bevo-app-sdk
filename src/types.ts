// ── BevoContext (injected by the Bevo Flutter app) ────────────────────────────

/**
 * Injected into `window.BevoContext` by the Bevo host app immediately when
 * the mini-app page finishes loading. Balances and agent fields are null on
 * the first injection and populated ~1-2 s later; listen for
 * `bevo:context-updated` to react to the updated values.
 */
export interface BevoContext {
  // Auth
  authToken: string;
  apiBase: string;

  // User profile
  principalId: string;
  walletAddress: string;
  displayName: string;
  username: string;
  avatar: string;

  // Wallet balances — null until fetched from the chain
  balances: {
    eth: number | null;
    usdc: number | null;
    usdt: number | null;
  };

  // Hosted agent wallet — null until fetched
  agentWalletAddress: string | null;
  agentPrincipalId: string | null;
}

// ── Convenience shapes ────────────────────────────────────────────────────────

export interface UserProfile {
  principalId: string;
  walletAddress: string;
  displayName: string;
  username: string;
  avatar: string;
}

export interface WalletBalances {
  eth: number | null;
  usdc: number | null;
  usdt: number | null;
}

export interface AgentInfo {
  walletAddress: string;
  principalId: string;
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface BevoConversation {
  id: string;
  peerPrincipalId: string;
  peerDisplayName: string;
  peerUsername: string;
  peerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface BevoMessage {
  id: number | string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface BevoGroup {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  memberCount: number;
  description: string;
}

export interface BevoApp {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  installCount: number;
  isVerified: boolean;
  iconUrl: string | null;
  miniappEnabled: boolean;
  entryUrl: string | null;
  permissions: string[];
}

// ── Permission scopes (declared by apps at install time) ─────────────────────

export type BevoPermission =
  | "wallet.read"
  | "wallet.send"
  | "wallet.sign"
  | "user.read"
  | "contacts.read"
  | "groups.read"
  | "chat.write"
  | "bots.manage";

// ── Global window extension ───────────────────────────────────────────────────

declare global {
  interface Window {
    BevoContext?: BevoContext;
  }
  interface WindowEventMap {
    "bevo:context-updated": CustomEvent<BevoContext>;
  }
}
