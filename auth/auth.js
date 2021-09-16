const request = require('request');

module.exports = {
    login: (login, password, callback) => {
        console.log("login");
        request.post('http://localhost:5000/login', {json: {login: login, pass: password}}, (err, res, body) => {
            callback(body);
        });
    },
    authenticate: (jwt, callback) =>{
        request.post('http://localhost:5000/authenticate', {json: {jwt: jwt}}, (err, res, body) => {
            callback(body);
        });
    },
    newAccount: (login, password, displayName, callback) => {
        console.log("new account");
        request.post('http://localhost:5000/new-account', {json: {login: login, pass: password, display: displayName}}, (err, res, body) => {
            callback(body);
        });
    },
    authorize: (jwt, callback) =>{
        request.post('http://localhost:5000/authorize', {json: {jwt: jwt}}, (err, res, body) => {
            callback(body);
        });
    }
}