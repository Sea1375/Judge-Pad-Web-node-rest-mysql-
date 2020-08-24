//Dependencies - Express 4.x and the MySQL Connection
module.exports = (express, connection) => {
	const router      = express.Router();

	// Router Middleware
	router.use((req, res, next) => {
	    // log each request to the console
	    console.log("You have hit the /api", req.method, req.url);

	    // Remove powered by header
	    //res.set('X-Powered-By', ''); // OLD WAY
	    //res.removeHeader("X-Powered-By"); // OLD WAY 2
	    // See bottom of script for better way

	    // CORS 
	    res.header("Access-Control-Allow-Origin", "*"); //TODO: potentially switch to white list version
	    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

	    // we can use this later to validate some stuff

	    // continue doing what we were doing and go to the route
	    next();
	});

	// API ROOT - Display Available Routes
	router.get('/', (req, res) => {
/*		//TODO: THIS NO LONGER WORKS BECAUSE WE MOVE THE ROUTES INTO A SEPARATE FILE, UNLESS I PASS IN APP AS WELL
	    //Generate a List of Routes on the APP
	    //http://stackoverflow.com/a/28199817
	    const route, routes = [];
	    app._router.stack.forEach((middleware) => {
	        if(middleware.route){ // routes registered directly on the app
	            routes.push(middleware.route);
	        } else if(middleware.name === 'router'){ // router middleware 
	            middleware.handle.stack.forEach((handler) => {
	                route = handler.route;
	                route && routes.push(route);
	            });
	        }
	    });
	    console.log(routes)
*/
	    res.jsonp({
	        name: 'Panorama API', 
	        version: '1.0',
//	        routes: routes // TODO: format this better, after above is fixed
	    });

	});

	// Simple MySQL Test
	router.get('/test', (req, res) => {
	    let test;
	    
	    connection.query('SELECT 1 + 1 AS solution', (err, rows, fields) => {
	        if (err) throw err;

	        test = rows[0].solution;

	        res.jsonp({
	            'test': test
	        });
	    }); 
	});

	// http://www.restapitutorial.com/lessons/httpmethods.html
	// POST - Create
	// GET - Read
	// PUT - Update/Replace - AKA you pass all the data to the update
	// PATCH - Update/Modify - AKA you just pass the changes to the update
	// DELETE - Delete

	// COLLECTION ROUTES
	router.route('/panoramas')
	    //we can use .route to then hook on multiple verbs
	    .post((req, res) => {
	        const data = req.body; // maybe more carefully assemble this data
	        console.log(req.body);
	        const query = connection.query('INSERT INTO panos SET ?', [data], (err, result) => {
	            if(err){
	                console.error(err);
	                res.sendStatus(404);
	            }else{
	                res.status(201);
	                res.location('/api/panoramas/' + result.insertId);
	                res.end();
	            }
	        });
	        console.log(query.sql);
	    })

	    .get((req, res) => {
	        const query = connection.query('SELECT * FROM panos', (err, rows, fields) => {
	            if (err) console.error(err);

	            res.jsonp(rows);
	        });
	        console.log(query.sql);
	    })

	    //We do NOT do these to the collection
	    .put((req, res) => {
	        //res.status(404).send("Not Found").end();
	        res.sendStatus(404);
	    })
	    .patch((req, res) => {
	        res.sendStatus(404);
	    })
	    .delete((req, res) => {
	        // LET's TRUNCATE TABLE..... NOT!!!!!
	        res.sendStatus(404);
	    });
	//end route

	// http://www.restapitutorial.com/lessons/httpmethods.html
	// POST - Create
	// GET - Read
	// PUT - Update/Replace - AKA you pass all the data to the update
	// PATCH - Update/Modify - AKA you just pass the changes to the update
	// DELETE - Delete

	// COLLECTION ROUTES
	router.route('/auth/:id')
		//we can use .route to then hook on multiple verbs
		.post((req, res) => {
			const data = req.body;
			const reqId = req.params.id;
			console.log(data);
			const query = connection.query('SELECT * FROM authentication WHERE judge_id=?', [req.params.id], (err, rows, fields) => {
				if (err) {
					//INVALID
					console.error(err);
					res.sendStatus(404);
				}else{
					if(rows.length){
						const query = connection.query('UPDATE authentication SET ? WHERE judge_id=?', [data, reqId], (err, result) => {
							if(err){
								console.log(err);
								res.sendStatus(404);
							}else{
								res.status(200).jsonp({changedRows:result.changedRows, affectedRows:result.affectedRows}).end();
							}
						})
						console.log(query.sql)
					}else{
						data["judge_id"] = reqId;
						console.log(data);
						const query = connection.query('INSERT INTO authentication SET ?', [data], (err, result) => {
							if(err){
								console.error(err);
								res.sendStatus(404);
							} else {
								res.status(201);
								//res.location('/api/panoramas/' + result.insertId);
								res.end();
							}
						});
						console.log(query.sql);
					}
				}
			});
			console.log(query.sql);
		});

	router.route('/auth/valid/:id')
		.post((req, res) => {
			const query = connection.query('SELECT * from authentication WHERE judge_id=? and judge_email=? and judge_password=? and judge_available=true',
				[req.params.id, req.body["judge_email"], req.body["judge_password"]], (err, rows, fields) => {
					if(err){
						console.error(err);
						res.sendStatus(404);
					}else{
						res.status(200).jsonp({isValid:rows.length > 0}).end();
					}
			});
		});

	router.route('/auth/all')
		.get((req, res) => {
			const query = connection.query('SELECT * from authentication', [], (err, rows, fields) => {
				if(err){
					console.error(err);
					res.sendStatus(404);
				}else{
					res.status(200).jsonp(rows);
				}
			});
		});

	router.route('/auth/:id')
		.get((req, res) => {
			const query = connection.query('SELECT * from authentication WHERE judge_id=?', [req.params.id], (err, rows, fields) => {
				if (err) {
					console.error(err);
					res.sendStatus(404);
				} else {
					res.status(200).jsonp(rows);
				}
			});
		});
	router.route('/score/judge/:id')
		.post((req, res) => {
			const data = req.body;
			const reqId = req.params.id;
			console.log(data);
			const query = connection.query('SELECT * FROM score WHERE judge_id=?', [req.params.id], (err, rows, fields) => {
				if (err) {
					//INVALID
					console.error(err);
					res.sendStatus(404);
				}else{
					if(rows.length){
						const query = connection.query('UPDATE score SET ? WHERE judge_id=?', [data, reqId], (err, result) => {
							if(err){
								console.log(err);
								res.sendStatus(404);
							}else{
								res.status(200).jsonp({changedRows:result.changedRows, affectedRows:result.affectedRows}).end();
							}
						})
						console.log(query.sql)
					}else{
						data["judge_id"] = reqId;
						console.log(data);
						const query = connection.query('INSERT INTO score SET ?', [data], (err, result) => {
							if(err){
								console.error(err);
								res.sendStatus(404);
							} else {
								res.status(201);
								//res.location('/api/panoramas/' + result.insertId);
								res.end();
							}
						});
						console.log(query.sql);
					}
				}
			});
			console.log(query.sql);
		});

	router.route('/score/recorder/:id')
		.post((req, res) => {
			const data = req.body;
			const reqId = req.params.id;
			console.log(data);
			const query = connection.query('SELECT * FROM score WHERE judge_id=?', [req.params.id], (err, rows, fields) => {
				if (err) {
					//INVALID
					console.error(err);
					res.sendStatus(404);
				}else{
					if(rows.length){
						const query = connection.query('UPDATE score SET ? WHERE judge_id=?', [data, reqId], (err, result) => {
							if(err){
								console.log(err);
								res.sendStatus(404);
							}else{
								res.status(200).jsonp({changedRows:result.changedRows, affectedRows:result.affectedRows}).end();
							}
						})
						console.log(query.sql)
					}else{
						data["judge_id"] = reqId;
						console.log(data);
						const query = connection.query('INSERT INTO score SET ?', [data], (err, result) => {
							if(err){
								console.error(err);
								res.sendStatus(404);
							} else {
								res.status(201);
								//res.location('/api/panoramas/' + result.insertId);
								res.end();
							}
						});
						console.log(query.sql);
					}
				}
			});
			console.log(query.sql);
		});

	router.route('/score/all')
		.get((req, res) => {
			const query = connection.query('SELECT score.judge_id, score.judge_name, score.judge_score, score.message_from_judge, score.message_to_judge' +
				' from score, authentication ' +
				'WHERE authentication.judge_id=score.judge_id AND authentication.judge_available=true',
				[], (err, rows, fields) => {
				if(err){
					console.error(err);
					res.sendStatus(404);
				}else{
					res.status(200).jsonp(rows);
				}
			});
		});
	router.route('/score/:id')
		.get((req, res) => {
			const query = connection.query('SELECT * from score WHERE judge_id=?',
				[req.params.id], (err, rows, fields) => {
					if(err){
						console.error(err);
						res.sendStatus(404);
					}else{
						res.status(200).jsonp(rows);
					}
				});
		});
		// .get((req, res) => {
		// 	const query = connection.query('SELECT * FROM panos', (err, rows, fields) => {
		// 		if (err) console.error(err);
		//
		// 		res.jsonp(rows);
		// 	});
		// 	console.log(query.sql);
		// })

		//We do NOT do these to the collection
		// .put((req, res) => {
		// 	//res.status(404).send("Not Found").end();
		// 	res.sendStatus(404);
		// })
		// .patch((req, res) => {
		// 	res.sendStatus(404);
		// })
		// .delete((req, res) => {
		// 	// LET's TRUNCATE TABLE..... NOT!!!!!
		// 	res.sendStatus(404);
		// });
	//end route

	// SPECIFIC ITEM ROUTES
	router.route('/panoramas/:id')
	    .post((req, res) => {
	        //specific item should not be posted to (either 404 not found or 409 conflict?)
	        res.sendStatus(404);
	    })

	    .get((req, res) => {
	        const query = connection.query('SELECT * FROM panos WHERE id=?', [req.params.id], (err, rows, fields) => {
	            if (err) {
	                //INVALID
	                console.error(err);
	                res.sendStatus(404);
	            }else{
	                if(rows.length){
	                    res.jsonp(rows);
	                }else{
	                    //ID NOT FOUND
	                    res.sendStatus(404);
	                }
	            }
	        });
	        console.log(query.sql);
	    })

	    .put((req, res) => {
	        const data = req.body;
	        const query = connection.query('UPDATE panos SET ? WHERE id=?', [data, req.params.id], (err, result) => {
	            if(err){
	                console.log(err);
	                res.sendStatus(404);
	            }else{
	                res.status(200).jsonp({changedRows:result.changedRows, affectedRows:result.affectedRows}).end();
	            }
	        })
	        console.log(query.sql)
	    })

	    .patch((req, res) => {
	        // Need to decide how much this should differ from .put
	        //in theory (hmm) this should require all the fields to be present to do the update?
	    })

	    .delete((req, res) => {
	        //LIMIT is somewhat redundant, but I use it for extra sanity, and so if I bungle something I only can break one row.
	        const query = connection.query('DELETE FROM panos WHERE id=? LIMIT 1', [req.params.id], (err, result) => {
	            if(err){
	                console.log(err);
	                res.sendStatus(404);
	            }else{
	                res.status(200).jsonp({affectedRows:result.affectedRows}).end();
	            }
	        });
	        console.log(query.sql)
	    });
	router.route('/judge/:id')
		//we can use .route to then hook on multiple verbs
		.post((req, res) => {
			const data = req.body;
			const reqId = req.params.id;
			console.log(req.params.id);
			const query = connection.query('SELECT * FROM judge WHERE id=?', [req.params.id], (err, rows, fields) => {
				if (err) {
					//INVALID
					console.error(err);
					res.sendStatus(404);
				} else {
					if(rows.length){
						const query = connection.query('UPDATE judge SET ? WHERE id=?', [data, reqId], (err, result) => {
							if(err){
								console.log(err);
								res.sendStatus(404);
							}else{
								res.status(200).jsonp({changedRows:result.changedRows, affectedRows:result.affectedRows}).end();
							}
						})
						console.log(query.sql)
					}else{
						data["id"] = reqId;
						const query = connection.query('INSERT INTO judge SET ?', [data], (err, result) => {
							if(err){
								console.error(err);
								res.sendStatus(404);
							} else {
								res.status(201);
								//res.location('/api/panoramas/' + result.insertId);
								res.end();
							}
						});
						console.log(query.sql);
					}
				}
			});
			console.log(query.sql);
		});
	router.route('/judges')
		.get((req, res) => {
			const query = connection.query('SELECT id, name, available, score, msg_from_recorder, msg_to_recorder FROM judge', [], (err, rows, fields) => {
				if(err){
					console.error(err);
					res.sendStatus(404);
				} else {
					res.status(200).jsonp(rows);
				}
			});
		});
	router.route('/judge/:id')
		.get((req, res) => {
			const query = connection.query('SELECT id, name, available, score, msg_from_recorder, msg_to_recorder ' +
				'FROM judge WHERE id=?', [req.params.id], (err, rows, fields) => {
				if(err){
					console.error(err);
					res.sendStatus(404);
				} else {
					res.status(200).jsonp(rows);
				}
			});
		});
	router.route('/judge/:id/secret')
		.post((req, res) => {
			console.log(req.params.id);
			const query = connection.query('SELECT * FROM judge WHERE id=? and email=? and password=? and available=true',
			[req.params.id, req.body["email"], req.body["password"]], (err, rows, fields) => {
				if(err){
					console.error(err);
					res.sendStatus(404);
				}else{
					res.status(200).jsonp({isValid:rows.length > 0}).end();
				}
			});
		});

	//end route

	return router;
};
