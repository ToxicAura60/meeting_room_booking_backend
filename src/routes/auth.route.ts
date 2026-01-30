import { Router } from "express";
import { body } from "express-validator";
import { login, refreshAccessToken, register } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate.middleware";
import { prisma } from "../lib/prisma";

const router = Router();

router.post(
  "/register",
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
  ],
  validateRequest,
  register
)

router.post(
  "/login",
  [
    body("email")
      .notEmpty().withMessage("Email is required")
      .bail()
      .isEmail().withMessage("Email must be a valid email address"),

    body("password")
      .notEmpty().withMessage("Password is required")
      .bail()
      .isLength({ min: 4 }).withMessage("Password must be at least 4 characters long"),

    body("stay_signed_in")
      .optional()
      .isBoolean()
      .withMessage("stay_signed_in must be a boolean"),
  ],
  validateRequest,
  login
)

router.post(
  "/refresh",
  [
    body("refresh_token")
      .notEmpty().withMessage("Refresh token is required")
      .isString().withMessage("Refresh token must be a string"),
  ],
  validateRequest,
  refreshAccessToken
)

export default router;