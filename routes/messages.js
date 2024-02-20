/** Routes for Messages */

const expresss = require("express");

const Message = require("../models/message");
const auth = require("../middleware/auth");
const { DB_URI } = require("../config");
const router = new expresss.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", auth.ensureLoggedIn, async function(req, res, next) {
    try {
        const id = req.params.id;
        const message = await Message.get(id);
        if ((req.user.username !== message.from_user.username) && (req.user.username !== message.to_user.username)) {
            return next({ status: 401, message: "Unauthorized" });
        }
        return res.json({ message: message });
    }
    catch (err) {
        return next(err);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", auth.ensureLoggedIn, async function(req, res, next) {
    try {
        const {to_username, body} = req.body;
        console.log(req.user.username, to_username, body);
        const message = await Message.create(req.user.username, to_username, body);
        return res.json({ message: message });
    }
    catch (err) {
        return next(err);
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", auth.ensureLoggedIn, async function(req, res, next) {
    try {
        const id = req.params.id;
        const message = await Message.get(id);
        if (req.user.username !== message.to_user.username) {
            return next({ status: 401, message: "Unauthorized" });
        }
        const result = await Message.markRead(id);
        return res.json({ message: result });
    }
    catch (err) {
        return next(err);
    }
})

module.exports = router;