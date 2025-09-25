const nodemailer = require('nodemailer');
const multiparty = require('multiparty');

exports.handler = async function(event, context) {
  return new Promise((resolve) => {
    const form = new multiparty.Form();

    form.parse(event, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return resolve({ statusCode: 500, body: "Form parsing failed" });
      }

      const name = fields.name[0];
      const email = fields.email[0];
      const resumeFile = files.resume[0];

      // Create transporter (Gmail example)
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'abakarisriranga@gmail.com',
          pass: 'Rambo@2965' // use Gmail app password
        }
      });

      // 1️⃣ Send email to HR
      let mailToHR = {
        from: email,
        to: 'prvnprvn1990@gmail.com',
        subject: `Resume Submission - ${name}`,
        text: `Candidate Name: ${name}\nEmail: ${email}`,
        attachments: [
          {
            filename: resumeFile.originalFilename,
            path: resumeFile.path
          }
        ]
      };

      // 2️⃣ Send thank you email to candidate
      let mailToCandidate = {
        from: 'hr@hyhaus.com',
        to: email,
        subject: 'Thank you for applying',
        text: `Hi ${name},\n\nThank you for applying! We have received your resume and will get back to you soon.\n\nBest regards,\nYour Company`
      };

      try {
        // Send both emails
        await transporter.sendMail(mailToHR);
        await transporter.sendMail(mailToCandidate);

        resolve({ statusCode: 200, body: "Resume emailed successfully! Candidate also notified." });
      } catch (e) {
        console.error(e);
        resolve({ statusCode: 500, body: "Error sending emails." });
      }
    });
  });
};
