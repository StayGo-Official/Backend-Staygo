const express = require("express");
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const db = require("./config/Database.js");
const SequelizeStore = require("connect-session-sequelize");
const cookieParser = require("cookie-parser");
const FileUpload = require("express-fileupload");
const cors = require("cors");
const session = require("express-session");

const AuthRoute = require("./routes/AuthRoute.js");
const UserRoute = require("./routes/UserRoute.js");
const CustomerRoute = require("./routes/CustomerRoute.js");
const KostRoute = require("./routes/KostRoute.js");

dotenv.config();
const app = express();

const sessionStore = SequelizeStore(session.Store)

const store = new sessionStore({
    db: db
})
app.use(cors({ credentials: true, origin: 'http://localhost:3000'}));
app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        secure: 'auto'
    }
}))
app.use(bodyParser.json()); // Untuk menguraikan application/json
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser());
app.use(express.json());
app.use(FileUpload());
app.use(express.static("public"));
app.use("/images", express.static("./public/images"))

app.use(AuthRoute);
app.use(UserRoute);
app.use(CustomerRoute);
app.use(KostRoute);

app.listen(process.env.APP_PORT, ()=> console.log("Server Sedang berjalan"));