import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "../../prisma/generated/client";

export const createMeetingRoom = async (req: Request, res: Response) => {
  const { name, open_time, close_time, slot_interval_minutes } = req.body;

  try {
    await prisma.meetingRoom.create({
      data: {
        name,
        openTime: open_time,
        closeTime: close_time,
        slotIntervalMinutes: slot_interval_minutes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }

  return res.status(201).json({
    status: "success",
    message: "Meeting room created successfully"
  })
}

export const listMeetingRooms = async (_req: Request, res: Response) => {
  let meetingRooms: Prisma.MeetingRoomGetPayload<{
    select: { id: true; name: true };
  }>[] = [];

  try {
    meetingRooms = await prisma.meetingRoom.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
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
    data: meetingRooms,
  });
};


export const deleteMeetingRoom = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    await prisma.meetingRoom.delete({
      where: {
        id: Number(id),
      },
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }

  return res.json({
    status: "success",
    message: "Meeting room deleted successfully"
  });
}

export const updateMeetingRoom = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, open_time, close_time, slot_interval_minutes } = req.body;

  let existingMeetingRoom: Prisma.MeetingRoomGetPayload<{
    select: { openTime:true, closeTime: true };
  }> | null = null;

  try {
    existingMeetingRoom = await prisma.meetingRoom.findUnique({
      where: { id: Number(id)},
      select: {
        openTime: true,
        closeTime: true,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
  }

  const openMinutes = open_time ? timeToMinutes(open_time) : timeToMinutes(existingMeetingRoom!.openTime);
  const closeMinutes = close_time ? timeToMinutes(close_time) : timeToMinutes(existingMeetingRoom!.closeTime);

 
  if (openMinutes >= closeMinutes) {
    return res.status(422).json({
      status: "error",
      errors: {
        open_time: ["open_time must be lower than close_time"],
      }
    });
  }

  try {
    await prisma.meetingRoom.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        ...(open_time !== undefined && { openTime: open_time }),
        ...(close_time !== undefined && { closeTime: close_time }),
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
  return res.json({
    status: "success",
    message: "Meeting room updated successfully",
  })
}