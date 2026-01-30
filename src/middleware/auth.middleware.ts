import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { Prisma } from "../../prisma/generated/client";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      status: "error", 
      message: "Authorization header must be in format: Bearer <token>"
    });
  }
  
  const token = authHeader.split(" ")[1];
    if (!token || token.trim() === "") {
    return res.status(401).json({
      status: "error",
      message: "Token is missing"
    })
  }

  let decoded: { userId: number, email: string }
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number, email: string }
  } catch (err) {
    return res.status(401).json({
      status: "error", 
      message: "Invalid token" 
    })
  }

  let user: Prisma.UserGetPayload<{
    select: {
      id: true;
      firstName: true;
      lastName: true;
      email: true;
      role: true;
    };
  }> | null
  try {
    user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
    });
  } catch (err) {
    return res.status(500).json({ 
      status: "error",
      message: "something went wrong"
    });
  }
  if (!user) {
    return res.status(401).json({ 
      status: "error",
      message: "user not found"
    })
  }

  req.user = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role
  }

  next();
}
