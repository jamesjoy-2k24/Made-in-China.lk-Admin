import { Router } from "express";
import auth from "./auth.routes";
import users from "./users.routes";
import products from "./products.routes";
import orders from "./orders.routes";
import payments from "./payments.routes";
import content from "./content.routes";
import catalog from "./catalog.routes";
import system from "./system.routes";
import attributes from "./attributes.routes"; // <-- add

const r = Router();
r.use("/auth", auth);
r.use("/users", users);
r.use("/products", products);
r.use("/orders", orders);
r.use("/payments", payments);
r.use("/content", content);
r.use("/catalog", catalog);
r.use("/system", system);
r.use("/attributes", attributes); // <-- add

export default r;
