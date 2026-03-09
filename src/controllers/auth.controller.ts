import type { Request, Response } from "express";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma";
import { Prisma } from "../../prisma/generated/client";


export const register = async (req: Request, res: Response) => {
  const { email, password, first_name, last_name } = req.body;

  let existingUser: Prisma.UserGetPayload<{
    select: {
      id: true;
    };
  }> | null = null
  try {
    existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  } catch (error) {
    return res.status(500).json({ 
      status: "error",
      code: "DB_QUERY_FAILED",
      message: "An unexpected error occured",
    });
  }
 
  if (existingUser) {
    return res.status(409).json({
      status: "error",
      code: "AUTH_EMAIL_ALREADY_EXIST",
      message: "Email is already in use"
    });
  }

  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch(err) {
    return res.status(500).json({
      status: "error",
      code: "AUTH_PASSWORD_HASH_FAILED",
      message: "An unexpected error occurred"
    });
  }

  try {
    await prisma.user.create({
      data: {
        firstName: first_name,
        lastName: last_name,
        email,
        password: hashedPassword,
      },
    });
  } catch(error) {
    return res.status(500).json({ 
      status: "error",
      code: "DB_CREATE_FAILED",
      message: "An unexpected error occured"
    });
  }

  return res.status(201).json({
    status: "success",
    code: "AUTH_USER_REGISTERED",
    message: "User registered successfully",
  });
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  let user: Prisma.UserGetPayload<{
    select: {
      id: true
      firstName: true
      lastName: true
      email: true
      password: true
    }
  }> | null = null
  try {
    user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
      }
    });
  } catch(err) {
    return res.status(500).json({ 
      status: "error",
      code: "DB_QUERY_FAILED",
      message: "An unexpected error occured",
    });
  }

  if (!user) {
    return res.status(400).json({ 
      status: "error", 
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  }

  let isValid: boolean;
  try {
    isValid = await bcrypt.compare(password, user.password);
  } catch (err) {
    return res.status(500).json({ 
      status: "error",
      code: "AUTH_PASSWORD_COMPARE_FAILED",
      message: "An unexpected error occured",
    });
  }

  if (!isValid) {
    return res.status(400).json({ 
      status: "error", 
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Invalid email or password"
    });
  }

 
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      firstName: user.firstName, 
      lastName: user.lastName, 
      email: user.email 
    },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  )

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error", 
      code: "DB_UPDATE_FAILED",
      message: "An unexpected error occured"
    })
  }
 
  return res.json({
    status: "success",
    coce: "AUTH_LOGIN_SUCCESS",
    message: "Login successful",
    access_token: accessToken,
    refresh_token: refreshToken
  });
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refresh_token } = req.body;

  let payload: any;
  try {
    payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET!);
  } catch (err) {
    return res.status(401).json({
      status: "error", 
      code: "AUTH_REFRESH_TOKEN_INVALID_OR_EXPIRED",
      message: "Invalid or expired refresh token"
    })
  }

  let user: Prisma.UserGetPayload<{
    select: {
      id: true
      firstName: true
      lastName: true
      email: true
      refreshToken: true
    }
  }> | null = null
  try {
    user = await prisma.user.findUnique({ 
      where: { id: payload.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        refreshToken: true,
      }
    })
  } catch (error) {
    return res.status(500).json({
      status: "error", 
      code: "DB_QUERY_FAILED",
      message: "An unexpected error occured"
    })
  }

  if (!user || user.refreshToken !== refresh_token) {
    return res.status(401).json({ 
      status: "error", 
      code: "AUTH_REFRESH_TOKEN_REVOKED",
      message: "Refresh token has been revoked" 
    });
  }

  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );

  return res.json({ 
    status: "success",
    code: "AUTH_ACCESS_TOKEN_REFRESHED",
    accessToken 
  });
}