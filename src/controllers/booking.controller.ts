import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "../../prisma/generated/client";

export const createBooking = async (req: Request, res: Response) => {
  const { name, meeting_room_id, start_time, end_time, purpose } = req.body;

  try {
    await prisma.bookingHistory.create({
      data: {
        name: name,
        purpose: purpose,
        userId: req.user!.id,
        meetingRoomId: meeting_room_id,
        startTime: new Date(start_time),
        endTime: new Date(end_time),
      },
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });

  }

  return res.json({
    status: "success",
    message: "Booking created successfully",
  });
};

export const listBookings = async (req: Request, res: Response) => {
  let bookings: Prisma.BookingHistoryGetPayload<{
    select: {
      id: true;
      startTime: true;
      endTime: true;
      meetingRoomId: true;
    };
  }>[] = []

  try {
    bookings = await prisma.bookingHistory.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        meetingRoomId: true,
      },
    });

  } catch {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });

  }

  return res.json({
    status: "success",
    data: bookings.map((booking) => ({
      id: booking.id,
      meeting_room_id: booking.meetingRoomId,
      start_time: booking.startTime,
      end_time: booking.endTime,
    })),
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
      message: "Internal server error",
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

export const updateBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { start_time, end_time, meeting_room_id, purpose, name } = req.body;

  try {
    await prisma.bookingHistory.update({
      where: {
        id: Number(id),
        userId: req.user!.id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(start_time !== undefined && { startTime: new Date(start_time) }),
        ...(end_time !== undefined && { endTime: new Date(end_time) }),
        ...(meeting_room_id !== undefined && { meetingRoomId: meeting_room_id }),
        ...(purpose !== undefined && { purpose }),
      },
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }

  return res.json({
    status: "success",
    message: "Booking updated successfully",
  });
};


export const deleteBooking = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.bookingHistory.delete({
      where: {
        userId: req.user!.id,
        id: Number(id),
      },
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });

  }

  return res.json({
    status: "success",
    message: "Booking deleted successfully",
  });
};


