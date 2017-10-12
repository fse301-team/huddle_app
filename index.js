const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const firebase = require('firebase')
const port = process.env.PORT || 3000

// initialize Firebase
firebase.initializeApp({
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: ''
})

// app settings
app.set('view engine', 'pug')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
// app.use(express.static(path.join(__dirname + '** dir_name for css & js files')))

const firebaseLogin = (email, password, callback) => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // if there's a user logged in already
      return callback(null)
    } else {
      // try to sign in
      const promise = firebase.auth().signInWithEmailAndPassword(email, password)

      // sign in successful
      promise.then((user) => {
        // do something with user's info
        return callback(null)
      })

      // sign in failed
      .catch((error) => {
        switch (error.code) {
          case 'auth/user-not-found' : error.message = 'Your email is not registered.'
            break
          case 'auth/wrong-password' : error.message = 'Your password is incorrect'
            break
          case 'auth/invalid-email' : error.message = 'Your email is invalid'
            break
        }
        return callback(error.message)
      })
    }
  })
}

const firebaseRegister = (credential, callback) => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // if there's user logged in already
      return callback(null)
    } else {
      // try to create new user
      const promise = firebase.auth().createUserWithEmailAndPassword(credential.email, credential.password)

      // user creation successful
      promise.then((user) => {
        user.updateProfile({
          displayName: credential.name
        })
        firebase.database().ref('/users/' + user.uid + '/info/').set({
          // save necessary user info in database
        })
        return callback(null)
      })
      // user creation failed
      .catch((error) => {
        switch (error.code) {
          case 'auth/email-already-in-use' : error.message = 'Your email is already registered.'
            break
          case 'auth/weak-password' : error.message = 'Your password is weak'
            break
          case 'auth/invalid-email' : error.message = 'Your email is invalid'
            break
        }
        return callback(error.message)
      })
    }
  })
}

const readDashboardInfo = (user, callback) => {
  // read user's info from database
  firebase.database.ref('/users/' + user.uid)
  return callback()
}

app.listen(port, () => {
  console.log('app listening on port ' + port)
})

// main page
app.get('/', (request, response) => {
  response.render('index')
})

// login page
app.get('/access', (request, response) => {
  response.render('access')
})

// dashboard page
app.get('/dashboard', (request, response) => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      response.render('dashboard')
    }
    else {
      response.redirect('/access')
    }
  })
})

// from login/register page, user wants to log in
app.post('/login', (request, response) => {
  let callbackControl = false
  firebaseLogin(request.body.email, request.body.password, (error) => {
    if (error) {
      return response.render('access', {alert: error})
    }
    readDashboardInfo(() => {
      !callbackControl ? callbackControl = true : response.redirect('/dashboard')
    })
  })
})

// from login/register page, user wants to register
app.post('/register', (request, response) => {
  firebaseRegister(request.body, (error) => {
    if (error) {
      return response.render('access', {alert: error})
    }
    readDashboardInfo(() => {
      response.render('dashboard')
    })
  })
})

app.get('/logout', (request, response) => {
  firebase.auth().signOut().then(() => {
    response.render('access', {alert: 'You are logged out'})
  })
})
