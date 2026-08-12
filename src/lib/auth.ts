import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

export function safeVerifyToken(token: string) {
  try {
    const payload = verifyToken(token);

    if (!payload?.userId || typeof payload.userId !== "string") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
