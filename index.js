const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

app.use(cors())
app.use(express.static('public'))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// const userSchema = new mongoose.Schema({
//   username: String,
//   count: Number,
//   log: [{
//     description: String,
//     duration: Number,
//     date: Date,
//   }]
// });

const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  username: String
});

const userExercisesSchema= new mongoose.Schema({
  id_user: { type: Schema.Types.ObjectId, ref: 'User' },
  description: String,
  duration: Number,
  date: Date
})

const User = mongoose.model('User', userSchema)
const Exercises = mongoose.model('Exercises', userExercisesSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  await User.find({},'username _id', function (err, data) {
    if (err) return console.error(err);
    res.json(data)
  });
});

app.post('/api/users', (req, res) => {
  let user = {username: req.body.username}
  User.create(user, function(err, data) {
    if (err) return console.error(err);
    res.json({username: data.username, _id: data._id})
  })
});

// app.post('/api/users/:_id/exercises', (req, res) => {
//   let id = req.params._id
//   let description = req.body.description
//   let duration = req.body.duration
//   let date = req.body.date ? req.body.date : new Date()
//   let log = {
//     id_user: id,
//     description: description,
//     duration: duration,
//     date: date
//   }

//   Exercises.create(log, function(err, data) {
//     if (err) return console.error(err);
//     data.populate('id_user', function(err, userData) {
//       if (err) return console.error(err);
//       // Acceder al nombre del usuario a través del campo id_user
//       res.json({_id: id, username: userData.id_user.username, date: new Date(date).toDateString(), duration: duration, description: description})
//     })
//   })
// });

app.get('/api/users/:_id/logs', (req, res) => {
  let from = req.query.from ? new Date(req.query.from) : false
  let to = req.query.to ? new Date(req.query.to) : false
  let limit = req.query.limit ? req.query.limit : false
  let id = req.params._id

  Exercises.find({id_user: id}).populate('id_user').exec(function (err, data) {
    if (err) return console.error(err);
    
    let log = data.map(log => {
      return {description: log.description, duration: log.duration, date: new Date(log.date).toDateString()}
    }).filter(log => { 
      if (from || to){
        if (from && to){
          return new Date(log.date).getTime() >= from.getTime() && new Date(log.date).getTime() <= to.getTime()
        }
        if (from){ return new Date(log.date).getTime() >= from.getTime() }
        if (to){ return new Date(log.date).getTime() <= to.getTime()}
      } else {
        return log
      }
    })
    
    log = log.slice(0,limit ? limit : log.length)

    let resp = {
      _id: id, 
      username: data[0].id_user.username, 
      count: log.length, 
      log: log
    }

    if (from) { resp.from= from.toDateString() }
    if (to) { resp.to= to.toDateString() }

    res.json(resp)
  })
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  let id = req.params._id
  let description = req.body.description
  let duration = req.body.duration
  let date = req.body.date ? req.body.date : new Date()
  let log = {
      id_user: id,
      description: description,
      duration: duration,
      date: date
  }

  let user = await User.findById(id)

  if (user) {
    await Exercises.create(log, function(err, ExerciseData) {      
      if (err) return console.error(err);
      res.json({
        _id: id, 
        username: user.username, 
        date: new Date(ExerciseData.date).toDateString(), 
        duration: ExerciseData.duration, 
        description: ExerciseData.description
      })
    })    
  }
  
  // User.findById(id, function(err, data) {
  //   if (err) return console.error(err);
  //   Exercises.create(log, function(err, ExerciseData) {      
  //     if (err) return console.error(err);
  //     res.json({
  //       _id: id, 
  //       username: data.username, 
  //       date: new Date(date).toDateString(), 
  //       duration: duration, 
  //       description: description
  //     })
  //   })
  // })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
