/** Routes for Authentication */

const expresss = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");

const router = new expresss.Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function (req, res, next) {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const isCorrect = await User.authenticate(username, password);
        if (isCorrect) {
            const token = jwt.sign({username}, SECRET_KEY);
            return res.json({ token });
        }
        const err = new ExpressError("Invalid Username or password", 400);
        return next(err);
    } catch (err) {
        return next(err);
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function (req, res, next) {
    try {
        const {username, password, first_name, last_name, phone} = req.body;
        if (!username || !password || !first_name || !last_name || !phone) {
            const err = new ExpressError("Must include all fields", 400);
            return next(err);
        }
        User.register({username, password, first_name, last_name, phone});
        const token = jwt.sign({username}, SECRET_KEY);
        return res.json({ token });
    } catch (err) {
        return next(err);
    }
})

module.exports = router;