import paypal from "paypal-rest-sdk";
import appointmentModel from "../models/appointmentModel.js";
import axios from "axios";

paypal.configure({
  mode: "sandbox", // 'sandbox' for testing, 'live' for production
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

// Generate paypal token
async function generateAccessToken() {
  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + "/v1/oauth2/token",
    method: "post",
    data: "grant_type=client_credentials",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET,
    },
  });
  return response.data.access_token;
}
// API to make payment of appointment using Paypal
const createPayment = async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }

    const response = await axios({
      url: process.env.PAYPAL_BASE_URL + "/v2/checkout/orders",
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
      data: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: process.env.CURRENCY,
              value: appointmentData.amount,
            },
          },
        ],
        application_context: {
          return_url: `${process.env.BASE_URL}/success-payment?appointmentId=${appointmentId}`,
          cancel_url: `${process.env.BASE_URL}/my-appointments`,
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          brand_name: "Prescripto",
        },
      }),
    });

    // Find the approval URL in the response
    const approvalUrl = response.data.links.find(
      (link) => link.rel === "approve"
    ).href;

    res.json({ success: true, approvalUrl });
  } catch (error) {
    console.error(error.message);
    res.json(error.message);
  }
};

const executePayment = async (req, res) => {
  const { payerId, appointmentId } = req.body;

  // Retrieve the appointment data
  const appointmentData = await appointmentModel.findById(appointmentId);

  if (!appointmentData || appointmentData.cancelled) {
    return res.json({
      success: false,
      message: "Appointment cancelled or not found",
    });
  }

  try {
    // Update MongoDB to set the payment field to true without paymentId validation
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      payment: true,
    });

    res.json({
      success: true,
      message: "Payment recorded successfully",
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
};

export { createPayment, executePayment };
