import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import expensesRouter from "./expenses";
import investmentRouter from "./investment";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(expensesRouter);
router.use(investmentRouter);
router.use(chatRouter);

export default router;
