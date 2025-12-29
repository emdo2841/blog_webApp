"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db_1 = require("./db");
const app = (0, express_1.default)();
// Connect to the database
(0, db_1.connectToDb)();
const port = 8080;
app.get("/", (req, res) => {
    res.status(200).end("Hello, World!");
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
