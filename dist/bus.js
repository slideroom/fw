export class Bus {
    listeners = new Map();
    subscribe(type, cb) {
        let listeners = this.listeners.get(type);
        if (listeners == null) {
            listeners = [];
            this.listeners.set(type, listeners);
        }
        listeners.push(cb);
        return {
            dispose: () => {
                let listeners = this.listeners.get(type);
                if (listeners == null)
                    return;
                const idx = listeners.indexOf(cb);
                if (idx > -1) {
                    listeners.splice(idx, 1);
                }
            },
        };
    }
    publish(message) {
        let listeners = this.listeners.get(message.constructor);
        if (listeners != null) {
            listeners.forEach(l => l(message));
        }
    }
}
//# sourceMappingURL=bus.js.map