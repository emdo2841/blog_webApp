import { Request, Response } from "express";
import mailchimp from "@mailchimp/mailchimp_marketing";

// Configure Mailchimp
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, 
});

export const subscribeToNewsletter = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string }; // Type assertion for body

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  try {
    const listId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!listId) {
      throw new Error("Missing Audience ID in .env");
    }

    // 🔴 FIX: Cast the response to tell TS we expect an object with an 'id'
    const response = await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: "subscribed",
    }) as { id: string }; 

    res.status(200).json({ 
        success: true, 
        message: "Successfully subscribed!",
        id: response.id 
    });

  } catch (error: any) {
    // Mailchimp error handling
    console.error(error);

    // Check if user is already subscribed (Mailchimp returns 400 for duplicates)
    if (error.status === 400 && error.response?.text?.includes("Member Exists")) {
        res.status(400).json({ message: "You are already subscribed!" });
        return;
    }

    res.status(500).json({ message: "Subscription failed", error: error.message });
  }
};