const _WebSocket = window.WebSocket;

class WebSocketServer {
    private ws: WebSocket;
    private onmessageHandler: ((event: MessageEvent) => void) | null = null;
    private messageListeners: Set<Function> = new Set();

    constructor(url: string) {
        this.ws = new _WebSocket(url);

        return new Proxy(this.ws, {
            get: (target, prop) => {
                if (prop === 'onmessage') return this.onmessageHandler;
                if (prop === 'broadcast') return (msg: string) => this.broadcast(msg);
                if (prop === 'addEventListener') {
                    return (type: string, listener: EventListener) => {
                        if (type === 'message') this.messageListeners.add(listener as any);
                        else (target as any).addEventListener(type, listener);
                    };
                }
                const val = (target as any)[prop];
                return typeof val === 'function' ? val.bind(target) : val;
            },
            set: (target, prop, value) => {
                if (prop === 'onmessage') {
                    this.onmessageHandler = value;
                    return true;
                }
                (target as any)[prop] = value;
                return true;
            },
        }) as any;
    }

    private broadcast(message: string) {
        const event = new MessageEvent('message', { data: message });
        this.onmessageHandler?.(event);
        this.messageListeners.forEach(fn => (fn as any)(event));
    }
}

(window as any).WebSocketServer = WebSocketServer

// window.WebSocket = new Proxy(_WebSocket, {
//     construct: (target, args) => new WebSocketServer(args[0] as string),
// }) as any;