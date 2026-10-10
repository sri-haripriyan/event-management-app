import { Client, Storage } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const endpoint = (process.env.APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1").replace(/['"]/g, "");
const projectId = (process.env.APPWRITE_PROJECT_ID || "").replace(/['"]/g, "");
const apiKey = (process.env.APPWRITE_API_KEY || process.env.APPWRITE_API || process.env.AppWrite_Api || "").replace(/['"]/g, "");
const bucketId = (process.env.APPWRITE_BUCKET_ID || "").replace(/['"]/g, "");

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

if (apiKey) {
  client.setSession(apiKey);
  client.setKey(apiKey);
}

const storage = new Storage(client);

export { client, storage, bucketId, projectId, endpoint };
