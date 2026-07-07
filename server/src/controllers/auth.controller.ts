import { Request, Response, NextFunction } from "express";
import { env, isProduction } from "../config/env";
import * as authService from "../services/auth.service";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, user } = await authService.login(req.body);
    res.cookie(env.cookieName, token, COOKIE_OPTIONS);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie(env.cookieName);
  res.json({ ok: true });
}

export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.userId!);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.changePassword(req.userId!, req.body);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
