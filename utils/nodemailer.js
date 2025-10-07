
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: "hoshinoai9492@gmail.com",
    pass: "fhdd gkip lrsc upik" // App-specific password
  }
});

module.exports = transporter;