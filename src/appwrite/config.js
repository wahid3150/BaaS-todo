import { Client, Account, Databases, Storage } from "appwrite";

const appwriteClient = new Client();
appwriteClient
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const appwriteAccount = new Account(appwriteClient);
export const appwriteDatabases = new Databases(appwriteClient);
export const appwriteStorage = new Storage(appwriteClient);
