import { Router } from "express";
import { createBooking, deleteBooking, listBookings, updateBooking } from "../controllers/booking.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { body, param } from "express-validator";
import { validateRequest } from "..//middleware/validate.middleware";

const router = Router();

router.post(
  "/",
  requireAuth,
  [
    body("name")
      .notEmpty().withMessage({
        code: "FIELD_REQUIRED",
        message: "name is required"
      })
      .isString().withMessage({
        code: "FIELD_NOT_STRING",
        message: "name must be a string"
      }),

    body("meeting_room_id")
      .notEmpty().withMessage({
        code: "FIELD_REQUIRED",
        message: "meeting_room_id is required"
      })
      .isInt({ min: 1 }).withMessage({
        code: "FIELD_NOT_INTEGER",
        message: "Meeting room ID must be a valid integer"
      }),

    body("start_time")
      .notEmpty().withMessage({
        code: "FIELD_REQUIRED",
        message: "Start time is required"
      })
      .isISO8601().withMessage({
        code: "FIELD_INVALID_FORMAT",
        message: "Start time must be a valid ISO 8601 date"
      }),

    body("end_time")
      .notEmpty().withMessage({
        code: "FIELD_REQUIRED",
        message: "End time is required"
      })
      .isISO8601().withMessage({
        code: "FIELD_INVALID_FORMAT",
        message: "End time must be a valid ISO 8601 date"
      }),

    body("purpose")
      .notEmpty().withMessage({
        code: "FIELD_REQUIRED",
        message: "Purpose is required"
      })
      .isString().withMessage({
        code: "FIELD_NOT_STRING",
        message: "Purpose must be a string"
      })
      .isLength({ min: 3 }).withMessage({
        code: "FIELD_TOO_SHORT",
        message: "Purpose must be at least 3 characters long"
      }),
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
      .notEmpty().withMessage({
        code: "FIELD_REQUIRED",
        message: "Booking ID is required"
      })
      .isInt({ min: 1 }).withMessage({
        code: "FIELD_NOT_INTEGER",
        message: "Booking ID must be a positive integer"
      }),

    body("name")
      .optional()
      .isString().withMessage({
        code: "FIELD_NOT_STRING",
        message: "Name must be a string"
      }),

    body("meeting_room_id")
      .optional()
      .isInt({ min: 1 }).withMessage({
        code: "FIELD_NOT_INTEGER",
        message: "Meeting room ID must be a positive integer"
      }),

    body("start_time")
      .optional()
      .isISO8601().withMessage({
        code: "START_TIME_INVALID_FORMAT",
        message: "Start time must be a valid ISO 8601 date"
      }),

    body("end_time")
      .optional()
      .isISO8601().withMessage({
        code: "END_TIME_INVALID_FORMAT",
        message: "End time must be a valid ISO 8601 date"
      }),

    body("purpose")
      .optional()
      .isString().withMessage({
        code: "PURPOSE_NOT_STRING",
        message: "Purpose must be a string"
      })
      .isLength({ min: 3 }).withMessage({
        code: "PURPOSE_TOO_SHORT",
        message: "Purpose must be at least 3 characters long"
      }),
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
  ],
  validateRequest,
  deleteBooking
)

export default router;