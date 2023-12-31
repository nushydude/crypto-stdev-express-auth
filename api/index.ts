import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";
import dotenv from "dotenv";
import {
  generateNewAccessToken,
  logIn,
  logOut,
  sendResetPasswordEmail,
  signUp
} from "./routes/auth.js";
import { gatewayKeyMiddleware } from "./middleware/index.js";

dotenv.config();

const PORT = process.env.PORT || 3003;

const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app })
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(cors());
app.use(express.json());

// Only allow requests is the X-API-KEY header is set to correct secret
app.use(gatewayKeyMiddleware);

app.get("/api/status", (_req, res) => res.send({ status: "ok" }));

app.post("/api/users", signUp);
app.post("/api/sessions", logIn);
app.delete("/api/sessions/:refreshToken", logOut);
app.post("/api/sessions/refresh", generateNewAccessToken);
app.post("/api/users/forgot", sendResetPasswordEmail);

app.use(Sentry.Handlers.errorHandler());

interface ResponseWithSentry extends Response {
  sentry?: string;
}

app.use(function onError(
  _err: any,
  req: Request,
  res: ResponseWithSentry,
  next: NextFunction
) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

export default app;
