const _WebSocket = window.WebSocket;

class WebSocketServer {
    private ws: WebSocket;
    private connectedClients: Set<WebSocket> = new Set();
    private onmessageHandler: ((event: MessageEvent) => void) | null = null;
    private messageListeners: Set<((event: MessageEvent) => void)> = new Set();

    constructor(url: string) {
        this.ws = new _WebSocket(url);

        this.connectedClients.add(this.ws);


        return new Proxy(this, {
            get: (target, prop) => {
                if (prop === 'onmessage') {
                    return this.onmessageHandler;
                }

                if (prop === 'onopen') {
                    return (this.ws as any).onopen;
                }

                if (prop === 'addEventListener') {
                    return (type: string, listener: EventListener, options?: any) => {
                        if (type === 'message') {
                            this.messageListeners.add(listener as any);
                        } else {
                            (this.ws as any).addEventListener(type, listener, options);
                        }
                    };
                }


                if (prop in target) {
                    const value = (target as any)[prop];
                    if (typeof value === 'function') {
                        return value.bind(target);
                    }
                    return value;
                }

                const value = (this.ws as any)[prop];
                if (typeof value === 'function') {
                    return value.bind(this.ws);
                }
                return value;
            },
            set: (target, prop, value) => {
                if (prop === 'onmessage') {
                    this.onmessageHandler = value;
                    return true;
                }

                if (prop in target) {
                    (target as any)[prop] = value;
                } else {
                    (this.ws as any)[prop] = value;
                }
                return true;
            },
        }) as any;
    }

    broadcast(message: string) {
        const fakeEvent = new MessageEvent('message', { data: message });

        if (this.onmessageHandler) {
            this.onmessageHandler(fakeEvent);
        }

        this.messageListeners.forEach(listener => {
            listener(fakeEvent);
        });
    }
}

(globalThis as any).WebSocketServer = WebSocketServer



window.WebSocket = new Proxy(_WebSocket, {
    construct(target: typeof WebSocket, args: ConstructorParameters<typeof WebSocket>): object {
        return new WebSocketServer(args[0] as string);
    },
}) as any as typeof WebSocket;