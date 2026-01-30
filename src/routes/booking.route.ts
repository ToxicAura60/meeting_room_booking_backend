import { Router } from "express";
import { createBooking, deleteBooking, listBookings, updateBooking } from "../controllers/booking.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { body, param } from "express-validator";
import { validateRequest } from "..//middleware/validate.middleware";
import { prisma } from "../lib/prisma";

const router = Router();

router.post(
  "/",
  requireAuth,
  [
    body("name")
      .notEmpty().withMessage("name is required")
      .isString().withMessage("name must be a string"),

    body("meeting_room_id")
      .notEmpty().withMessage("meeting_room_id is required")
      .isInt({ min: 1 }).withMessage("meeting_room_id must be a valid integer")
      .bail()
      .custom(async (meetingRoomId) => {
        const room = await prisma.meetingRoom.findUnique({
          where: { id: Number(meetingRoomId) },
          select: { id: true },
        });

        if (!room) {
          throw new Error("Meeting room not found");
        }

        return true;
      }),

    body("start_time")
      .notEmpty().withMessage("start_time is required")
      .isISO8601().withMessage("start_time must be a string"),

    body("end_time")
      .notEmpty().withMessage("end_time is required")
      .isISO8601().withMessage("end_time must be a string")
      .custom((value, { req }) => {
        if (req.body.start_time && new Date(value) <= new Date(req.body.start_time)) {
          throw new Error("end_time must be greater than start_time");
        }
        return true;
      }), 

    body("purpose")
      .notEmpty().withMessage("purpose is required")
      .isString().withMessage("purpose must be a string")
      .isLength({ min: 3 }).withMessage("purpose must be at least 3 characters long"),
  ],
  validateRequest,
  createBooking
)

router.get(
  "/",
  requireAuth,
  listBookings
)

router.put(
  "/:id",
  requireAuth,
  [
    param("id")
      .notEmpty().withMessage("Booking ID is required")
      .isInt({ min: 1 }).withMessage("Booking ID must be a positive integer")
      .bail()
      .custom(async (bookingId, { req }) => {
        const booking = await prisma.bookingHistory.findFirst({
          where: {
            id: Number(bookingId),
            userId: req.user!.id,
          },
          select: { id: true },
        });

        if (!booking) {
          throw new Error("Booking not found");
        }

        return true;
      }),

    body("name")
      .optional()
      .isString().withMessage("name must be a string"),

    body("meeting_room_id")
      .optional()
      .isInt({ min: 1 }).withMessage("meeting_room_id must be a positive integer")
      .bail()
      .custom(async (meetingRoomId) => {
        const room = await prisma.meetingRoom.findUnique({
          where: { id: Number(meetingRoomId) },
          select: { id: true },
        });

        if (!room) {
          throw new Error("Meeting room not found");
        }

        return true;
      }),

    body("start_time")
      .optional()
      .isISO8601().withMessage("start_time must be a valid ISO 8601 date"),

    body("end_time")
      .optional()
      .isISO8601().withMessage("end_time must be a valid ISO 8601 date")
      .custom((endTime, { req }) => {
        if (req.body.start_time && new Date(endTime) <= new Date(req.body.start_time)) {
          throw new Error("end_time must be greater than start_time");
        }
        return true;
      }),

    body("purpose")
      .optional()
      .isString().withMessage("purpose must be a string")
      .isLength({ min: 3 }).withMessage("purpose must be at least 3 characters long"),
  ],
  validateRequest,
  updateBooking
)

router.delete(
  "/:id",
  requireAuth,
  [
    param("id")
      .notEmpty().withMessage("Booking ID is required")
      .isInt({ min: 1 }).withMessage("Booking ID must be a positive integer")
      .bail()
      .custom(async (bookingId, { req }) => {
        const room = await prisma.bookingHistory.findFirst({
          where: { 
            id: Number(bookingId),
            userId: req.user.id, 
          },
          select: { id: true },
        });

        if (!room) {
          throw new Error("Booking not found");
        }

        return true;
      }),
      
  ],
  validateRequest,
  deleteBooking
)

export default router;