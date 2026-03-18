export class PaywallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaywallError";
  }
}

