import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from 'pg'
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});


db.connect()
  .then(() => console.log("Connected to the database"))
  .catch(err => console.error("Database connection error:", err));
  

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const CLIENT_KEY = process.env.CLIENT_KEY;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;
const API_ENDPOINT = "https://api.themoviedb.org/3";

const searchMovie = async (movieTitle, year) => {
    try{
        const searchResponse = await axios.get(`${API_ENDPOINT}/search/movie`, {
            params: {
                api_key: CLIENT_KEY,
                query: movieTitle
            }
        });

        const movies = searchResponse.data.results;

        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            if(movieTitle.toLowerCase() === movie.title.toLowerCase() && movie.release_date.startsWith(year)){
                console.log(movie); 
                return movie;
            }       
        }

        return null;

    } catch (error) {
        console.log("Error searching for movie: ", error.message);
    }
};

app.get("/", async (req, res) => {
    // const movie = await searchMovie("Iron Man", "2008");
    // const poster = movie.poster_path
    const result = await db.query(
        "SELECT * FROM movies ORDER BY id ASC"
    );

    const movies = result.rows;

    res.render("index.ejs",{
        movieList: movies
    });
});

app.post("/new", async (req, res) => {
    const movie = await searchMovie(req.body.newMovie, req.body.year);

    if(movie === null){
        console.log("Movie not found");
        return res.redirect("/");
    }    

    const name = movie.original_title;
    const description = req.body.description;
    const rating = req.body.movieRating;
    const overview = movie.overview;
    const url = movie.poster_path;

    try {
        await db.query(
            "INSERT INTO movies (name, description, rating, overview, poster_url) VALUES ($1, $2, $3, $4, $5)", 
            [name, description, rating, overview, url]
        );
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
})

app.post("/edit", async (req, res) => {
    const id = req.body.updateMovieId;
    const description = req.body.updateMovieDescription;

    try{
        await db.query("UPDATE movies SET description = ($1) WHERE id = $2", [description, id]);
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

app.post("/delete", async (req, res) => {
    const id = req.body.deleteMovieId;

    try{
        await db.query("DELETE FROM movies WHERE id = $1", [id]);
        res.redirect("/");
    } catch (err){
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});