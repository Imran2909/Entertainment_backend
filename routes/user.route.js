const express = require("express")
const jwt = require("jsonwebtoken")
const userModel = require("../models/user.model")
const bcrypt = require("bcrypt")
const fs = require("fs")
const userRouter = express.Router()

/**
 * @swagger
 * /user/signup:
 *   post:
 *     summary: Creates a new account for the app
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email
 *               password:
 *                 type: string
 *                 description: The user's password
 *               resetPassword:
 *                 type: string
 *                 description: The password confirmation
 *     responses:
 *       200:
 *         description: User Registered successfully
 *       400:
 *         description: Password does not match
 *       500:
 *         description: Error registering user
 */

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Logs in a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email
 *               password:
 *                 type: string
 *                 description: The user's password
 *     responses:
 *       200:
 *         description: Successful login with a JWT token
 *       401:
 *         description: Invalid password
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */


userRouter.post("/signup", (req, res) => {
    const { email, password, resetPassword } = req.body
    try {
        if (password !== resetPassword) {
            res.send("Password does not matched")
            return
        }
        bcrypt.hash(password, 5, async (err, hash) => {
            if (err) {
                res.send({ "msg": error.message })
            } else {
                const user = new userModel({ email, password: hash, bookmark: [{ movie: [], tvSeries: [] }] })
                await user.save()
                console.log("new user created");
                res.send({ "msg": "User Registered success" })
            }
        });
    } catch (error) {
        res.send({ "msg": error.message })
    }
})
 

userRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.find({ email });
        if (user.length > 0) {
            console.log('User found, attempting login');
            bcrypt.compare(password, user[0].password, (err, result) => {
                if (err) {
                    return res.status(500).send({ msg: "Internal server error" });
                }
                if (result) {
                    let val = user[0]._id.toString();
                    fs.writeFile('userData.txt', val, (err) => {
                        if (err) {
                            console.error('Error writing to file', err);
                        }
                    });
                    var token = jwt.sign({ data: user[0].email }, "imran");
                    return res.status(200).send({ token: token });
                } else {
                    return res.status(401).send({ msg: "Invalid password" });
                }
            });
        } else {
            console.log('User not found');
            return res.status(404).send({ msg: "User not found" });
        }
    } catch (error) {
        return res.status(500).send({ msg: error.message });
    }
});



module.exports = {
    userRouter
}

