import type { Request, Response, NextFunction } from "express";

import { HttpError } from "../lib/errors.js";

const HEADER_NAME = "x-client-id";

export const clientIdMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const clientId = req.header(HEADER_NAME)?.trim();

  if (!clientId) {
    return next(new HttpError(400, `Missing required header: ${HEADER_NAME}`));
  }

  req.clientId = clientId;
  return next();
};

