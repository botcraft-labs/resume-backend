const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// ---------- HEALTH CHECK ----------
app.get("/", (req, res) => {
  res.send("Resume PDF API Running 🚀");
});

// ---------- EXPORT PDF ----------
app.post("/export", async (req, res) => {
  try {
    const { template, resume } = req.body;

    if (!template || !resume) {
      return res.status(400).send("Missing template or resume data");
    }

    const filePath = path.join(__dirname, "templates", `${template}.html`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Template not found");
    }

    // Load template HTML
    let html = fs.readFileSync(filePath, "utf-8");

    // Replace placeholders
    Object.keys(resume).forEach(key => {
      const value = resume[key] || "";
      html = html.replaceAll(`{{${key}}}`, value);
    });

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: false,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
    });

    await browser.close();

    // Send PDF response
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=resume.pdf"
    });

    res.send(pdf);

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).send("Error generating PDF. Check logs.");
  }
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
