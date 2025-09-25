const nodemailer = require('nodemailer');
const { Busboy } = require('busboy');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const contentType = event.headers['content-type'] || event.headers['Content-Type'];
  const busboy = new Busboy({ headers: { 'content-type': contentType } });

  let fields = {};
  let resumeBuffer = null;
  let resumeFilename = '';

  return new Promise((resolve, reject) => {
    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

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
      if (!fields.name || !fields.email || !fields.phone || !fields.skills || !fields.job || !resumeBuffer) {
        resolve({ statusCode: 400, body: 'Missing required fields or resume.' });
        return;
      }

      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      const mailText = `
Name: ${fields.name}
Email: ${fields.email}
Phone: ${fields.phone}
Referrer: ${fields.referrer || 'N/A'}
Address: ${fields.address}
Skills: ${fields.skills}
Job Applying For: ${fields.job}
      `;

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

    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    busboy.end(bodyBuffer);
  });
};