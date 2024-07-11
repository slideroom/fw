export function kebab(name) {
    return name.replace(/([A-Z])/g, (match, p1) => "-" + p1.toLowerCase()).replace(/^-/, "");
}
export class CloseStack {
    theCloseStack = [];
    constructor() {
        document.addEventListener("keydown", this.handleKeyPress.bind(this));
    }
    enroll(cb) {
        const newItem = () => {
            cb();
        };
        this.theCloseStack.push(newItem);
        const close = (add = 0) => {
            const idx = this.theCloseStack.indexOf(newItem);
            if (idx >= 0) {
                for (let i = idx + add; i < this.theCloseStack.length; i++) {
                    this.theCloseStack[i]();
                }
                this.theCloseStack.splice(idx + add);
            }
        };
        return {
            close: () => { close(); },
            closeAbove: () => { close(1); },
        };
    }
    handleKeyPress(e) {
        if (e.keyCode == 27 && this.theCloseStack.length > 0) {
            // just do the top one
            const closer = this.theCloseStack.pop();
            closer();
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
        }
    }
}
//# sourceMappingURL=util.js.map