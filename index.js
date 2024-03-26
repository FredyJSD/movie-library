import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import fs from 'fs/promises';
import pg from 'pg'

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "list",
    password: "Fredy2024",
    port: 5432,
});

db.connect();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const CLIENT_KEY = '2c6018d7434153b123d16ed0822f301b';
const CLIENT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyYzYwMThkNzQzNDE1M2IxMjNkMTZlZDA4MjJmMzAxYiIsInN1YiI6IjY1YmQ1NDNlZDdjZDA2MDEyZjUyNTM4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.rH6LdBQOMkfCSpwBkq0jtj4ObFikyo4celC9AvdOMKw';
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


// try{
//     const response = await axios.get(`${API_ENDPOINT}/movie/848187`,{
//         params: {
//             api_key: CLIENT_KEY
//         }
//     });
//     console.log('Movie:', response.data);
// } catch (error) {
//     console.error('Error fetching popular movies:', error.message);
// }