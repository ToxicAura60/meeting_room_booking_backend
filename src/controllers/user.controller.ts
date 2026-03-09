import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import type { Prisma } from "../../prisma/generated/client";

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

export const listUserBookings = async (req: Request, res: Response) => {
  let bookings: Prisma.BookingHistoryGetPayload<{
    select: {
      id: true;
      name: true;
      startTime: true;
      endTime: true;
      purpose: true;
      meetingRoom: {
        select: { name: true };
      };
    };
  }>[] = []

  try {
    bookings = await prisma.bookingHistory.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        startTime: true,
        purpose: true,
        endTime: true,
        meetingRoom: {
          select: {
            name: true,
          },
        },
      },
    });

  } catch {
    return res.status(500).json({
      status: "error",
      code: "DB_QUERY_FAILED",
      message: "An unexpected error occured",
    });

  }

  return res.json({
    status: "success",
    data: bookings.map((booking) => ({
      id: booking.id,
      name: booking.name,
      meeting_room_name: booking.meetingRoom.name,
      purpose: booking.purpose,
      start_time: booking.startTime,
      end_time: booking.endTime,
    })),
   });
};