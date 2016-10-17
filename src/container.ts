export interface makerOf<T> {
  new(...args): T;
}

export interface ContainerOverrider {
  use<T>(c: makerOf<T>, instance: T);
}

class ContainerOverride {
  private overrideMap = new Map();

  use<T>(c: makerOf<T>, instance: T) {
    this.overrideMap.set(c, instance);
  }

  get<T>(c: makerOf<T>): T {
    return this.overrideMap.get(c) as T;
  }
}

export class Container {
  protected instances = new Map();

  private getServiceTypes<T>(t: makerOf<T>): makerOf<T>[] {
    return (<any>Reflect).getMetadata("design:paramtypes", t) || [];
  }

  public get<T>(t: makerOf<T>, setInstance = true, override?: (o: ContainerOverrider) => void): T {
    if (this.instances.get(t))
      return this.instances.get(t) as T;

    const overrider = new ContainerOverride();
    if (override) {
      override(overrider);
    }

    const injectedTypes = this.getServiceTypes(t).map(tt => {
      const overrideType = overrider.get(tt);
      if (overrideType) return overrideType;

      return this.get(tt);
    });

    const instance = new (Function.prototype.bind.apply(t, [null, ...injectedTypes]));

    if (setInstance)
      this.use(t, instance);

    return instance;
  }

  protected has(t: makerOf<any>): boolean {
    return this.instances.get(t) != null;
  }

  public use<T>(key: makerOf<T>, instance: T) {
    this.instances.set(key, instance);
  }
}

export const ContainerInstance = new Container();
