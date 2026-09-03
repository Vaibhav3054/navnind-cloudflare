import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Using Resend API key instead of Gmail app password
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_USER = process.env.EMAIL_USER; // Your destination Gmail address

    if (!RESEND_API_KEY || !EMAIL_USER) {
      return NextResponse.json(
        { success: false, message: "Missing API key or destination email in environment variables." },
        { status: 500 }
      );
    }

    let html = "";
    let subject = "";
    let replyTo = data.email;

    if (data.formType === "Partner Enquiry") {
      subject = "New Partner Enquiry";
      html = `
        <h2>New Partner Enquiry</h2>
        <p><strong>Company Name:</strong> ${data.companyName}</p>
        <p><strong>Contact Name:</strong> ${data.contactName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Business Type:</strong> ${data.businessType}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message || "No message provided."}</p>
      `;
    } else {
      subject = `New Contact Form - ${data.subject}`;
      html = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.fullName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `;
    }

    // Send email using Resend REST API (Native fetch is perfect for Cloudflare Pages)
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        // In production, change this to a verified domain like "noreply@yourdomain.com"
        // For testing, Resend provides this default onboarding address:
        from: "Contact Form <onboarding@resend.dev>", 
        to: EMAIL_USER, // Will send TO your Gmail account
        reply_to: replyTo, // Allows you to hit "Reply" in Gmail and email the customer directly!
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Resend API Error: ${errorData.message || JSON.stringify(errorData)}`);
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {
    console.error("EMAIL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: String(error),
      },
      { status: 500 }
    );
  }
}