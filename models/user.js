/** User class for message.ly */

const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const db = require("../db");
const ExpressError = require("../expressError");


/** User of the site. */

class User {

    /** register new user -- returns
     *    {username, password, first_name, last_name, phone}
     */
    static async register({ username, password, first_name, last_name, phone }) {
        const hashedPass = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
        const result = await db.query(
            `INSERT INTO users (
                username, 
                password, 
                first_name,
                last_name, 
                phone,
                join_at,
                last_login_at)
            VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
            RETURNING username, password, first_name, last_name, phone`, 
            [username, hashedPass, first_name, last_name, phone]);
        return result.rows[0];
    }

    /** Authenticate: is this username/password valid? Returns boolean. */
    static async authenticate(username, password) {
        const result = await db.query(
            `SELECT password
            FROM users 
            WHERE username = $1`, 
            [username]);
        const savedPassHash = result.rows[0];
        if (savedPassHash) {
            const isCorrect = await bcrypt.compare(password, savedPassHash.password);
            return isCorrect;
        }
        return false;
    }

    /** Update last_login_at for user */
    static async updateLoginTimestamp(username) { 
        const result = await db.query(
            `UPDATE users
            SET last_login_at = current_timestamp
            WHERE username = $1
            RETURNING username, last_login_at`, 
            [username]);

        if (!result.rows[0]) {
            throw new ExpressError(`User does not exist: ${username}`, 404);
        }
        return result.rows[0];
    }

    /** All: basic info on all users:
     * [{username, first_name, last_name, phone}, ...] */
    static async all() {
        const result = await db.query(
            `SELECT username,
                first_name,
                last_name,
                phone
            FROM users`);
        return result.rows;
    }

    /** Get: get user by username
     *
     * returns {username,
     *          first_name,
     *          last_name,
     *          phone,
     *          join_at,
     *          last_login_at } */

    static async get(username) {
        const result = await db.query(
            `SELECT username,
                first_name,
                last_name,
                phone,
                join_at,
                last_login_at
            FROM users
            WHERE username = $1`,
            [username]);
        if (!result.rows[0]) {
            throw new ExpressError(`No such user: ${username}`, 404);
        }

        return result.rows[0];
    }

    /** Return messages from this user.
     *
     * [{id, to_user, body, sent_at, read_at}]
     *
     * where to_user is
     *   {username, first_name, last_name, phone}
     */
    static async messagesFrom(username) { 
        const result = await db.query(
            `SELECT 
                messages.id,
                users.first_name,
                users.last_name,
                users.phone,
                users.username,
                messages.body,
                messages.sent_at,
                messages.read_at
            FROM messages 
                JOIN users
                ON messages.to_username = users.username
            WHERE from_username = $1`,
            [username]);
        let messages = [];
        for (const row in result.rows) {
            let r = result.rows[row];
            let m = {
                id : r.id,
                to_user : {
                    first_name : r.first_name,
                    last_name : r.last_name,
                    phone : r.phone,
                    username : r.username
                },
                body : r.body,
                sent_at : r.sent_at,
                read_at : r.read_at
            }
            messages.push(m);
        }
        return messages;
    }

    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesTo(username) { 
        const result = await db.query(
            `SELECT 
                messages.id,
                users.first_name,
                users.last_name,
                users.phone,
                users.username,
                messages.body,
                messages.sent_at,
                messages.read_at
            FROM messages 
                JOIN users
                ON messages.from_username = users.username
            WHERE to_username = $1`,
            [username]);
        let messages = [];
        for (const row in result.rows) {
            let r = result.rows[row];
            let m = {
                id : r.id,
                from_user : {
                    first_name : r.first_name,
                    last_name : r.last_name,
                    phone : r.phone,
                    username : r.username
                },
                body : r.body,
                sent_at : r.sent_at,
                read_at : r.read_at
            }
            messages.push(m);
        }
        return messages;
    }
}


module.exports = User;