const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
dotenv.config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Multer file upload configuration
const uploads = multer({ dest: "uploads/" });

// Check if the API key is present
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is missing");
  process.exit(1);  // Exit the process if API key is missing
}

const genAl = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware to parse incoming request bodies and serve static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// POST route to handle file uploads and text input
app.post("/api/get", uploads.single("file"), async (req, res) => {
  const userInput = req.body.msg;
  const file = req.file;

  try {
    const model = genAl.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = [userInput];

    if (file) {
      const fileData = fs.readFileSync(file.path);
      const image = {
        inLineData: {
          data: fileData.toString("base64"),
          mimeType: file.mimetype,
        },
      };

      prompt.push(image);
    }

    const response = await model.generateContent(prompt);
    res.send(response.response.text());
  } catch (error) {
    console.error("Error in generating the prompt:", error);
    res.status(error.status || 500).send("An error occurred while generating the prompt");
  } finally {
    // Clean up the uploaded file
    if (file) {
      fs.unlinkSync(file.path);
    }
  }
});

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
