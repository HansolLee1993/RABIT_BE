const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const inventory = require("./inventory.json");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const upload = multer();

const { sendImageToClaude } = require("./claudeHandler");
app.post("/api/claude", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString("base64");

    const result = await sendImageToClaude(base64Image);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/search", (req, res) => {
  console.log("Search endpoint hit with query:", req.query);

  const make = req.query.make || req.query.Make;
  const model = req.query.model || req.query.Model;
  const year = req.query.year || req.query.Year;

  const filtered = inventory.filter((vehicle) => {
    return (
      (!make || vehicle.make.toLowerCase() === make.toLowerCase()) &&
      (!model || vehicle.model.toLowerCase() === model.toLowerCase()) &&
      (!year || vehicle.year.toString() === year.toString())
    );
  });

  const result = filtered.map(
    ({ dealer, price, image_url, make, model, year }) => ({
      dealer,
      price,
      image_url,
      make,
      model,
      year,
    })
  );

  res.json(result);
});

app.listen(port, () => {
  console.log(`:rocket: Server running on http://localhost:${port}`);
});
