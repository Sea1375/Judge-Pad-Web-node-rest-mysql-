//Dependencies - Express 4.x and the MySQL Connection
module.exports = (express, connection) => {
	const router      = express.Router();

	//NewJudgePad
	router.route('/judge/login/get-id')
		.post((req, res) => {
			const query = connection.query('SELECT judge.id as id FROM user, judge WHERE user.username=? and user.password=? and user.id=judge.userId',
				[req.body["username"], req.body["password"]], (err, rows, fields) => {
					if(err){
						console.error(err);
						res.sendStatus(404);
					}else{
						if(rows.length > 0) {
							res.status(200).jsonp({id: rows[0].id}).end();
						} else {
							res.status(200).jsonp({id: 0}).end();
						}
					}
				});
		});
	router.route('/judge/register')
		.post((req, res) => {
			const query = connection.query('INSERT INTO user SET ?', [req.body], (err, result) => {
				if(err){
					console.error(err);
					res.sendStatus(404);
				} else {
					res.status(201);
					//res.location('/api/panoramas/' + result.insertId);
					res.end();
				}
			});
		});
	router.route('/judge/reset')
		.post((req, res) => {
			const query = connection.query('UPDATE user SET name=? and username=? and email=? and password=?' +
				' WHERE username=? and password=?', [req.body['name'], req.body['username'], req.body['email'], req.body['password'],
				req.body['oldUsername'], req.body['oldPassword']], (err, result) => {
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
		});
	router.route('/recorder/login')
		.post((req, res) => {
			const query = connection.query('SELECT id FROM user WHERE username=? and password=?',
				[req.body["username"], req.body["password"]], (err, rows, fields) => {
					if(err){
						console.error(err);
						res.sendStatus(404);
					}else{
						if(rows.length > 0) {
							const id = rows[0].id;
							const subQuery = connection.query('SELECT userId FROM admin WHERE userId=?',
								[id], (err, rows, fields) => {
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
	return router;
};
