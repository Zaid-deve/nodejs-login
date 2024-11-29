const conn = require('./db.js');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const { encryptData, verifyHash } = require('../utils/hash.js');

dotenv.config();

class User {
    // Method to create a new user
    async createUser(data) {
        if (!this.verifyPayload(data, 'signup')) {
            return { success: false, message: 'All fields are required' };
        }

        if (!this.verifyEmail(data.email)) {
            return { success: false, emailErr: 'Email address is not valid!' };
        }

        if (!this.verifyPasswordStrength(data.password)) {
            return { success: false, passErr: 'Password should be between 8 to 24 characters' };
        }

        const isUsernameValid = this.isValidUsername(data.username);
        if (isUsernameValid !== true) {
            return { success: false, usernameErr: isUsernameValid };
        }

        data.password = await this.hashPassword(data.password);
        if (!data.password) {
            return { success: false, message: "An error occured !" };
        }

        try {
            // Insert new user into the database
            const [rows] = await conn.execute(
                'INSERT INTO users (user_name, user_email, user_pass) VALUES (?, ?, ?)',
                [data.username, data.email, data.password]
            );

            if (rows.affectedRows > 0) {
                const token = jwt.sign(
                    { success: true, userId: rows.insertId },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return { success: true, token };
            }

            return { success: false, message: 'Failed to signup, please try again!' };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, emailErr: 'Email address already exists, please sign in!' };
            }
            console.error(error);
            return { success: false, message: 'An error occurred during signup' };
        }
    }

    async hashPassword(pass) {
        try {
            return await encryptData(pass);
        } catch (e) {
            console.log(e.message);
            return null;
        }
    }

    async verifyPassword(hash, pass) {
        try {
            return await verifyHash(hash, pass);
        } catch (e) {
            console.log(e.message);
            return false;
        }
    }

    // Method to validate the email format
    verifyEmail(value) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(value);
    }

    // Method to check the strength of the password
    verifyPasswordStrength(data) {
        return data.length >= 8 && data.length <= 24;
    }

    // Method to check if the necessary fields are provided in the payload
    verifyPayload(data, route = 'login') {
        let isOk = data.email && data.password;
        if (route === 'signup') {
            isOk = isOk && data.username;
        }
        return isOk;
    }

    // Method to authenticate a user during login
    async login(data) {
        if (!this.verifyPayload(data, 'login')) {
            return { success: false, message: 'Email and password are required' };
        }

        try {
            // Query the database for the user
            const [rows] = await conn.execute(
                'SELECT * FROM users WHERE user_email = ?',
                [data.email]
            );

            if (rows.length === 0) {
                return { success: false, message: 'User not found, please sign up!' };
            }

            const user = rows[0];

            if (!await this.verifyPassword(user.user_pass, data.password)) {
                return { success: false, passErr: 'Incorrect password' };
            }

            const token = jwt.sign(
                { success: true, userId: user.user_id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return { success: true, token };
        } catch (error) {
            console.error(error);
            return { success: false, message: 'An error occurred during login' };
        }
    }

    async update(field, val, userId) {
        if (field === 'username') {
            // Validate username
            const isValid = this.isValidUsername(val);
            if (isValid !== true) {
                return { success: false, message: isValid };
            }

            try {
                const [rows] = await conn.execute(
                    'UPDATE users SET user_name = ? WHERE user_id = ?',
                    [val, userId]
                );

                if (rows.affectedRows > 0) {
                    return { success: true, message: 'Username updated successfully' };
                } else {
                    return { success: false, message: 'Username update failed. Please try again!' };
                }
            } catch (err) {
                console.error(err);
                return { success: false, message: 'An error occurred during username update.' };
            }
        } else if (field == 'profile') {
            const validate = this.validateProfileImg(val)
            if (!validate.success) return validate;
            let uploadPath = path.join(`/public/profiles/`,val[0].newFilename);

            try {
                // SQL query to update the user's profile picture path
                const [rows] = await conn.execute(
                    'UPDATE users SET user_profile = ? WHERE user_id = ?',
                    [uploadPath, userId]
                );

                // Check if any rows were affected (i.e., if the update was successful)
                if (rows.affectedRows > 0) {
                    return { success: true };
                } else {
                    return { success: false, message: 'Failed to update profile picture' };
                }
            } catch (error) {
                console.error('Error updating profile picture in database:', error);
                return { success: false, message: 'An error occurred while updating profile picture' };
            }
        }

        return { message: 'Failed to update, please try again !' };
    }

    // authenticate and return user data
    async authenticate(req) {
        const token = req.cookies?.authToken;
        if (token) {
            try {
                const data = await this.verifyToken(token);
                req.isAuthenticated = true;
                return data;
            } catch (e) {
                return e.message
            }
        }
    }

    verifyToken(token) {
        if (token) {
            return new Promise((res, rej) => {
                jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
                    if (err) {
                        rej(err);
                        return;
                    }
                    res(payload)
                });
            })
        }
    }

    logout(req, res, next) {
        res.cookie('authToken', '', {
            maxAge: 0
        })

        req.isLogedIn = false
        req.isAuthenticated = false
        if (next) next();
    }

    isValidUsername(username) {
        if (username.length < 4 || username.length > 24) return "Username must be between 4 and 24 characters long.";

        return !/^[a-zA-Z0-9._,]+$/.test(username) ? "Username can only contain letters, numbers, and the characters '.', '_', or ','." : true;
    }

    async getUser(userId) {
        if (userId) {
            const [rows] = await conn.execute(
                'SELECT user_name, user_id, user_email,user_profile FROM users WHERE user_id = ?',
                [userId]
            )

            return rows[0]
        }

        return null;
    }

    validateProfileImg(file) {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

        // Check file size
        if (file.size > maxSize) {
            return { success: false, message: 'File size exceeds 2MB.' };
        }

        // Check file type
        if (!allowedTypes.includes(file[0].mimetype)) {
            return { success: false, message: 'Only PNG, JPG, or JPEG files are allowed.' };
        }

        return { success: true };
    }

    isUserLogedIn(req) {
        req.isLogedIn = req.cookies?.authToken || false;
        return req.isLogedIn;
    }
}

module.exports = new User();
