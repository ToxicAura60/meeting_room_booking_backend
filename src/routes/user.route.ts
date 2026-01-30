import { Router } from "express";
import { listUserBookings } from "../controllers/booking.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { body } from "express-validator";
import { prisma } from "../lib/prisma";
import { validateRequest } from "../middleware/validate.middleware";
import { createUser } from "../controllers/user.controller";
import { requireAdmin } from "../middleware/role.middleware";
import { UserRole } from "../../prisma/generated/enums";

const router = Router();

router.get(
  "/booking",
  requireAuth,
  listUserBookings
)

router.post(
  "/",
  requireAuth,
  requireAdmin,
  [
    body("first_name")
      .notEmpty().withMessage("First name is required")
      .isString().withMessage("First name must be a string")
      .isLength({ min: 2 }).withMessage("First name must be at least 2 characters long"),

    body("last_name")
      .notEmpty().withMessage("Last name is required")
      .isString().withMessage("Last name must be a string")
      .isLength({ min: 2 }).withMessage("Last name must be at least 2 characters long"),

    body("email")
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Email must be a valid email address")
      .bail()
      .custom(async (email) => {
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existingUser) {
          throw new Error("Email is already registered");
        }

        return true;
      }),

    body("password")
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

    body("role")
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage("role must be either USER or ADMIN"),
  ],
  validateRequest,
  createUser
)

export default router;