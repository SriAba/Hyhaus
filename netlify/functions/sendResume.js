const nodemailer = require('nodemailer');
const formidable = require('formidable');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Netlify passes raw multipart body as base64
  const form = new formidable.IncomingForm({ multiples: false });

  // Parse the multipart body
  return new Promise((resolve, reject) => {
    // formidable expects a Node.js req object, so we need to fake one
    // This workaround assumes Netlify passes the body as base64
    const req = {
      headers: event.headers,
      method: event.httpMethod,
      // formidable expects a stream, so we need to implement a minimal readable stream
      on: (evt, cb) => {
        if (evt === 'data') cb(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
        if (evt === 'end') cb();
      },
    };

    form.parse(req, async (err, fields, files) => {
      if (err) {
        resolve({ statusCode: 500, body: 'Formidable error: ' + err.message });
        return;
      }

      const { name, email, phone, referrer, address, skills, job } = fields;
      const resumeFile = files.resume;

      // Gmail setup
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER, // Set as Netlify env var
          pass: process.env.GMAIL_PASS, // Set as Netlify env var (App Password)
        },
      });

      // Prepare mail options
      let mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER, // or another recipient
        subject: `New Career Application: ${name}`,
        text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Referrer: ${referrer}
Address: ${address}
Skills: ${skills}
Job Applying For: ${job}
        `,
        attachments: [
          {
            filename: resumeFile.originalFilename,
            content: require('fs').readFileSync(resumeFile.filepath),
          },
        ],
      };

      try {
        await transporter.sendMail(mailOptions);
        resolve({ statusCode: 200, body: 'Resume submitted & emailed successfully!' });
      } catch (error) {
        resolve({ statusCode: 500, body: 'Error sending email: ' + error.message });
      }
    });
  });
};