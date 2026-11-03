import React, { useState } from "react";

function ForgotPass({ onSwitchToReset }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/forgot-password-gabungan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail(""); // Clear the email input after successful submission
      } else {
        setError(data.message || "Terjadi kesalahan");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src="/src/assets/logo.png"
            alt="Logo"
            className="h-12 w-12 mx-auto"
          />
          <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Submit
          </button>
        </form>
        {message && <p className="text-green-600 mt-2">{message}</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {/* <p className="mt-4">
                    Sudah punya token reset?{' '}
                    <button onClick={onSwitchToReset} className="text-blue-600 underline">
                        Reset Password
                    </button>
                </p> */}
      </div>
    </div>
  );
}

export default ForgotPass;
