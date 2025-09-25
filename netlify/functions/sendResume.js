const nodemailer = require('nodemailer');
const Busboy = require('busboy');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Prepare to parse multipart/form-data from base64
  const contentType = event.headers['content-type'] || event.headers['Content-Type'];
  const busboy = new Busboy({ headers: { 'content-type': contentType } });

  let fields = {};
  let resumeBuffer = null;
  let resumeFilename = '';

  return new Promise((resolve, reject) => {
    // Collect field values
    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    // Collect file
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      if (fieldname === 'resume') {
        resumeFilename = filename;
        const buffers = [];
        file.on('data', (data) => buffers.push(data));
        file.on('end', () => {
          resumeBuffer = Buffer.concat(buffers);
        });
      }
    });

    busboy.on('finish', async () => {
      // Validate required fields
      if (!fields.name || !fields.email || !fields.phone || !fields.skills || !fields.job || !resumeBuffer) {
        resolve({ statusCode: 400, body: 'Missing required fields or resume.' });
        return;
      }

      // Create nodemailer transporter
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      // Email body
      const mailText = `
Name: ${fields.name}
Email: ${fields.email}
Phone: ${fields.phone}
Referrer: ${fields.referrer || 'N/A'}
Address: ${fields.address}
Skills: ${fields.skills}
Job Applying For: ${fields.job}
      `;

      // Mail options
      let mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: `New Career Application: ${fields.name}`,
        text: mailText,
        attachments: [
          {
            filename: resumeFilename || 'resume.pdf',
            content: resumeBuffer,
          },
        ],
      };

      try {
        await transporter.sendMail(mailOptions);
        resolve({ statusCode: 200, body: 'Resume submitted & emailed successfully!' });
      } catch (error) {
        console.error(error);
        resolve({ statusCode: 500, body: 'Error sending email: ' + error.message });
      }
    });

    // Feed busboy the body as a buffer
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    busboy.end(bodyBuffer);
  });
};