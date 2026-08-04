const { User, Student, Warden, Hostel } = require('../models/sql/associations');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary } = require('../utils/cloudinary');
const crypto = require('crypto');
const { emailQueue } = require('../config/queue');

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, phone, ...otherData } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Resolve Hostel Document mapping
        let finalHostelId = null;
        const hostelName = role === 'Student' ? otherData.hostel : otherData.assignedHostel;
        if (hostelName) {
            let hostelDoc = await Hostel.findOne({ where: { name: hostelName } });
            if (!hostelDoc) {
                hostelDoc = await Hostel.create({ name: hostelName });
            }
            finalHostelId = hostelDoc.id;
        }

        const profilePhotoFile = req.files && req.files['profilePhoto'] ? req.files['profilePhoto'][0] : null;
        const idCardFile = req.files && req.files['idCard'] ? req.files['idCard'][0] : null;

        let photoUrl = null;
        let idCardUrl = null;

        if (profilePhotoFile) {
            const uploadResult = await uploadToCloudinary(profilePhotoFile.path, 'profiles');
            if (uploadResult) photoUrl = uploadResult.url;
        }

        if (idCardFile) {
            const uploadResult = await uploadToCloudinary(idCardFile.path, 'idcards');
            if (uploadResult) idCardUrl = uploadResult.url;
        }

        // 1. Create Base User
        const user = await User.create({
            name,
            email,
            password,
            role,
            phone,
            photo: photoUrl,
            assignedLocation: role === 'Main Gate' ? otherData.assignedGate : undefined
        });

        // 2. Create Role-Specific Profile
        if (role === 'Student') {
            await Student.create({
                userId: user.id,
                rollNumber: otherData.rollNumber,
                hostelId: finalHostelId,
                roomNo: otherData.roomNo || otherData.room,
                branch: otherData.branch,
                year: otherData.year,
                gender: otherData.gender,
                parentName: otherData.parentName,
                parentEmail: otherData.parentEmail,
                parentPhone: otherData.parentPhone,
                idCard: idCardUrl,
                registrationStatus: 'Pending',
                currentLocation: 'Inside'
            });
        } else if (role === 'Warden') {
            await Warden.create({
                userId: user.id,
                hostelId: finalHostelId
            });
            // Update the Hostel to link this Warden
            if (finalHostelId) {
                await Hostel.update({ wardenId: user.id }, { where: { id: finalHostelId } });
            }
        }

        res.status(201).json({ message: 'Registration successful! Please wait for approval.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
             return res.status(400).json({ message: 'Please provide credentials' });
        }

        // Find user by email
        let user = await User.findOne({ where: { email: identifier } });

        // If not found by email, try searching by student roll number
        if (!user) {
            const student = await Student.findOne({ 
                where: { rollNumber: identifier },
                include: [{ model: User, as: 'user' }]
            });
            if (student && student.user) {
                user = student.user;
            }
        }

        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Check status
        if (user.status === 'Suspended') {
            return res.status(403).json({ message: 'Your account has been suspended.' });
        }
        if (user.status === 'Pending') {
            return res.status(403).json({ message: 'Your account registration is pending approval by the System Administrator.' });
        }

        // Fetch Role Profile for Student
        let profileData = {};
        if (user.role === 'Student') {
            const studentProfile = await Student.findOne({ 
                where: { userId: user.id },
                include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
            });
            if (studentProfile && studentProfile.registrationStatus !== 'Approved') {
                 return res.status(403).json({ message: 'Your student registration is pending approval by the Warden.' });
            }
            if (studentProfile) {
                profileData = studentProfile.toJSON();
                profileData.hostel = studentProfile.hostel ? studentProfile.hostel.name : 'Unknown';
            }
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token in DB
        await User.update({ refreshToken }, { where: { id: user.id } });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        const userData = {
            id: user.id,
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            photo: user.photo,
            phone: user.phone,
            ...profileData
        };

        res.status(200).json({ user: userData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return res.status(204).send();

        // Clear refresh token from DB
        const user = await User.findOne({ where: { refreshToken } });
        if (user) {
            await User.update({ refreshToken: '' }, { where: { id: user.id } });
        }

        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return res.status(401).json({ message: 'Not authorized' });

        const user = await User.findOne({ where: { refreshToken } });
        if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Token expired' });
            
            const tokens = generateTokens(user);
            await User.update({ refreshToken: tokens.refreshToken }, { where: { id: user.id } });

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 15 * 60 * 1000
            });

            res.status(200).json({ message: 'Token refreshed successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        user.password = newPassword; 
        await user.save(); // hashes automatically on save hook

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { phone } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (phone) {
            user.phone = phone;
            await user.save();
        }

        // Fetch updated profile
        const studentProfile = await Student.findOne({ 
            where: { userId: user.id },
            include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
        });
        const profileData = studentProfile ? {
            ...studentProfile.toJSON(),
            hostel: studentProfile.hostel ? studentProfile.hostel.name : 'Unknown'
        } : {};

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            photo: user.photo,
            phone: user.phone,
            ...profileData
        };

        res.status(200).json({ message: 'Profile updated successfully', user: userData });
    } catch (error) {
        res.status(500).json({ message: 'Profile update failed', error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Please provide an email address' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await user.save();

        // Create reset URL using FRONTEND_URL environment variable
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="background-color: #0a3366; padding: 15px; text-align: center; border-radius: 6px 6px 0 0;">
                    <h2 style="color: #ffffff; margin: 0;">CampusPass Password Recovery</h2>
                </div>
                <div style="padding: 20px; color: #333333; line-height: 1.6;">
                    <p>Dear ${user.name},</p>
                    <p>We received a request to reset the password for your CampusPass account. If you made this request, please click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #e5a93b; color: #0a3366; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #0a3366;"><a href="${resetUrl}">${resetUrl}</a></p>
                    <p><strong>Note:</strong> This link is valid for <strong>1 hour</strong> only.</p>
                    <p>If you did not request a password reset, you can safely ignore this email.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0; border-radius: 0 0 6px 6px;">
                    This is an automated message. Please do not reply directly to this email.
                </div>
            </div>
        `;

        emailQueue.add('send-email', {
            to: user.email,
            subject: 'CampusPass Password Reset Request',
            html: message,
            text: `Dear ${user.name}, We received a request to reset your password. Please reset it here: ${resetUrl}`
        });

        res.status(200).json({ message: 'Password reset link sent to your registered email.' });
    } catch (error) {
        console.error('ForgotPassword error:', error);
        res.status(500).json({ message: 'Email could not be sent', error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Please provide a new password' });
        }

        // Get hashed token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user by token and see if it hasn't expired
        const user = await User.findOne({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

        // Set new password (will trigger pre-save hashing hook)
        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.status(200).json({ message: 'Password reset successful! You can now log in.' });
    } catch (error) {
        console.error('ResetPassword error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let profileData = {};
        if (user.role === 'Student') {
            const studentProfile = await Student.findOne({ 
                where: { userId: user.id },
                include: [{ model: Hostel, as: 'hostel', attributes: ['name'] }]
            });
            if (studentProfile) {
                profileData = studentProfile.toJSON();
                profileData.hostel = studentProfile.hostel ? studentProfile.hostel.name : 'Unknown';
            }
        }

        const userData = {
            id: user.id,
            _id: user.id, // For backward compatibility if any
            name: user.name,
            email: user.email,
            role: user.role,
            photo: user.photo,
            phone: user.phone,
            ...profileData
        };

        res.status(200).json({ user: userData });
    } catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
