import jwt from "jsonwebtoken";

export const testUserId = "11111111-1111-4111-8111-111111111111";

export function authHeaders(userId = testUserId) {
  const token = jwt.sign({ sub: userId, email: "tester@example.com" }, process.env.JWT_SECRET);
  return {
    Authorization: `Bearer ${token}`
  };
}
