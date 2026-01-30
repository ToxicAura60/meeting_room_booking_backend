import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const fieldErrors: {[key: string]: string[]} = {};

    errors.array().forEach(error => {
      switch (error.type) {
        case "field": 
          if (!fieldErrors[error.path]) {
            fieldErrors[error.path] = [];
          }
          fieldErrors[error.path].push(error.msg);
      }
    });
   

    return res.status(422).json({
      status: "error",
      errors: fieldErrors,
    });
  }

  next();
};
