const express = require('express')
const app = express()
require("dotenv").config()
const bcrypt = require('bcrypt')
const Pool = require('pg').Pool 
const session = require('express-session')

/* CONNECTING POSTGRES TO EXPRESS ------------- */

var pg = require('pg');
var pool = new pg.Client(process.env.LINK);
pool.connect();

/* MIDDLEWARE ----------------------------- */

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(session({
    secret:'secret',
    cookie:{maxAge:60000},
    resave: false,
    saveUninitialized: false
}))

/* LOCAL VARIABLE ----------------------------- */

let registerSuccess = null
let loginSuccess = null
let welcomeUser = null

/* GET REQUESTS ----------------------------- */

app.get('/',(req,res)=>{
    if(loginSuccess===true){
        res.render('homepage.ejs',{username:welcomeUser})
    } else{
       res.redirect('/login') 
    } 
    
})

app.get('/login',(req,res)=>{
    res.render('login.ejs',{isLoggedIn:loginSuccess})
    loginSuccess = null
})

app.get('/register',(req,res)=>{
    res.render('register.ejs',{ isRegistered: registerSuccess})
    registerSuccess=null
})

app.get('/homepage',(req,res)=>{
    res.render('homepage.ejs')
})

/* POST REQUESTS ----------------------------- */

app.post('/register',async(req,res)=>{
    try{
        const {first_name, last_name, email, password} = req.body
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await pool.query('INSERT INTO user_list (first_name, last_name, email, password) VALUES ($1,$2,$3,$4)',
        [first_name, last_name, email, hash])

        registerSuccess = true
        res.redirect('/register')
    } catch(e){
        console.log(e.message)
        registerSuccess = false
        res.redirect('/register')
    }
})

app.post('/login',async(req,res)=>{
    const {email, password} = req.body
    const checkingEmail = await pool.query('select * from user_list where email = $1',[email])
    if(checkingEmail.rows[0]){
        const matchedPassword = await bcrypt.compare(password, checkingEmail.rows[0].password);
        if(matchedPassword){
            loginSuccess = true
            welcomeUser = checkingEmail.rows[0].first_name
            res.redirect('/')
        } else {
            console.log('incorrect password')
            loginSuccess = false
            res.redirect('/login')
        }
    } else {
        console.log('incorrect email')
        loginSuccess = false
        res.redirect('/login')
    }
})

/* STARTING SERVER ----------------------------- */

app.listen(1234,()=>{
    console.log('Server running on Port 1234')
})