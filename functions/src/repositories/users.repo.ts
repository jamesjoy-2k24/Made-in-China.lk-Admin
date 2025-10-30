import * as fs from "./firestore";
const C = "users";
export const list = () => fs.list(C);
export const create = (data: any) => fs.create(C, data);
export const getById = (id: string) => fs.getById(C, id);
export const update = (id: string, data: any) => fs.update(C, id, data);
export const remove = (id: string) => fs.remove(C, id);
