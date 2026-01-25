import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId || "anonymous";

    const body = await req.json();
    const { type, message } = body;

    if (!type || !message) {
      return NextResponse.json(
        { error: "Type and message are required" },
        { status: 400 },
      );
    }

    if (!["FEATURE", "BUG", "OTHER"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // 1. Save to Database
    await db.insert(feedback).values({
      userId,
      type,
      message,
    });

    // 2. Send Email Notification (Fire and forget, or await if critical)
    try {
      console.log("Attempting to send email...");
      if (process.env.RESEND_API_KEY) {
        console.log(
          "RESEND_API_KEY is present (starts with " +
            process.env.RESEND_API_KEY.substring(0, 5) +
            ")",
        );

        const emailResponse = await resend.emails.send({
          from: "CSE Tracker <onboarding@resend.dev>",
          to: "dinilr28@outlook.com",
          subject: `[${type}] New Feedback Received`,
          html: `
            <h2>New Feedback Received</h2>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>User:</strong> ${userId}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f9f9f9; border-left: 10px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px;">
              ${message}
            </blockquote>
          `,
        });

        if (emailResponse.error) {
          console.error("Resend API returned error:", emailResponse.error);
        } else {
          console.log("Email sent successfully:", emailResponse.data);
        }
      } else {
        console.warn("RESEND_API_KEY is missing from environment variables.");
      }
    } catch (emailError) {
      console.error("Failed to call Resend API:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
