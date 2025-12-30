const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json({limit:"10mb"}));
app.use(cors());

app.post("/export", async(req,res)=>{
 try{
   const {template, resume} = req.body;

   const filePath = path.join(__dirname, "templates", `${template}.html`);
   if(!fs.existsSync(filePath)) return res.status(400).send("Template not found");

   let html = fs.readFileSync(filePath,"utf-8");

   Object.keys(resume).forEach(key=>{
     html = html.replaceAll(`{{${key}}}`, resume[key] || "");
   });

   const browser = await puppeteer.launch({
     headless: "new",
     args:["--no-sandbox"]
   });

   const page = await browser.newPage();
   await page.setContent(html,{waitUntil:"networkidle0"});

   const pdf = await page.pdf({
     format:"A4",
     printBackground:false,
     margin:{top:"10mm",bottom:"10mm"}
   });

   await browser.close();

   res.set({
     "Content-Type":"application/pdf",
     "Content-Disposition":"attachment; filename=resume.pdf"
   });

   res.send(pdf);

 }catch(err){
   console.log(err);
   res.status(500).send("Error generating PDF");
 }
});

app.listen(5000, ()=>console.log("Backend running on 5000"));
