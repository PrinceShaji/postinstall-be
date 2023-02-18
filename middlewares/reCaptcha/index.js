'use-strict'

import dayjs from "dayjs";
import axios from "axios";
import { promisify } from "util";
import redisClient from "../../services/redisClient.js";

// Promisify redis.
redisClient.exists = promisify(redisClient.exists);
redisClient.getAsync = promisify(redisClient.get).bind(redisClient);
redisClient.setex = promisify(redisClient.setex);


const verifyReCaptcha = async (req, res, next) => {
    const captcha_solution = req.body.captcha_solution;
    const request_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const captcha_secret_key = process.env.RECAPTCHA_SECRET_KEY;


    const captcha_verify_url = `https://www.google.com/recaptcha/api/siteverify?secret=${captcha_secret_key}&response=${captcha_solution}`;

    if (!captcha_solution) {
        return res.status(400).json({ "status": "Missing reCaptcha Solution." });
    }

    // Check if the captcha_solution exist on redis.
    let captcha_cache_exists = await redisClient.exists(`captcha:${captcha_solution}`).catch(err => {
        console.error(err);
        return res.status(500).json({ "status": "Internal Server Error." });
    });


    if (captcha_cache_exists === 1) {
        // If the user is trying to reuse the captcha solution.
        return res.status(400).json({ "status": "Reused captcha", "message": "Logging event!" });

    } else if (captcha_cache_exists === 0 || captcha_cache_exists === null) {
        // When the captcha is not found in the redis database

        const { "data": captcha_response } = await axios.post(captcha_verify_url, {
            // responseType: 'json'
        }).catch(err => {
            console.error(err);
            res.status(500).json({ "status": "Internal Server Error." });
        });


        // Get the time in minutes after the challenge was solved.
        // Default to zero if the captcha solution is invalid.
        const time_delta = dayjs().diff(dayjs(captcha_response.challenge_ts), 'minute') || 0;

        if (captcha_response.success === false) {
            // When the captcha solution is invalid

            return res.status(400).json({ "status": "Invalid Captcha Data." })
        }
        else if (time_delta <= 5 && captcha_response.success === true) {
            // If the challenge was solved within the last 5 mins and is not in redis.
            // Captcha data in redis is set to expire in 10 mins.

            // Set isCaptchaValid as true in the request body.
            req.body.isCaptchaValid = true;

            // Add the captcha data to the redis database with expiration of 10 mins (600 seconds).
            await redisClient.setex(`captcha:${captcha_solution}`, 600, true).catch(err => {
                console.error(err);
            });

            next();
        } else if (time_delta > 5 && captcha_response.success === true) {
            // When the user is trying to reuse the old captcha solution

            return res.status(400).json({ "status": "Reused captcha", "message": "Logging event!" })
        }
    }
}


export default verifyReCaptcha;