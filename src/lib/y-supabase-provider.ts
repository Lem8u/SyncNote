import * as Y from "yjs";
import { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { SyncStatus } from "../types/auth";

// Utilities for Uint8Array <-> Base64 conversion
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export interface SupabaseProviderOptions {
  channelName?: string;
  onStatusChange?: (status: SyncStatus) => void;
  onPeersChange?: (peersCount: number) => void;
}

export class SupabaseYjsProvider {
  public doc: Y.Doc;
  public supabase: SupabaseClient | null = null;
  public channel: RealtimeChannel | null = null;
  public status: SyncStatus = "offline";
  public peersCount: number = 1;
  public clientId: string;

  private channelName: string;
  private onStatusChange?: (status: SyncStatus) => void;
  private onPeersChange?: (peersCount: number) => void;
  private updateHandler: (update: Uint8Array, origin: unknown) => void;

  constructor(doc: Y.Doc, options: SupabaseProviderOptions = {}) {
    this.doc = doc;
    this.channelName = options.channelName || "syncnote-workspace-default";
    this.onStatusChange = options.onStatusChange;
    this.onPeersChange = options.onPeersChange;
    this.clientId = `client-${Math.random().toString(36).substring(2, 9)}`;

    this.updateHandler = (update: Uint8Array, origin: unknown) => {
      // Don't broadcast updates that originated from the remote Supabase provider
      if (origin === this) return;

      if (this.channel && this.status === "synced") {
        const base64Update = uint8ArrayToBase64(update);
        this.channel.send({
          type: "broadcast",
          event: "yjs-update",
          payload: {
            update: base64Update,
            sender: this.clientId,
          },
        }).catch((err) => {
          console.warn("Failed to broadcast Yjs update:", err);
        });
      }
    };

    this.doc.on("update", this.updateHandler);
  }

  private setStatus(status: SyncStatus) {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  private setPeersCount(count: number) {
    this.peersCount = count;
    if (this.onPeersChange) {
      this.onPeersChange(count);
    }
  }

  public connect(client: SupabaseClient, workspaceId?: string) {
    if (workspaceId) {
      this.channelName = `syncnote-workspace-${workspaceId}`;
    }

    this.disconnect();
    this.supabase = client;
    this.setStatus("syncing");

    try {
      const channel = this.supabase.channel(this.channelName, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: this.clientId },
        },
      });

      // 1. Listen for peer Yjs updates
      channel.on("broadcast", { event: "yjs-update" }, ({ payload }) => {
        if (!payload || payload.sender === this.clientId) return;
        try {
          const update = base64ToUint8Array(payload.update);
          Y.applyUpdate(this.doc, update, this);
        } catch (err) {
          console.error("Error applying remote Yjs update:", err);
        }
      });

      // 2. Sync protocol - Step 1 (State Vector request)
      channel.on("broadcast", { event: "yjs-sync-step-1" }, ({ payload }) => {
        if (!payload || payload.sender === this.clientId) return;
        try {
          const remoteVector = base64ToUint8Array(payload.vector);
          // Calculate diff for what remote peer is missing
          const diffUpdate = Y.encodeStateAsUpdate(this.doc, remoteVector);
          if (diffUpdate.length > 0) {
            channel.send({
              type: "broadcast",
              event: "yjs-sync-step-2",
              payload: {
                update: uint8ArrayToBase64(diffUpdate),
                target: payload.sender,
                sender: this.clientId,
              },
            });
          }
        } catch (err) {
          console.error("Error in sync-step-1 exchange:", err);
        }
      });

      // 3. Sync protocol - Step 2 (State Vector response diff)
      channel.on("broadcast", { event: "yjs-sync-step-2" }, ({ payload }) => {
        if (!payload || payload.sender === this.clientId) return;
        // If target specified and not us, ignore
        if (payload.target && payload.target !== this.clientId) return;
        try {
          const update = base64ToUint8Array(payload.update);
          Y.applyUpdate(this.doc, update, this);
        } catch (err) {
          console.error("Error in sync-step-2 exchange:", err);
        }
      });

      // 4. Presence / Peers count tracking
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeCount = Object.keys(state).length || 1;
        this.setPeersCount(activeCount);
      });

      // Subscribe to the channel
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.setStatus("synced");
          // Track presence
          channel.track({
            clientId: this.clientId,
            onlineAt: new Date().toISOString(),
          });

          // Broadcast initial sync vector to all active peers
          const localVector = Y.encodeStateVector(this.doc);
          channel.send({
            type: "broadcast",
            event: "yjs-sync-step-1",
            payload: {
              vector: uint8ArrayToBase64(localVector),
              sender: this.clientId,
            },
          });
        } else if (status === "CLOSED" || status === "TIMED_OUT") {
          this.setStatus("offline");
        } else if (status === "CHANNEL_ERROR") {
          this.setStatus("error");
        }
      });

      this.channel = channel;
    } catch (err) {
      console.error("Failed to connect Supabase Yjs provider:", err);
      this.setStatus("error");
    }
  }

  public disconnect() {
    if (this.channel && this.supabase) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.setStatus("offline");
    this.setPeersCount(1);
  }

  public destroy() {
    this.disconnect();
    this.doc.off("update", this.updateHandler);
  }
}

