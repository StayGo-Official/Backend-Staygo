const express = require("express");
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const db = require("./config/Database.js");
const SequelizeStore = require("connect-session-sequelize");
const cookieParser = require("cookie-parser");
const FileUpload = require("express-fileupload");
const cors = require("cors");
const session = require("express-session");

dotenv.config();

const AuthRoute = require("./routes/AuthRoute.js");
const UserRoute = require("./routes/UserRoute.js");
const CustomerRoute = require("./routes/CustomerRoute.js");
const KostRoute = require("./routes/KostRoute.js");
const FavoriteKostRoute = require("./routes/FavoriteKostRoute.js");
const OrderKostRoute = require("./routes/OrderKostRoute.js");
const OjekRoute = require("./routes/OjekRoute.js");
const FavoriteOjekRoute = require("./routes/FavoriteOjekRoute.js");
const OrderOjekRoute = require("./routes/OrderOjekRoute.js");
const MidtransRoute = require("./routes/MidtransRoute.js");

const app = express();
const port = process.env.APP_PORT

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
app.use(FavoriteKostRoute);
app.use(OrderKostRoute);
app.use(OjekRoute);
app.use(FavoriteOjekRoute);
app.use(OrderOjekRoute);

app.use(MidtransRoute);

app.listen(port, ()=> console.log(`Server Sedang berjalan: http://localhost:${port}`));