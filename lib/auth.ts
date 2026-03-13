import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

export function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d"
  })
}

export function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    return payload.userId
  } catch {
    return null
  }
}

export function getUserId(req: Request): string | null {
    const auth = req.headers.get("authorization")
  
    if (!auth) return null
  
    const token = auth.replace("Bearer ", "")
  
    return verifyToken(token)
}