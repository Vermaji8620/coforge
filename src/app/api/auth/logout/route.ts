/**
 * Authentication Logout API endpoint.
 * Clears the HTTP-only JWT session cookie from the client,
 * terminating the authenticated user session across all protected routes.
 */
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "User signed out successfully.",
  });

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
