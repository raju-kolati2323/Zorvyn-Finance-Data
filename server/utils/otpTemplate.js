const generateOtpTemplate = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .email-header {
      background-color: #ff9f1c;
      color: #ffffff;
      text-align: center;
      padding: 20px;
    }
    .email-body {
      padding: 20px;
      color: #333333;
    }
    .otp-box {
      margin: 20px auto;
      background-color: #f4f4f4;
      border: 1px dashed #ff9f1c;
      padding: 15px;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #ff9f1c;
      border-radius: 4px;
      max-width: 300px;
    }
    .email-footer {
      text-align: center;
      padding: 10px;
      color: #888888;
      font-size: 12px;
    }
    .cta-button {
      display: inline-block;
      margin: 20px auto;
      padding: 10px 20px;
      background-color: #ff9f1c;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: bold;
    }
    .cta-button:hover {
      background-color: #ff9f1c;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Password Reset OTP for Zorvyn Finance</h1>
    </div>
    <div class="email-body">
      <p>Hello,</p>
      <p>We received a request to reset your password. Use the OTP below to reset your password. The OTP is valid only for 5 minutes.</p>
      <div class="otp-box">${otp}</div>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
    <div class="email-footer">
      <p>&copy; 2026 Zorvyn Finance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = generateOtpTemplate;