var exec = require('child_process').exec;

var re = /Received = [1-9]/;

exec('ping 192.168.2.124', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(`determination: ${re.test(stdout)
        ? 'ALIVE'
        : 'DEAD'}`);
});
console.log('stuff has happened');