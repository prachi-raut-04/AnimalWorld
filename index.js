import express from "express";
import mysql from 'mysql2';
import path from "path";
import { fileURLToPath } from "url";
import methodOverride from "method-override";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";

const app = express();
let port = 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "/public/css")));
app.use(express.static(path.join(__dirname, "/public/js")));
app.use(express.static(path.join(__dirname, "/public/images")));
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(methodOverride('_method'))

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let { type } = req.params; // Fish, Mammals, etc.
        cb(null, `public/images/${type}`);
    },

    filename: (req, file, cb) => {
        let { name } = req.body;
        let ext = path.extname(file.originalname); // .png, .jpg, .jpeg
        cb(null, `${name}${ext}`);
    }
});

const upload = multer({ storage });

app.listen(port, () => {
  console.log(`app is listening to ${port}`);
});

// Login 
app.get("/login", (req, res) =>{
  res.render("login.ejs");
}) 
app.post("/login", (req, res) => {
  let {email, password } = req.body;
  let q = `SELECT * FROM user WHERE email = ?`;

  connection.query(q, [email], (err, result) => {
    if(err) {
      console.log(err);
      return res.send("Database Error");
    }

    if(result.length === 0) {
      return res.send("No such user. Please sign up.");
    }

    if(result[0].password === password) {
      return res.redirect("/home");
    } else {
      return res.send("Wrong password");
    }
  })
})

// Sign up
app.get("/signin", (req, res) => {
  res.render("signin.ejs");
})
app.post("/signin", (req, res) => {
  let id = uuidv4();
  let {name, email, password, confirmpassword} = req.body;

  if(password !== confirmpassword) {
    return res.send("passwords do not match");
  }

  let checkquery = `SELECT * FROM user WHERE email = ?`;

  connection.query(checkquery, [email], (err, result) => {
    if(err) {
      console.log(err);
      return res.send("Database Error");
    } 

    if(result.length > 0) {
      return res.send("Already exist the email");
    }

    let q = `INSERT INTO user (id, email, name, password) VALUES (?, ?, ?, ?)`;
    connection.query(q, [id, email, name, password], (err, result) => {
      if(err) {
        console.log(err);
        return res.send("Error in database");
      }
      return res.redirect("/home");
    })
  })
})

// Home 
app.get("/home", (req, res) => {
  let q = `SELECT * FROM category`;
  connection.query(q, (err, result) => {
    if(err) {
      console.log(err);
      return res.send("Database Error");
    }
    return res.render("home.ejs", { result });
  })
})

// Home to detail type of animal
app.get("/home/:type", (req, res) => {
  let { type } = req.params;
  let q = `SELECT * FROM ${type}`;

  connection.query(q, (err, result) => {
    if(err) {
      console.log(err);
      return res.send("Database Error");
    }
    return res.render("category.ejs", { type, result });
  })
})

// Add the new animal in that category
app.get("/home/:type/add", (req, res) => {
  let { type } = req.params;
  return res.render("add.ejs", { type });
})
app.post("/home/:type", upload.single("image_url"), (req, res) => {
  let id = uuidv4();
  let { type } = req.params;
  let { name, lifespan, size, scientific_name, description} = req.body;
  
  if (!req.file) {
    return res.send("Please upload an image");
  }

  let image_url = `${type}/${req.file.filename}`; 
  let q = `INSERT INTO ${type} 
          (id, name, image_url, lifespan, size, scientific_name, description) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`;

  connection.query(q, [id, name, image_url, lifespan, size, scientific_name, description], (err, result) => {
    if(err) {
      console.log(err);
      return res.send("Database Error");
    }
    return res.redirect(`/home/${type}`);
  })
})

// See the category animal in detail
app.get("/home/:type/:id", (req, res) => {
  let { type, id } = req.params;
  let q = `SELECT * FROM ${type} WHERE id = ?`;

  connection.query(q, [id], (err, result) => {
    if(err) {
      console.log(err);
      return res.send("Database Error");
    }
    return res.render("detail.ejs", { type, data : result[0] })
  })
})

// Edit the category animal
app.get("/home/:type/:id/edit", (req, res) => {
  let {type, id } = req.params;
  let q = `SELECT * FROM ${type} WHERE id = ?`;

  connection.query(q, [id], (err, result) => {
    if(err) {
      console.log(err);
      return res.send("Database Error");
    }
    return res.render("edit.ejs", { type, data : result[0] });
  })
})
app.patch("/home/:type/:id", upload.single("image_url"), (req, res) => {
  let {type , id} = req.params;
  let {name, lifespan, size, scientific_name, description} = req.body;
  
  if(req.file) {
    let image_url = `${type}/${req.file.filename}`;
    let q = `UPDATE ${type}
             SET name = ?, 
                 image_url = ?, 
                 lifespan = ?, 
                 size = ?, 
                 scientific_name = ?, 
                 description = ? 
                 WHERE id = ?`;
  
    connection.query(q, [name, image_url, lifespan, size, scientific_name, description, id], (err, result) => {
      if(err) {
        console.log(err);
        return res.send("Database Error");
      }
      return res.redirect(`/home/${type}`);
    })
  } else {
    let q = `UPDATE ${type} 
             SET name = ?,  
                 lifespan = ?, 
                 size = ?, 
                 scientific_name = ?, 
                 description = ? 
                 WHERE id = ?`;
  
    connection.query(q, [name, lifespan, size, scientific_name, description, id], (err, result) => {
      if(err) {
        console.log(err);
        return res.send("Database Error");
      }
      return res.redirect(`/home/${type}`);
    })
  }
})

// Delete the category animal
app.delete("/home/:type/:id", (req, res) => {
  let { type, id } = req.params;
  let q = `DELETE FROM ${type} WHERE id = ?`;

  connection.query(q, [id], (err, result) => {
    if(err) {
      console.log(err);
      return res.send("Database Error");
    }
    return res.redirect(`/home/${type}`);
  })
})
