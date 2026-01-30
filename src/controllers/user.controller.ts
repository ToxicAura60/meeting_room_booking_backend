import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

export const createUser = async (req: Request, res: Response) => {
  const { email, password, first_name, last_name, role } = req.body;

  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch(err) {
    return res.status(500).json({
      status: "error",
      message: "Failed to hash password."
    });
  }

  try {
    await prisma.user.create({
      data: {
        firstName: first_name,
        lastName: last_name,
        email,
        password: hashedPassword,
        ...(role !== undefined && { role }),
      },
    });
  } catch(error) {
    return res.status(500).json({ 
      status: "error",
      message: "Failed to create new user."
    });
  }

  return res.status(201).json({
    status: "success",
    message: "User created successfully",
  });
}
