import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, "../../server/logs");

export const getLogs = (req, res) => {
  const files = fs.readdirSync(logDir).filter((file) => file.endsWith(".log"));

  const logs = files.flatMap((file) => {
    const content = fs.readFileSync(path.join(logDir, file), "utf-8");
    return content
      .split("\n")
      .filter((line) => line)
      .map((line) => ({ file, line }));
  });

  res.json(logs);
};

export const clearLogs = (req, res) => {
  fs.readdirSync(logDir)
    .filter((file) => file.endsWith(".log"))
    .forEach((file) => fs.writeFileSync(path.join(logDir, file), ""));

  res.json({ message: "Logs cleared successfully" });
};
