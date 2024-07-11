export declare function kebab(name: string): string;
export declare class CloseStack {
    private theCloseStack;
    constructor();
    enroll(cb: () => void): {
        close: () => void;
        closeAbove: () => void;
    };
    private handleKeyPress;
}
//# sourceMappingURL=util.d.ts.map