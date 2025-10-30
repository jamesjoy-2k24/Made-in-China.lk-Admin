import * as repo from "../repositories/users.repo";
export const list = () => repo.list();
export const create = (data: any) => repo.create(data);
export const getById = (id: string) => repo.getById(id);
export const update = (id: string, data: any) => repo.update(id, data);
export const remove = (id: string) => repo.remove(id);
