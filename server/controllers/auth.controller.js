const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/sendEmail');
const generateOtpTemplate = require('../utils/otpTemplate');
const PasswordReset = require('../models/forgotPassword');
const crypto = require('crypto');
const { addRevokedToken } = require('../utils/tokenRevocation');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' })
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No user found with the email.' })
        };

        if(user.isActive === false){
            return res.status(403).json({ message: 'Your account is deactivated by the admin.' })
        }

        const validPassword = bcrypt.compareSync(password, user.password)
        if (!validPassword) {
            return res.status(404).json({ message: "Please enter correct password." })
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.status(200).json({
            message: "Login success.", role: user.role, token
        });
    }
    catch (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message })
    }
};


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Please provide the email id.' })
        };

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No user found with the provided email.' });
        };

        const otp = crypto.randomInt(100000, 999999).toString();

        await PasswordReset.create({ email, otp });

        await sendEmail(email, process.env.EMAIL_ID, 'Password Reset OTP from Zorvyn Finance', generateOtpTemplate(otp));

        res.status(200).json({ message: 'OTP sent to email, It will expires in 2 minutes.' });
    } catch (err) {
        res.status(500).json({ message: 'Error sending OTP.', error: err.message });
    }
};

//verify otp and reset password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!otp || !newPassword) {
            return res.status(400).json({ message: 'OTP or new password is missing.' })
        };

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with the email.' });
        };

        const resetRequest = await PasswordReset.findOne({ email, otp });
        if (!resetRequest) {
            return res.status(400).json({ message: 'Invalid or expired OTP/email.' });
        };

        const passwordRegex = /^.{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'Password must contain at least 8 characters' });
        }

        const hpass = bcrypt.hashSync(newPassword, 10);

        user.password = hpass;
        await user.save();

        await PasswordReset.deleteOne({ email, otp });

        res.status(200).json({ message: 'Password reset successfully. Try logging in with your new password.' });
    } catch (err) {
        res.status(500).json({ message: 'Error resetting password.', error: err.message });
    }
};


exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        addRevokedToken(token);
        res.status(200).json({ message: 'Logout successful' });
    }
    catch (error) {
        res.status(500).json({ message: 'Logout failed', error: error.message });
    }
};