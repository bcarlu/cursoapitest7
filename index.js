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

const userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: Date,
  }]
});

const User = mongoose.model('User', userSchema)

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

app.post('/api/users/:_id/exercises', (req, res) => {
  // let id = req.body._id
  let id = req.body.id
  let description = req.body.description
  let duration = req.body.duration
  let date = req.body.date ? req.body.date : new Date()
  //let count = {count: count+1}
  let log = {
    log: {
      description: description,
      duration: duration,
      date: date
    }
  }

  User.findByIdAndUpdate(id, {$push: log, count: +1}, {new: true }, function(err, data) {
    if (err) return console.error(err);
    // console.log(data)
    res.json({_id: id, username: data.username, date: new Date(date).toDateString(), duration: duration, description: description})
  })
});

app.get('/api/users/:_id/logs', (req, res) => {
  let from = req.query.from ? new Date(req.query.from) : false
  let to = req.query.to ? new Date(req.query.to) : false
  let limit = req.query.limit ? req.query.limit : false
  let id = req.params._id
  
  User.findById(id, function (err, data) {
    if (err) return console.error(err);

    let log = data.log

    if(from && to){
      // console.log("Fecha: ",date[0])
      let newLog = log.filter(log => { 
        // console.log("fecha db: ", new Date(log.date).getTime())
        // console.log("fecha req: ", from.getTime())
        return new Date(log.date).getTime() >= from.getTime() && new Date(log.date).getTime() <= to.getTime()
      })

      newLog = limit && limit != "" ? newLog.slice(0,limit) : newLog
      // console.log("Nuevo log: ",newLog.slice(0,limit))
      res.json({_id: id, username: data.username, from: from.toDateString(), to: to.toDateString(), count: newLog.length, log: newLog.map(log => {
        return {description:log.description, duration:log.duration, date:log.date.toDateString()}
      })})
    } 
    
    else {  
      res.json({_id: id, username: data.username, count: data.log.length, log: log.map(log => {
        return {description:log.description, duration:log.duration, date:log.date.toDateString()}
      })})   
    }
  });
 
});

// app.get('/api/users/:_id/logs', (req, res) => {
//   // let from = req.query.from ? req.query.from : false
//   // let to = req.query.to ? req.query.to : false
//   let limit = req.query.limit ? req.query.limit : false

//   const from = new Date("2023-04-29");
//   const to = new Date("2023-04-30");

//   let id = req.params._id

//   User.aggregate([
//     {
//       $match: {
//         log: {
//           $elemMatch: {
//             date: {
//               $gte: from,
//               $lte: to
//             }
//           }
//         }
//       }
//     },
//     {
//       $project: {
//         username: 1,
//         count: 1,
//         log: 1
//       }
//     }
//   ], function(err, resultados) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.dir(resultados, { depth: null });
//     }
//   })

//   // if(from && to){
//   //   User.aggregate([
//   //     {
//   //       $match: {
//   //         _id: id
//   //       }
//   //     },
//   //     {
//   //       $match: {
//   //         log: {
//   //           $elemMatch: {
//   //             date: {
//   //               $gte: from,
//   //               $lte: to
//   //             }
//   //           }
//   //         }
//   //       }
//   //     },
//   //     {
//   //       $project: {
//   //         _id: 1,
//   //         username: 1,
//   //         count: 1,
//   //         log: {
//   //           $slice: [
//   //             {
//   //               $map: {
//   //                 input: "$log",
//   //                 as: "item",
//   //                 in: {
//   //                   $cond: [
//   //                     {
//   //                       $and: [
//   //                         { $gte: [ "$$item.date", from ] },
//   //                         { $lte: [ "$$item.date", to ] }
//   //                       ]
//   //                     },
//   //                     "$$item",
//   //                     null
//   //                   ]
//   //                 }
//   //               }
//   //             },
//   //             1
//   //           ]
//   //         }
//   //       }
//   //     }
//   //   ]).exec(function(err, resultados) {
//   //     if (err) {
//   //       console.log(err);
//   //     } else {
//   //       console.dir(resultados, { depth: null });
//   //     }
//   //   });
//   // } else {
//   //   User.findById(id, function(err, data) {
//   //     if (err) return console.error(err);
//   //     console.log(data)
//   //     res.json({username: data.username, _id: data._id, count: data.count, log: data.log})
//   //   })
//   // }
// });



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
