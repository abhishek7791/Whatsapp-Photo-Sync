import cors from "cors";
import express from "express";
import { Request, Response } from "express";
import expressWs from "express-ws";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";

import winston from "winston";
import expressWinston from "express-winston";

import router from "./routes/api";

import dotenv from "dotenv";
dotenv.config();

let ews = expressWs(express());
const app = ews.app;
const port = 8080;

/*
  Setup the session and cookie parser.
  Based on - https://stackoverflow.com/a/55597997/1403643
*/
app.use(
  cors({
    origin: [process.env.ORIGIN || "http://localhost:8080"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // enable set cookie
  })
);

const secret = process.env.SESSION_SECRET || "secret";
app.use(bodyParser.json());
app.use(cookieParser(secret));
app.use(
  session({
    secret: secret,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: false,
      secure: process.env.NODE_ENV == "production" ? true : false,
    },
    resave: false,
    saveUninitialized: true,
  })
);

app.use(function (req: Request, res: Response, next: CallableFunction) {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-   Type, Accept, Authorization"
  );
  next();
});

if (process.env.NODE_ENV == "production") {
  app.set("trust proxy", 1);
}

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    expressFormat: true,
    colorize: false,
  })
);

// To fix 304 responses.
app.disable("etag");

const routePrefix = process.env.ROUTE_PREFIX || "";
app.use(routePrefix, router);
app.listen(port, "localhost", () => {
  console.log(`Listening on port ${port}`);
});
