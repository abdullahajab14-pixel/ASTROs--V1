import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/contact", async (req, res) => {
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim();
  const message = (req.body.message || "").trim();

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: "يرجى تعبئة جميع الحقول." });
  }

  try {
    const order = await prisma.order.create({
      data: { name, email, message },
    });

    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
        subject: `رسالة جديدة من ${name}`,
        text: `اسم: ${name}\nإيميل: ${email}\nالرسالة:\n${message}`,
      })
      .catch((err) => console.error("Failed to send notification email:", err));

    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "تم استلام رسالتك",
        text: `مرحباً ${name}،\n\nتم استلام رسالتك بنجاح وسنتواصل معك قريباً.\n\nرسالتك:\n${message}`,
      })
      .catch((err) => console.error("Failed to send confirmation email:", err));

    res.json({ ok: true, id: order.id });
  } catch (err) {
    console.error("Failed to save contact submission:", err);
    res.status(500).json({ ok: false, error: "حدث خطأ، حاول مرة أخرى لاحقاً." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
