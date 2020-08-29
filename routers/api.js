//Dependencies - Express 4.x and the MySQL Connection
const md5 = require('md5');

module.exports = (express, connection) => {
	const router      = express.Router();

	//NewJudgePad
	router.route('/judge/login/get-id')
		.post((req, res) => {
			const pass = md5(req.body['password']);
			const query = connection.query('SELECT judge.id as id FROM user, judge WHERE user.username=? and user.password=? and user.id=judge.userId',
				[req.body["username"], pass], (err, rows, fields) => {
					if(err){
						console.error(err);
						res.sendStatus(404);
					}else{
						if(rows.length > 0) {
							res.status(200).jsonp({id: rows[0].id}).end();
						} else {
							res.status(401).end();
						}
					}
				});
		});
	router.route('/judge/register')
		.post((req, res) => {
			const pass = md5('divingandjudgepad');
			console.log(pass);
			const query = connection.query('INSERT INTO user SET ?', [req.body], (err, result) => {
				if(err){
					console.error(err);
					res.sendStatus(404);
				} else {
					const pass = md5(req.body['password']);
					connection.query('UPDATE user SET password=? WHERE email=?', [pass, req.body['email']], (err, result) => {
						if(err){
							console.error(err);
							res.sendStatus(404);
						} else {

							res.status(201);
							//res.location('/api/panoramas/' + result.insertId);
							res.end();
						}
					});
				}
			});
		});
	router.route('/judge/reset')
		.post((req, res) => {
			const pass = md5(req.body['password']);
			const query = connection.query('UPDATE user SET password=?' +
				' WHERE email=?', [pass, req.body['email']], (err, result) => {
				if(err){
					console.error(err);
					res.sendStatus(404);
				} else {
					if(result.changedRows > 0) {
						res.status(201).json({status: true});
					} else {
						res.status(201).json({status: false});
					}
					res.end();
				}
			});
			console.log(query.sql);
		});
	router.route('/judge/get/name-judgeNumber-diveCode/:id')
		.get((req, res) => {
			const query = connection.query('SELECT user.name, judge.judgeNumber, admin.diveCode ' +
				'FROM user, judge, admin WHERE judge.id=? and judge.userId=user.id and judge.userId=admin.userId',
				[req.params.id], (err, rows, fields) => {
				if(err){
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
				if(err){
					console.error(err);
					res.sendStatus(404);
				} else {
					if(result.changedRows > 0) {
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
					if(err){
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
				if(err){
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
				if(err){
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
				if(err){
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
				if(err){
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
					if(err){
						console.error(err);
						res.sendStatus(404);
					}else{
						if(rows.length > 0) {
							const id = rows[0].id;
							const subQuery = connection.query('SELECT * FROM admin, judge WHERE admin.userId=? or (judge.backend=1 and judge.userId=?)',
								[id,id], (err, rows, fields) => {
									if(err){
										console.error(err);
										res.sendStatus(404);
									}else{
										if(rows.length > 0)	res.status(200).jsonp({isValid: true}).end();
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
				if(err){
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
				if(err){
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
				if(err){
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
				if(err){
					console.error(err);
					res.sendStatus(404);
				} else {
					if(rows.length > 0) {
						res.status(200).jsonp({isValid: true});
					} else {
						res.status(200).jsonp({isValid: false});
					}
				}
			});
		});
	return router;

};
