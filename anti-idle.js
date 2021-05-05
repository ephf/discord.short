module.exports = function(id) {
    let http = require('http');
    let port = process.env.PORT || 3000;
    let rp = require('request-promise');

    const server = http.createServer(function(req, res) {
        req.on('data', function(chunk) {
            res.write('data');
        });
        req.on('end', function() {
            console.log('\x1b[33m[discord.short.anti-idle] Server Success');
            res.end();
        });
    });

    server.listen(port, function(error) {
        if (error) {
            console.log('\x1b[31m[discord.short.anti-idle] Something went wrong while running the dummy server:\n' + error);
        } else {
            console.log(`\x1b[33m[discord.short.anti-idle] Dummy server is listening on port https://localhost:${port}`);
        }
    });
    
    setInterval(function() {
        rp(`https://${id.heroku.name}.herokuapp.com/`)
            .then(function(html) {
                console.log('\x1b[33m[discord.short.anti-idle] Requesting Success');
            })
            .catch(function(err) {
                console.log('\x1b[31m[discord.short.anti-idle] Requesting Error:\n'+ err);
            });
    }, 20 * 60 * 1000);
}