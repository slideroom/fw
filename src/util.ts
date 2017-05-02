export function kebab(name: string): string {
  return name.replace(/([A-Z])/g, (match, p1) => "-" + p1.toLowerCase()).replace(/^-/, "");
}

export class CloseStack {
  private theCloseStack: Array<() => void> = [];

  constructor() {
    document.addEventListener("keydown", this.handleKeyPress.bind(this));
  }

  public enroll(cb: () => void): { close: () => void, closeAbove: () => void } {
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
    }
  }

  private handleKeyPress(e: KeyboardEvent) {
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
