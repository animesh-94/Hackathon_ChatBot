const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
dotenv.config();

const {GoogleGenerativeAI} = require('@google/generative-ai');

const app = express();

const uploads = multer({dest: "uploads/"});
if(!process.env.GEMINI_API_KEY){
  console.error("Error: API key is missing");
  process.exit();
}

const genAl = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/get", uploads.single("file"), async (req, res) =>{
  const userInput = req.body.msg;
  const file = req.file;

  try {
    const model = genAl.getGenerativeModel({model: "gemini-1.5-flash"});

    let prompt = [userInput];

    if(file){
      const fileData = fs.readFileSync(file.path);
      const image = {
        inLineData : {
          data : fileData.toString("base64"),
          mimeType: file.mimetype,
        },
      };

      prompt.push(image);
    }

    const response = await model.generateContent(prompt);
    res.send(response.response.text());
  } catch (error) {
    console.error("Error in generating the prompt: ".error);
    res.status(error.status || 500).send("An error occured while generating the prompt");
  } finally{
      if(file){
        fs.unlinkSync(file.path);
      }
    }  
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>{
  console.log(`Server is running at http://localhost:${PORT}`);
})