import { Router } from "express";
import { createMeetingRoom, deleteMeetingRoom, listMeetingRooms, updateMeetingRoom } from "../controllers/meeting-room.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { body, param } from "express-validator";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireAdmin,
  [
    body("name")
      .notEmpty().withMessage("name is required")
      .isString().withMessage("name must be a string")
      .isLength({ min: 2 }).withMessage("name must be at least 2 characters long")
      .bail()
      .custom(async (name) => {
        const existingRoom = await prisma.meetingRoom.findUnique({
          where: { name },
          select: { id: true },
        });

        if (existingRoom) {
          throw new Error("Meeting room name already exists");
        }

        return true;
      }),

    body("open_time")
      .notEmpty().withMessage("open_time is required")
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage("open_time must be in HH:mm format"),

    body("close_time")
      .notEmpty().withMessage("close_time is required")
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage("close_time must be in HH:mm format")
      .bail()
      .custom((closeTime, { req }) => {
        const openTime = req.body.open_time;
        if (!openTime) {
          return true
        }

      
        const [openHour, openMinute] = openTime.split(":").map(Number)
        const [closeHour, closeMinute] = closeTime.split(":").map(Number)
          
        if (openHour * 60 + openMinute >= closeHour * 60 + closeMinute) {
          throw new Error("close_time must be greater than open_time");
        }

        return true;
      }),

    body("slot_interval_minutes")
      .notEmpty().withMessage("slot_interval_minutes is required")
      .isInt({ min: 5 }).withMessage("slot_interval_minutes must be at least 5 minutes"),
  ],
  validateRequest,
  createMeetingRoom
);


router.get(
  "/",
  requireAuth,
  listMeetingRooms
)

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  [
    param("id")
      .notEmpty().withMessage("Meeting room ID is required")
      .isInt({ min: 1 }).withMessage("Meeting room ID must be a positive integer")
      .bail()
      .custom(async (id) => {
        const room = await prisma.meetingRoom.findUnique({
          where: { id: Number(id) },
          select: { id: true },
        });

        if (!room) {
          throw new Error("Meeting room not found");
        }

        return true;
      }),

    body("name")
      .optional()
      .isString().withMessage("name must be a string")
      .isLength({ min: 2 }).withMessage("name must be at least 2 characters long")
      .bail()
      .custom(async (name, { req }) => {
        const existingRoom = await prisma.meetingRoom.findFirst({
          where: {
            name,
            id: { not: Number(req.params!.id) },
          },
          select: { id: true },
        });
        if (existingRoom) {
          throw new Error("Meeting room name already exists");
        }
        return true;
      }),

    body("open_time")
      .optional()
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage("open_time must be in HH:mm format"),

    body("close_time")
      .optional()
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage("close_time must be in HH:mm format")
      .bail()
      .custom((closeTime, { req }) => {
        const openTime = req.body.open_time;
        if (!openTime) {
          return true
        }

        const [openHour, openMinute] = openTime.split(":").map(Number)
        const [closeHour, closeMinute] = closeTime.split(":").map(Number)
          
        if (openHour * 60 + openMinute >= closeHour * 60 + closeMinute) {
          throw new Error("close_time must be greater than open_time");
        }

        return true;
      }),

    body("slot_interval_minutes")
      .optional()
      .isInt({ min: 5 }).withMessage("slot_interval_minutes must be at least 5 minutes"),
  ],
  validateRequest,
  updateMeetingRoom
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  [
    param("id")
      .notEmpty().withMessage("Meeting room ID is required")
      .isInt({ min: 1 }).withMessage("Meeting room ID must be a positive integer")
      .bail()
      .custom(async (id) => {
        const room = await prisma.meetingRoom.findUnique({
          where: { id: Number(id) },
          select: { id: true },
        });

        if (!room) {
          throw new Error("Meeting room not found");
        }

        return true;
      }),
  ],
  validateRequest,
  deleteMeetingRoom
);

export default router;