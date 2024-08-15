const express = require("express")
const { connection } = require("./db")
const fs = require("fs")
const cors = require('cors')
const { userRouter } = require("./routes/user.route")
const { authenticate } = require("./middleware/middleware")
const userModel = require("./models/user.model")
const session = require('express-session');
const passport = require('passport');
require('./config/google-oauth');
require('dotenv').config()
const swaggerUI = require("swagger-ui-express")
const swaggerJsDoc = require("swagger-jsdoc")

const app = express()
app.use(express.json())

app.use(cors({origin:"*"}));

app.use(session({
    secret: process.env.SESSION_SECRET || 'cats',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } 
}));

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Entertainment App API documentation",
            version: "1.0.0"
        },
        servers: [
            {
                url: "http://localhost:8050"
            }
        ]
    },
    apis: ["./index.js", "./routes/user.route.js"]
};

/**
 * @swagger
 * /:
 *   get:
 *     summary: Home page route
 *     responses:
 *       200:
 *         description: Returns the home page
 */

/**
 * @swagger
 * /fail:
 *   get:
 *     summary: Google OAuth failure route
 *     responses:
 *       200:
 *         description: Returns a failure message for Google OAuth
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiates Google OAuth authentication
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth login page
 */

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback route
 *     responses:
 *       302:
 *         description: Redirects to the success or failure page based on authentication result
 */

/**
 * @swagger
 * /addTvSeriesBookmark:
 *   put:
 *     summary: Adds a TV series to the user's bookmark
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movieId:
 *                 type: string
 *                 description: The ID of the TV series to add
 *     responses:
 *       200:
 *         description: Bookmark updated successfully
 *       400:
 *         description: Movie ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating bookmark
 */

/**
 * @swagger
 * /removeTvSeriesBookmark:
 *   put:
 *     summary: Removes a TV series from the user's bookmark
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movieId:
 *                 type: string
 *                 description: The ID of the TV series to remove
 *     responses:
 *       200:
 *         description: Bookmark removed successfully
 *       400:
 *         description: Movie ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating bookmark
 */

/**
 * @swagger
 * /addMovieBookmark:
 *   put:
 *     summary: Adds a movie to the user's bookmark
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movieId:
 *                 type: string
 *                 description: The ID of the movie to add
 *     responses:
 *       200:
 *         description: Bookmark updated successfully
 *       400:
 *         description: Movie ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating bookmark
 */

/**
 * @swagger
 * /removeMovieBookmark:
 *   put:
 *     summary: Removes a movie from the user's bookmark
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movieId:
 *                 type: string
 *                 description: The ID of the movie to remove
 *     responses:
 *       200:
 *         description: Bookmark removed successfully
 *       400:
 *         description: Movie ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating bookmark
 */

/**
 * @swagger
 * /getMovieBookmark:
 *   get:
 *     summary: Retrieves the user's bookmarked movies
 *     responses:
 *       200:
 *         description: A list of bookmarked movies
 *       404:
 *         description: User not found
 *       500:
 *         description: Error retrieving bookmarks
 */

/**
 * @swagger
 * /getTvSeriesBookmark:
 *   get:
 *     summary: Retrieves the user's bookmarked TV series
 *     responses:
 *       200:
 *         description: A list of bookmarked TV series
 *       404:
 *         description: User not found
 *       500:
 *         description: Error retrieving bookmarks
 */



const swaggerSpec = swaggerJsDoc(options)
app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec) )


app.get("/", (req, res) => {
    res.send("Home page")
})

app.get("/fail", (req, res) => {
    res.send("fail for Google OAuth")
})



app.use("/user", userRouter)

app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] }
));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: process.env.CALLBACK_URL , 
        failureRedirect: '/fail'
    })
);

