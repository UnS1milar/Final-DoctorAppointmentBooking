import express from "express";
import {
  createPayment,
  executePayment,
} from "../controllers/paypalController.js";
import authUser from "../middlewares/authUser.js";

const paypalRouter = express.Router();

paypalRouter.post("/create", authUser, createPayment);
paypalRouter.post("/success", executePayment);

export default paypalRouter;
