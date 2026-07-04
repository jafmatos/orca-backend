export class Otp {
  public static generate(): string {
    if (process.env.NODE_ENV === 'testing') return '000000';

    return Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
  }
}
