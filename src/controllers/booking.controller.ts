import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "../../prisma/generated/client";

export const createBooking = async (req: Request, res: Response) => {
  const { name, meeting_room_id, start_time, end_time, purpose } = req.body;

  if (new Date(start_time) >= new Date(end_time)) {
    return res.status(400).json({
      status: "error",
      code: "BOOKING_START_TIME_GREATER_THAN_END_TIME",
      message: "End time must be later than start time"
    })
  }

  let meetingRoom: Prisma.MeetingRoomGetPayload<{
    select: {
      id: true;
    };
  }> | null = null

  try {
    meetingRoom = await prisma.meetingRoom.findUnique({
      where: { id: Number(meeting_room_id) },
      select: { id: true },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      code: "DB_QUERY_FAILED",
      message: "An unexpected error occured",
    });
  } 

  if (!meetingRoom) {
    return res.status(404).json({
      status: "error",
      code: "BOOKING_MEETING_ROOM_NOT_FOUND",
      message: "Meeting room not found",
    });
  }

  try {
    await prisma.bookingHistory.create({
      data: {
        name: name,
        purpose: purpose,
        userId: req.user!.id,
        meetingRoomId: meetingRoom.id,
        startTime: new Date(start_time),
        endTime: new Date(end_time),
      },
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      code: "DB_CREATE_FAILED",
      message: "An unexpected error occured",
    });
  }

  return res.status(201).json({
    status: "success",
    code: "BOOKING_CREATED",
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
      code: "DB_QUERY_FAILED",
      message: "An unexpected error occured",
    });

  }

  return res.json({
    status: "success",
    code: "BOOKING_LISTED",
    data: bookings.map((booking) => ({
      id: booking.id,
      meeting_room_id: booking.meetingRoomId,
      start_time: booking.startTime,
      end_time: booking.endTime,
    })),
   });
}

export const updateBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { start_time, end_time, meeting_room_id, purpose, name } = req.body;

  let bookingHistory: Prisma.BookingHistoryGetPayload<{
    select: {
      id: true
      startTime: true
      endTime: true
    };
  }> | null = null
  try {
    bookingHistory = await prisma.bookingHistory.findFirst({
      where: {
        id: Number(id),
        userId: req.user!.id,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      code: "DB_QUERY_FAILED",
      message: "An unexpected error occured",
    });
  }

  if (!bookingHistory) {
    return res.status(404).json({
      status: "error",
      code: "BOOKING_NOT_FOUND",
      message: "Booking not found",
     });
  }

  const startTime = start_time ? new Date(start_time) : bookingHistory.startTime;
  const endTime = end_time ? new Date(end_time) : bookingHistory.endTime;

  if (startTime >= endTime) {
    return res.status(400).json({
      status: "error",
      code: "BOOKING_START_TIME_GREATER_THAN_END_TIME",
      message: "End time must be later than start time"
    });
  }

  let meetingRoom: Prisma.MeetingRoomGetPayload<{
    select: {
      id: true;
    };
  }> | null = null

  if (meeting_room_id !== undefined) {
    try {
      meetingRoom = await prisma.meetingRoom.findUnique({
        where: { id: Number(meeting_room_id) },
        select: { id: true },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        code: "DB_QUERY_FAILED",
        message: "An unexpected error occured",
    });
    }
    if (!meetingRoom) {
      return res.status(404).json({
        status: "error",
        code: "MEETING_ROOM_NOT_FOUND",
        message: "Meeting room not found",
      });
    }
  }

  try {
    await prisma.bookingHistory.update({
      where: {
        id: bookingHistory.id
      },
      data: {
        ...(start_time !== undefined && { startTime }),
        ...(end_time !== undefined && { endTime }),
        ...(name !== undefined && { name }),
        ...(meeting_room_id !== undefined && { meetingRoomId: meetingRoom!.id }),
        ...(purpose !== undefined && { purpose }),
      },
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      code: "DB_UPDATE_FAILED",
      message: "An unknown error occured",
    })
  }

  return res.json({
    status: "success",
    code: "BOOKING_UPDATED",
    message: "Booking updated successfully",
  });
};


export const deleteBooking = async (req: Request, res: Response) => {
  const { id } = req.params;

  let bookingHistory: Prisma.BookingHistoryGetPayload<{
    select: {
      id: true;
    };
  }> | null = null
  try {
    bookingHistory = await prisma.bookingHistory.findFirst({
      where: {
        id: Number(id),
        userId: req.user!.id,
      },
      select: { id: true },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      code: "DB_QUERY_FAILED",
      message: "An unexpected error occured",
    });
  }

  if(!bookingHistory) {
    return res.status(404).json({
      status: "error",
      code: "BOOKING_NOT_FOUND",
      message: "Booking not found",
    })
  }

  try {
    await prisma.bookingHistory.delete({
      where: {
        id: bookingHistory.id
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      code: "DB_DELETE_FAILED",
      message: "An unexpected error occured",
    });
  }

  return res.json({
    status: "success",
    code: "BOOKING_DELETED",
    message: "Booking deleted successfully",
  });
};


