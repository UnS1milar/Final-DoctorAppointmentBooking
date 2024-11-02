import React, { useEffect, useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import paypalLogo from "../assets/paypal-image.png";

function SuccessPayment() {
  const [countdown, setCountdown] = useState(5);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Effect to confirm the payment with the backend
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const appointmentId = query.get("appointmentId");
    const payerId = query.get("PayerID");

    if (appointmentId && payerId) {
      axios
        .post(`${backendUrl}/api/paypal/success`, { appointmentId, payerId })
        .then((response) => {
          console.log("Payment success response:", response.data);
        })
        .catch((error) => {
          console.error("Payment execution failed:", error);
        });
    }
  }, [location.search, backendUrl]);

  // Separate effect to handle countdown and redirect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval); // Stop countdown
          return 0; // Set countdown to 0
        }
        return prev - 1; // Decrease countdown
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  // Effect to navigate when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      navigate("/my-appointments"); // Navigate when countdown is 0
    }
  }, [countdown, navigate]);

  // Handle manual redirect
  const handleRedirect = () => {
    navigate("/my-appointments");
  };

  return (
    <div className="flex flex-col justify-center items-center mt-20">
      <h2 className="text-center text-xl">Payment Successful!</h2>
      <img src={paypalLogo} alt="PayPal Logo" />
      <p className="text-center">
        Redirecting you to your appointments in {countdown} seconds...
      </p>
      <button
        onClick={handleRedirect}
        className="py-2 px-4 mt-5 text-base bg-[#0070ba] text-white rounded cursor-pointer text-center"
      >
        Go back to Appointments Now
      </button>
    </div>
  );
}

export default SuccessPayment;
