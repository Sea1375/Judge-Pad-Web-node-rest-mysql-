//Dependencies - Express 4.x and the MySQL Connection
const md5 = require('md5');
const nodemailer = require("nodemailer");

function generateRandomString(length = 7) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let randomString = '';
  for (let i = 0; i < length; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return randomString;
}


module.exports = (express, connection) => {
  const router = express.Router();

  //NewJudgePad
  router.route('/judge/login/get-id')
    .post((req, res) => {
      const pass = md5(req.body['password']);
      const query = connection.query('SELECT judge.id as id FROM user, judge WHERE user.username=? and user.password=? and user.id=judge.userId',
        [req.body["username"], pass], (err, rows, fields) => {
          if (err) {
            console.error(err);
            res.sendStatus(404);
          } else {
            if (rows.length > 0) {
              res.status(200).jsonp({id: rows[0].id}).end();
            } else {
              res.status(401).end();
            }
          }
        });
    });
  router.route('/judge/register')
    .post((req, res) => {
      const query = connection.query('INSERT INTO user SET ?', [req.body], (err, result) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          const pass = md5(req.body['password']);
          connection.query('UPDATE user SET password=? WHERE email=?', [pass, req.body['email']], (err, result) => {
            if (err) {
              console.error(err);
              res.sendStatus(404);
            } else {
              res.status(201).json({status: true}).end();
            }
          });
        }
      });
    });

  router.route('/judge/changeBackend/:id')
    .post((req, res) => {
      connection.query('UPDATE user SET ? WHERE id=?', [req.body, req.params.id], (err, result) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          res.sendStatus(200);
        }
      });
    });

  router.route('/judge/send')
    .get(async (req, res) => {
      try {
        const transporter = nodemailer.createTransport({
          host: "mail.brooker.cloud",
          port: 587,
          secure: false,
          auth: {
            user: 'no-reply@brooker.cloud',
            pass: 'hviatecr77'
          },
          tls: {rejectUnauthorized: false},
        });
        // send mail with defined transport object
        await transporter.sendMail({
          from: 'no-reply <no-reply@brooker.cloud>',
          to: 'captainsuper328@gmail.com',
          subject: "Reset Link",
          html: `<p>This is just a placeholder.</p>`
        });
      } catch (e) {
        console.log('error while sending email: ', e);
      }
      res.sendStatus(200).end();
    });

  router.route('/judge/password-reset')
    .post((req, res) => {
      connection.query('SELECT userId, createDate, expireDate FROM resetlink WHERE randomString=?', [req.body['token']], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(400).end();
          return;
        }
        if (rows.length <= 0) {
          res.status(201).json({status: false}).end();
          return;
        }
        if (Math.floor(Date.now() / 1000) > Number(rows[0].createDate) + Number(rows[0].expireDate) * 86400) {
          res.status(201).json({status: false}).end();
          return;
        }

        const pass = md5(req.body['password']);
        connection.query('UPDATE user SET password=? WHERE id=?', [pass, rows[0].userId], (err, result) => {
          if (err) {
            console.error(err);
            res.sendStatus(404);
          } else {

          }
        });

        connection.query('DELETE FROM resetlink WHERE userId=?', [rows[0].userId], (err, result) => {
          if (err) {
            console.log(err);
            res.sendStatus(404);
          } else {

          }
        });
        res.status(201).json({status: true}).end();
      });
    });

  router.route('/judge/send-email')
    .post((req, res) => {
      const email = req.body['email'];
      connection.query('SELECT id FROM user WHERE email=?', [email], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(404).end();
          return;
        }

        // user does not exist
        if (rows.length === 0) {
          res.status(400).json({status: false}).end();
          return;
        }

        // user exists
        const userId = rows[0].id;
        const randomString = generateRandomString();
        const currentDate = Math.floor(Date.now() / 1000);
        const obj = {
          userId: userId,
          createDate: currentDate,
          expireDate: 2,
          randomString: randomString
        };

        connection.query('INSERT INTO resetLink SET ?', [obj], (err, result) => {
          if (err) {
            console.error(err);
            res.sendStatus(400).end();
            return;
          }
          const transporter = nodemailer.createTransport({
            host: "mail.brooker.cloud",
            port: 587,
            secure: false,
            auth: {
              user: 'no-reply@brooker.cloud',
              pass: 'hviatecr77'
            }
          });
          // send mail with defined transport object
          const resetLink = `http://judge.brooker.cloud/judge/password-reset/${randomString}`;
          transporter.sendMail({
            from: '"YourCompany" <no-reply@brooker.cloud>',
            to: email,
            subject: "Reset Link",
            html: `Please click this <a href="${resetLink}">link</a> to reset your password`
          });
        });
        res.status(201).json({status: true}).end();
      });
    });

  router.route('/judge/get/name-judgeNumber-diveCode/:id')
    .get((req, res) => {
      const query = connection.query('SELECT user.name, judge.judgeNumber, admin.diveCode ' +
        'FROM user, judge, admin WHERE judge.id=? and judge.userId=user.id and judge.userId=admin.userId',
        [req.params.id], (err, rows, fields) => {
          if (err) {
            console.error(err);
            res.sendStatus(404);
          } else {
            res.status(200).jsonp(rows[0]);
          }
        });
    });
  router.route('/judge/write/:id')
    .post((req, res) => {
      const query = connection.query('UPDATE judge SET ? WHERE id=?', [req.body, req.params.id], (err, result) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          if (result.changedRows > 0) {
            res.status(201).json({status: true});
          } else {
            res.status(201).json({status: false});
          }
          res.end();
        }
      });
      console.log(query.sql);
    });
  router.route('/judge/read/all')
    .get((req, res) => {
      const query = connection.query('SELECT * FROM judge', [], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          res.status(200).jsonp(rows);
        }
      });
    });
  router.route('/judge/read/:id/msgFromRecorder')
    .get((req, res) => {
      const query = connection.query('SELECT msgFromRecorder FROM judge WHERE id=?', [req.params.id], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          res.status(200).jsonp(rows[0]);
        }
      });
    });
  router.route('/user/read/all')
    .get((req, res) => {
      const query = connection.query('SELECT * FROM user', [], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          res.status(200).jsonp(rows);
        }
      });
    });
  router.route('/judge/read/user-info')
    .get((req, res) => {
      const query = connection.query('SELECT judge.id, judge.userId, user.name, user.username, user.email, judge.backend ' +
        'FROM user, judge WHERE judge.userId=user.id', [], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          res.status(200).jsonp(rows);
        }
      });
    });
  router.route('/judge/read/names-with-permission')
    .get((req, res) => {
      const query = connection.query('SELECT judge.id, user.name FROM user, judge WHERE judge.userId!=0 and judge.userId=user.id', [], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          res.status(200).jsonp(rows);
        }
      });
    });
  router.route('/recorder/login')
    .post((req, res) => {
      const pass = md5(req.body['password']);
      const query = connection.query('SELECT id FROM user WHERE username=? and password=?',
        [req.body["username"], pass], (err, rows, fields) => {
          if (err) {
            console.error(err);
            res.sendStatus(404);
          } else {
            if (rows.length > 0) {
              const id = rows[0].id;
              const subQuery = connection.query('SELECT * FROM admin, user WHERE admin.userId=? or (user.backend=1 and user.id=?)',
                [id, id], (err, rows, fields) => {
                  if (err) {
                    console.error(err);
                    res.sendStatus(404);
                  } else {
                    if (rows.length > 0) res.status(200).jsonp({isValid: true}).end();
                    else res.status(200).jsonp({isValid: false}).end();
                  }
                });
            } else {
              res.status(200).jsonp({isValid: false}).end();
            }
          }
        });
    });
  router.route('/admin/diveCode')
    .get((req, res) => {
      const query = connection.query('SELECT diveCode FROM admin', [], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          res.status(200).jsonp(rows[0]);
        }
      });
    });
  router.route('/admin/diveCode')
    .post((req, res) => {
      const query = connection.query('UPDATE admin SET diveCode=?', [req.body["diveCode"]], (err, result) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          res.status(201).json();
          res.end();
        }
      });
      console.log(query.sql);
    });
  router.route('/judge/read/allPlusJudges')
    .get((req, res) => {
      const query = connection.query('SELECT id, judgeNumber, msgFromRecorder FROM judge WHERE userId!=0', [], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          res.status(200).jsonp(rows);
        }
      });
    });
  router.route('/judge/read/score/exist/:id')
    .get((req, res) => {
      const query = connection.query('SELECT * FROM judge WHERE score=0 and id=?', [req.params.id], (err, rows, fields) => {
        if (err) {
          console.error(err);
          res.sendStatus(404);
        } else {
          if (rows.length > 0) {
            res.status(200).jsonp({isValid: true});
          } else {
            res.status(200).jsonp({isValid: false});
          }
        }
      });
    });
  return router;

}
