"use strict";

// src/index.ts
var _WebSocket = window.WebSocket;
var WebSocketServer = class {
  ws;
  connectedClients = /* @__PURE__ */ new Set();
  onmessageHandler = null;
  messageListeners = /* @__PURE__ */ new Set();
  constructor(url) {
    this.ws = new _WebSocket(url);
    this.connectedClients.add(this.ws);
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === "onmessage") {
          return this.onmessageHandler;
        }
        if (prop === "onopen") {
          return this.ws.onopen;
        }
        if (prop === "addEventListener") {
          return (type, listener, options) => {
            if (type === "message") {
              this.messageListeners.add(listener);
            } else {
              this.ws.addEventListener(type, listener, options);
            }
          };
        }
        if (prop in target) {
          const value2 = target[prop];
          if (typeof value2 === "function") {
            return value2.bind(target);
          }
          return value2;
        }
        const value = this.ws[prop];
        if (typeof value === "function") {
          return value.bind(this.ws);
        }
        return value;
      },
      set: (target, prop, value) => {
        if (prop === "onmessage") {
          this.onmessageHandler = value;
          return true;
        }
        if (prop in target) {
          target[prop] = value;
        } else {
          this.ws[prop] = value;
        }
        return true;
      }
    });
  }
  broadcast(message) {
    const fakeEvent = new MessageEvent("message", { data: message });
    if (this.onmessageHandler) {
      this.onmessageHandler(fakeEvent);
    }
    this.messageListeners.forEach((listener) => {
      listener(fakeEvent);
    });
  }
};
globalThis.WebSocketServer = WebSocketServer;
window.WebSocket = new Proxy(_WebSocket, {
  construct(target, args) {
    return new WebSocketServer(args[0]);
  }
});