app.put("/addTvSeriesBookmark", async (req, res) => {
    fs.readFile('userData.txt', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            return res.status(500).send('Error reading file');
        } try {
            const userId = data.trim();
            const movieId = req.body.movieId;
            if (!movieId) {
                return res.status(400).send('Movie ID is required');
            }
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
            // Update the bookmark array using findByIdAndUpdate
            const updatedUser = await userModel.findByIdAndUpdate(
                userId,
                {
                    $push: { 'bookmark.0.tvSeries': movieId }
                },
                { new: true, useFindAndModify: false }
            );
            if (!updatedUser) {
                return res.status(404).send('User not found');
            }
            // console.log(updatedUser.bookmark[0].movie);
            res.send('Bookmark updated successfully');
        } catch (error) {
            console.error('Error updating bookmark', error);
            res.status(500).send('Error updating bookmark');
        }
    });
});

app.put("/removeTvSeriesBookmark", async (req, res) => {
    fs.readFile('userData.txt', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            return res.status(500).send('Error reading file');
        }
        try {
            const userId = data.trim();
            const movieId = req.body.movieId;
            if (!movieId) {
                return res.status(400).send('Movie ID is required');
            }
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
            // Update the bookmark array using findByIdAndUpdate
            const updatedUser = await userModel.findByIdAndUpdate(
                userId,
                {
                    $pull: { 'bookmark.0.tvSeries': movieId }
                },
                { new: true, useFindAndModify: false }
            );
            if (!updatedUser) {
                return res.status(404).send('User not found');
            }
            res.send('Bookmark removed successfully');
        } catch (error) {
            console.error('Error updating bookmark', error);
            res.status(500).send('Error updating bookmark');
        }
    });
});

app.put("/addMovieBookmark", async (req, res) => {
    fs.readFile('userData.txt', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            return res.status(500).send('Error reading file');
        } try {
            const userId = data.trim();
            const movieId = req.body.movieId;
            if (!movieId) {
                return res.status(400).send('Movie ID is required');
            }
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
            const updatedUser = await userModel.findByIdAndUpdate(
                userId,
                {
                    $push: { 'bookmark.0.movie': movieId }
                },
                { new: true, useFindAndModify: false }
            );
            if (!updatedUser) {
                return res.status(404).send('User not found');
            }
            res.send('Bookmark updated successfully');
        } catch (error) {
            console.error('Error updating bookmark', error);
            res.status(500).send('Error updating bookmark');
        }
    });
});

app.put("/removeMovieBookmark", async (req, res) => {
    fs.readFile('userData.txt', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            return res.status(500).send('Error reading file');
        }
        try {
            const userId = data.trim();
            console.log(req.body.movieId);
            const movieId = req.body.movieId;
            if (!movieId) {
                return res.status(400).send('Movie ID is required');
            }
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
            // Update the bookmark array using findByIdAndUpdate
            const updatedUser = await userModel.findByIdAndUpdate(
                userId,
                {
                    $pull: { 'bookmark.0.movie': movieId }
                },
                { new: true, useFindAndModify: false }
            );
            if (!updatedUser) {
                return res.status(404).send('User not found');
            }
            res.send('Bookmark removed successfully');
        } catch (error) {
            console.error('Error updating bookmark', error);
            res.status(500).send('Error updating bookmark');
        }
    });
});

app.get("/getMovieBookmark", async (req, res) => {
    fs.readFile('userData.txt', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            return res.status(500).send('Error reading file');
        }
        try {
            const userId = data.trim();
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.send(user.bookmark[0].movie);
        } catch (error) {
            console.error('Error retrieving bookmarks', error);
            res.status(500).send('Error retrieving bookmarks');
        }
    });
});

app.get("/getTvSeriesBookmark", async (req, res) => {
    fs.readFile('userData.txt', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            return res.status(500).send('Error reading file');
        }
        try {
            const userId = data.trim();
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.send(user.bookmark[0].tvSeries);
        } catch (error) {
            console.error('Error retrieving bookmarks', error);
            res.status(500).send('Error retrieving bookmarks');
        }
    });
});

app.get("/usr", (req, res) => {

})

app.use(authenticate)

app.listen(8050, async () => {
    try {
        await connection
        console.log("connected to db");
    } catch (error) {
        console.log("cannot connected to db");
        console.log(error);
    }
    console.log("server started at port 8050");
})

