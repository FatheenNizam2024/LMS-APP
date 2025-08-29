import { Request } from "express";
import { IUser } from "../models/admin.model";

declare global {
    namespace Express{
        interface Request{
            user?: IUser
        }
    }
}