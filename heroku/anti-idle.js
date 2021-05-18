/**
 * 
 * @param {string} id 
 */
module.exports = function (id) {
    let http = require('http');
    let port = process.env.PORT || 3000;
    let rp = require('request-promise');

    const server = http.createServer(function(req, res) {
        req.on('data', function(chunk) {
            res.write('data');
        });
        req.on('end', function() {
            console.log(
                `${process.env.PORT
                    ? ''
                    : '\x1b[33m'}[${global.currentDS.name}]${process.env.PORT
                    ? ''
                    : '\x1b[0m'} ${process.env.PORT
                    ? ''
                    : '\x1b[36m'}[discord.short.anti-idle] Server Success${process.env.PORT
                    ? ''
                    : '\x1b[0m'}`
            );
            res.end();
        });
    });

    server.listen(port, function(error) {
        if (error) {
            console.log(
                `${process.env.PORT
                    ? ''
                    : '\x1b[33m'}[${global.currentDS.name}]${process.env.PORT
                    ? ''
                    : '\x1b[0m'} ${process.env.PORT
                    ? ''
                    : '\x1b[31m'}[discord.short.anti-idle] Something went wrong while running the dummy server:\n${process.env.PORT
                    ? ''
                    : '\x1b[0m'}` + error
            );
        } else {
            console.log(
                `${process.env.PORT
                    ? ''
                    : '\x1b[33m'}[${global.currentDS.name}]${process.env.PORT
                    ? ''
                    : '\x1b[0m'} ${process.env.PORT
                    ? ''
                    : '\x1b[36m'}[discord.short.anti-idle] Dummy server is listening on port https://localhost:${port}${process.env.PORT
                    ? ''
                    : '\x1b[0m'}`
            );
        }
    });
    
    setInterval(function() {
        rp(`https://${id.heroku.name}.herokuapp.com/`)
            .then(function(html) {
                console.log(`${process.env.PORT ? '' : '\x1b[33m'}[${global.currentDS.name}]${process.env.PORT ? '' : '\x1b[0m'} ${process.env.PORT ? '' : '\x1b[36m'}[discord.short.anti-idle] Requesting Success${process.env.PORT ? '' : '\x1b[0m'}`);
            })
            .catch(function(err) {
                console.log(`${process.env.PORT ? '' : '\x1b[33m'}[${global.currentDS.name}]${process.env.PORT ? '' : '\x1b[0m'} ${process.env.PORT ? '' : '\x1b[31m'}[discord.short.anti-idle] Requesting Error:\n${process.env.PORT ? '' : '\x1b[0m'}` + err);
            });
    }, 20 * 60 * 1000);
}